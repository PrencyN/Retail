from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
import argparse
import hashlib
import json
import os
import sys

import yaml

from ai_explainer import explain
from architectural_threats import generate_architectural_threats
from excel_updater import update
from models import ArchitecturalThreat, Risk
from repository import git_commit
from risk_scorer import rating, score
from scanners import execute_scanners, load_findings
from threat_mapper import map_finding


def _fingerprint(parts: list[str]) -> str:
    normalized = "|".join(part.strip().lower() for part in parts)
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


def finding_fingerprint(finding) -> str:
    return _fingerprint([
        "scanner",
        finding.component,
        finding.stride,
        finding.path,
        finding.rule_id,
        finding.title,
    ])


def architecture_fingerprint(
    threat: ArchitecturalThreat,
) -> str:
    return _fingerprint([
        "architecture",
        threat.threat_id,
    ])


def scanner_risks(findings, config, commit: str, now: str) -> tuple[list[Risk], bool]:
    risks: list[Risk] = []
    high_confidence_secret = False

    for finding in findings:
        explanation = explain(finding, config)
        value = score(finding.likelihood, finding.impact, finding.confidence)
        severity = rating(value)
        is_secret = (
            finding.scanner in {"Gitleaks", "Trivy"}
            and "secret" in (finding.rule_id + finding.title).lower()
            and finding.confidence == "HIGH"
        )
        high_confidence_secret = high_confidence_secret or is_secret

        risks.append(Risk(
            risk_id="",
            fingerprint=finding_fingerprint(finding),
            status="Open",
            component=finding.component,
            service=finding.service,
            source_file=finding.path,
            source_line=finding.line,
            evidence=finding.evidence,
            scanner=finding.scanner,
            scanner_rule=finding.rule_id,
            stride_category=finding.stride,
            cwe=finding.cwe,
            owasp_category=finding.owasp,
            threat_scenario=explanation["threatScenario"],
            attack_path=" -> ".join(explanation.get("attackPath", [])),
            existing_controls="Not verified by static analysis",
            recommended_mitigation=explanation["recommendedMitigation"],
            likelihood=finding.likelihood,
            impact=finding.impact,
            risk_score=value,
            severity=severity,
            confidence=finding.confidence,
            detected_commit=commit,
            first_detected=now,
            last_detected=now,
        ))

    return risks, high_confidence_secret


def architecture_risks(repo: Path, config: dict, commit: str, now: str) -> list[Risk]:
    risks: list[Risk] = []
    for threat in generate_architectural_threats(repo, config):
        value = score(threat.likelihood, threat.impact, threat.confidence)
        risks.append(Risk(
            risk_id="",
            fingerprint=architecture_fingerprint(threat),
            status="Open",
            component=threat.component,
            service=threat.service,
            source_file=threat.source_file,
            source_line=threat.source_line,
            evidence=threat.evidence,
            scanner="Architecture Analysis",
            scanner_rule=threat.threat_id,
            stride_category=threat.stride_category,
            cwe=threat.cwe,
            owasp_category=threat.owasp_category,
            threat_scenario=threat.threat_scenario,
            attack_path=threat.attack_path,
            existing_controls=threat.existing_controls,
            recommended_mitigation=threat.recommended_mitigation,
            likelihood=threat.likelihood,
            impact=threat.impact,
            risk_score=value,
            severity=rating(value),
            confidence=threat.confidence,
            detected_commit=commit,
            first_detected=now,
            last_detected=now,
        ))
    return risks


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", default=".")
    parser.add_argument("--config", default="security/threat-model/config.yml")
    parser.add_argument("--skip-scan", action="store_true")
    args = parser.parse_args()

    repo = Path(args.repo).resolve()
    config = yaml.safe_load((repo / args.config).read_text(encoding="utf-8"))
    output = repo / ".threat-model" / "scan-results"
    output.mkdir(parents=True, exist_ok=True)

    if not args.skip_scan:
        execute_scanners(repo, output)

    findings = [map_finding(finding) for finding in load_findings(output)]
    now = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    commit = git_commit(repo)

    generated_scanner_risks, high_confidence_secret = scanner_risks(
        findings, config, commit, now
    )
    generated_architecture_risks = architecture_risks(repo, config, commit, now)
    risks = generated_scanner_risks + generated_architecture_risks

    workbook = repo / config["project"]["workbook"]
    summary = update(
        workbook,
        risks,
        int(config["risk"].get("missing_scans_before_resolved_candidate", 2)),
    )
    summary["scannerRisks"] = len(generated_scanner_risks)
    summary["architecturalRisks"] = len(generated_architecture_risks)
    summary["highConfidenceSecret"] = high_confidence_secret
    summary["workbook"] = str(workbook.relative_to(repo))

    summary_path = repo / ".threat-model" / "summary.json"
    summary_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))

    github_output = os.getenv("GITHUB_OUTPUT")
    if github_output:
        with open(github_output, "a", encoding="utf-8") as handle:
            handle.write(f"new_critical={len(summary['newCritical'])}\n")
            handle.write(f"high_confidence_secret={str(high_confidence_secret).lower()}\n")
            handle.write(f"architectural_risks={len(generated_architecture_risks)}\n")

    if summary["newCritical"] and config["risk"].get("fail_on_new_critical", True):
        return 2
    if high_confidence_secret and config["risk"].get("fail_on_high_confidence_secret", True):
        return 3
    return 0


if __name__ == "__main__":
    sys.exit(main())
