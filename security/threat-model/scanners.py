from __future__ import annotations
from pathlib import Path
import json, shutil, subprocess
from models import Finding
from repository import classify


def run(command: list[str], cwd: Path, output: Path) -> int:
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("w", encoding="utf-8") as handle:
        process = subprocess.run(command, cwd=cwd, stdout=handle, stderr=subprocess.PIPE, text=True)
    if process.returncode not in (0, 1):
        raise RuntimeError(f"Command failed: {' '.join(command)}\n{process.stderr}")
    return process.returncode


def execute_scanners(repo: Path, out: Path) -> None:
    required = ["semgrep", "trivy", "gitleaks"]
    missing = [name for name in required if not shutil.which(name)]
    if missing:
        raise RuntimeError("Missing scanner executables: " + ", ".join(missing))

    run([
        "semgrep", "scan", "--config", "p/default", "--config",
        "security/threat-model/semgrep-rules.yml", "--json", "."
    ], repo, out / "semgrep.json")

    run([
        "trivy", "fs", "--format", "json", "--scanners", "vuln,secret,misconfig",
        "--output", str(out / "trivy.json"), "."
    ], repo, out / "trivy-console.txt")

    run([
        "gitleaks", "detect", "--source", ".", "--no-banner", "--redact",
        "--report-format", "json", "--report-path", str(out / "gitleaks.json"),
        "--exit-code", "1"
    ], repo, out / "gitleaks-console.txt")


def _clean(value: str, limit: int = 600) -> str:
    return " ".join((value or "").split())[:limit]


def parse_semgrep(path: Path) -> list[Finding]:
    data = json.loads(path.read_text(encoding="utf-8"))
    output = []
    for item in data.get("results", []):
        extra = item.get("extra", {})
        metadata = extra.get("metadata", {})
        file_path = item.get("path", "")
        component, service = classify(file_path)
        sev = str(extra.get("severity", "WARNING")).upper()
        output.append(Finding(
            scanner="Semgrep", rule_id=item.get("check_id", "semgrep"),
            title=_clean(extra.get("message", "Static analysis finding")),
            severity={"ERROR":"HIGH", "WARNING":"MEDIUM", "INFO":"LOW"}.get(sev, "MEDIUM"),
            confidence=str(metadata.get("confidence", "MEDIUM")).upper(),
            path=file_path, line=int(item.get("start", {}).get("line", 1)),
            evidence=_clean(extra.get("lines", extra.get("message", ""))),
            component=component, service=service,
            cwe=", ".join(metadata.get("cwe", [])) if isinstance(metadata.get("cwe"), list) else str(metadata.get("cwe", "")),
            owasp=", ".join(metadata.get("owasp", [])) if isinstance(metadata.get("owasp"), list) else str(metadata.get("owasp", "")),
            scanner_payload=item
        ))
    return output


def parse_trivy(path: Path) -> list[Finding]:
    data = json.loads(path.read_text(encoding="utf-8"))
    output = []
    for result in data.get("Results", []):
        target = result.get("Target", "")
        component, service = classify(target)
        for vuln in result.get("Vulnerabilities") or []:
            output.append(Finding(
                scanner="Trivy", rule_id=vuln.get("VulnerabilityID", "trivy-vuln"),
                title=_clean(vuln.get("Title") or vuln.get("Description") or "Vulnerable dependency"),
                severity=vuln.get("Severity", "MEDIUM").upper(), confidence="HIGH",
                path=target, line=1,
                evidence=_clean(f"{vuln.get('PkgName','')} {vuln.get('InstalledVersion','')} -> {vuln.get('FixedVersion','unfixed')}"),
                component=component, service=service,
                cwe=", ".join(vuln.get("CweIDs") or []), scanner_payload=vuln
            ))
        for issue in result.get("Misconfigurations") or []:
            cause = issue.get("CauseMetadata") or {}
            output.append(Finding(
                scanner="Trivy", rule_id=issue.get("ID", "trivy-misconfig"),
                title=_clean(issue.get("Title", "Infrastructure misconfiguration")),
                severity=issue.get("Severity", "MEDIUM").upper(), confidence="HIGH",
                path=target, line=int(cause.get("StartLine", 1) or 1),
                evidence=_clean(issue.get("Message") or issue.get("Description", "")),
                component=component, service=service, scanner_payload=issue
            ))
        for secret in result.get("Secrets") or []:
            output.append(Finding(
                scanner="Trivy", rule_id=secret.get("RuleID", "trivy-secret"),
                title=_clean(secret.get("Title", "Potential secret")), severity="CRITICAL",
                confidence=str(secret.get("Severity", "HIGH")).upper(), path=target,
                line=int(secret.get("StartLine", 1) or 1), evidence="[REDACTED SECRET EVIDENCE]",
                component=component, service=service, cwe="CWE-798", owasp="A02:2021",
                scanner_payload={"redacted": True}
            ))
    return output


def parse_gitleaks(path: Path) -> list[Finding]:
    if not path.exists() or not path.read_text(encoding="utf-8").strip():
        return []
    data = json.loads(path.read_text(encoding="utf-8"))
    output = []
    for item in data:
        file_path = item.get("File", "")
        component, service = classify(file_path)
        output.append(Finding(
            scanner="Gitleaks", rule_id=item.get("RuleID", "gitleaks"),
            title=_clean(item.get("Description", "Committed secret")),
            severity="CRITICAL", confidence="HIGH", path=file_path,
            line=int(item.get("StartLine", 1) or 1), evidence="[REDACTED SECRET EVIDENCE]",
            component=component, service=service, cwe="CWE-798", owasp="A02:2021",
            scanner_payload={"redacted": True}
        ))
    return output


def load_findings(out: Path) -> list[Finding]:
    return parse_semgrep(out / "semgrep.json") + parse_trivy(out / "trivy.json") + parse_gitleaks(out / "gitleaks.json")
