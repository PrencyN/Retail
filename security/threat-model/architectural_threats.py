from __future__ import annotations

from pathlib import Path

from models import ArchitecturalThreat


TEXT_SUFFIXES = {
    ".cs", ".csproj", ".json", ".ts", ".tsx", ".js", ".jsx",
    ".yml", ".yaml", ".env", ".md", ".props", ".targets"
}


def _read(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8", errors="ignore")
    except OSError:
        return ""


def _relative(repo: Path, path: Path) -> str:
    return path.relative_to(repo).as_posix()


def _find_files(repo: Path, roots: list[str]) -> list[Path]:
    files: list[Path] = []
    for root_name in roots:
        root = repo / root_name
        if not root.exists():
            continue
        for path in root.rglob("*"):
            if not path.is_file() or path.suffix.lower() not in TEXT_SUFFIXES:
                continue
            normalized = path.as_posix().lower()
            if any(part in normalized for part in (
                "/node_modules/", "/bin/", "/obj/", "/dist/",
                "/test-results/", "/playwright-report/", "/.auth/"
            )):
                continue
            files.append(path)
    return files


def _first_match(repo: Path, files: list[Path], tokens: list[str]) -> tuple[Path | None, str]:
    lowered = [token.lower() for token in tokens]
    for path in files:
        text = _read(path)
        haystack = (path.as_posix() + "\n" + text).lower()
        if all(token in haystack for token in lowered):
            return path, text
    return None, ""


def _line_number(text: str, token: str) -> int:
    index = text.lower().find(token.lower())
    if index < 0:
        return 1
    return text[:index].count("\n") + 1


def _threat(
    threat_id: str,
    component: str,
    service: str,
    repo: Path,
    path: Path,
    text: str,
    evidence_token: str,
    evidence: str,
    stride: str,
    cwe: str,
    owasp: str,
    scenario: str,
    attack_path: str,
    controls: str,
    mitigation: str,
    likelihood: int,
    impact: int,
    confidence: str = "MEDIUM",
) -> ArchitecturalThreat:
    return ArchitecturalThreat(
        threat_id=threat_id,
        component=component,
        service=service,
        source_file=_relative(repo, path),
        source_line=_line_number(text, evidence_token),
        evidence=evidence,
        stride_category=stride,
        cwe=cwe,
        owasp_category=owasp,
        threat_scenario=scenario,
        attack_path=attack_path,
        existing_controls=controls,
        recommended_mitigation=mitigation,
        likelihood=likelihood,
        impact=impact,
        confidence=confidence,
    )


def generate_architectural_threats(repo: Path, config: dict) -> list[ArchitecturalThreat]:
    settings = config.get("architecture", {})
    if not settings.get("enabled", True):
        return []

    roots = settings.get("evidence_roots", ["backend", "frontend", ".github/workflows"])
    files = _find_files(repo, roots)
    threats: list[ArchitecturalThreat] = []

    path, text = _first_match(repo, files, ["AddMicrosoftIdentityWebApi"])
    if path:
        controls = "Microsoft Identity Web API authentication is configured. Runtime tenant, audience, role, and policy enforcement require deployment verification."
        threats.append(_threat(
            "ARCH-ENTRA-001", "Identity boundary", "Microsoft Entra ID", repo, path, text,
            "AddMicrosoftIdentityWebApi",
            "Repository configures Microsoft Entra ID authentication for an ASP.NET API.",
            "Spoofing", "CWE-287", "A07:2021",
            "A token issued for an unintended tenant, audience, or client could be accepted if runtime validation is weakened or misconfigured.",
            "Attacker obtains or crafts an unsuitable token -> API accepts token -> protected business endpoint is invoked.",
            controls,
            "Verify issuer, tenant, audience and authorized-party validation in every API; use app roles or policies for privileged endpoints; add negative integration tests for wrong tenant, audience and missing role.",
            2, 5, "HIGH"
        ))

    path, text = _first_match(repo, files, ["moduleFederation"])
    if not path:
        path, text = _first_match(repo, files, ["federation", "remote"])
    if path:
        threats.append(_threat(
            "ARCH-MFE-001", "Micro-frontend composition", "Vite Module Federation", repo, path, text,
            "federation",
            "Repository contains Module Federation configuration for composing independently built frontends.",
            "Tampering", "CWE-829", "A08:2021",
            "A compromised or incorrectly resolved remote entry could execute JavaScript in the shell origin and act with the signed-in user's browser privileges.",
            "Remote build or hosting is compromised -> shell loads remote entry -> hostile code executes in shell origin -> API tokens or user actions are abused.",
            "Remote definitions are source controlled and authentication is handled by the shell. Deployment-time integrity and origin restrictions require verification.",
            "Allowlist remote origins, enforce HTTPS, deploy immutable versioned assets, apply Content Security Policy, restrict remote configuration changes, and verify remote artifacts in CI/CD.",
            3, 5, "MEDIUM"
        ))

    path, text = _first_match(repo, files, ["SanitizePromptData", "BuildSystemPrompt"])
    if path:
        threats.append(_threat(
            "ARCH-AI-001", "AI explanation boundary", "AIService", repo, path, text,
            "SanitizePromptData",
            "AIService builds prompts from deterministic fulfillment data and manager-provided text; repository includes sanitization, length limiting, data delimiters and explicit trust-boundary instructions.",
            "Tampering", "CWE-20", "LLM01:2025",
            "Untrusted fulfillment text could attempt prompt injection and cause the explanation layer to disregard deterministic facts or disclose protected instructions.",
            "Attacker-controlled text enters order or manager input -> text is included in AI prompt -> model follows embedded instruction -> misleading or sensitive output is returned.",
            "Input normalization, maximum text length, escaped delimiters, explicit untrusted-data sections, deterministic decision authority, and rules preventing score or winner changes.",
            "Keep prompt-injection regression tests; validate output structure; never allow model output to update fulfillment decisions; monitor and redact prompts and responses; review Azure OpenAI content logging and retention settings.",
            2, 4, "HIGH"
        ))

    path, text = _first_match(repo, files, ["AvailableQuantity", "ReservedQuantity"])
    if path:
        concurrency = any(token.lower() in text.lower() for token in ["rowversion", "timestamp", "concurrencycheck", "xmin"])
        controls = (
            "Repository contains an explicit optimistic-concurrency token or check."
            if concurrency else
            "Repository evidence confirms inventory mutation fields, but no optimistic-concurrency token was identified in the same file."
        )
        threats.append(_threat(
            "ARCH-INV-001", "Inventory integrity", "InventoryService", repo, path, text,
            "AvailableQuantity",
            "InventoryService contains mutable available and reserved quantity fields.",
            "Tampering", "CWE-362", "A04:2021",
            "Concurrent or replayed stock updates could overwrite newer inventory values and produce incorrect fulfillment eligibility.",
            "Two authorized requests read the same stock state -> both calculate updates -> later write overwrites earlier write -> inaccurate availability reaches FulfillmentService.",
            controls,
            "Use optimistic concurrency with a row version, atomic database updates, idempotency keys for commands, authorization policies for stock mutation, and concurrent-update integration tests.",
            3 if not concurrency else 2, 4, "MEDIUM"
        ))

    path, text = _first_match(repo, files, ["FulfillmentScorer", "TotalScore"])
    if path:
        threats.append(_threat(
            "ARCH-FUL-001", "Decision integrity", "FulfillmentService", repo, path, text,
            "TotalScore",
            "FulfillmentService contains deterministic scoring and total-score calculation used to rank candidate locations.",
            "Tampering", "CWE-20", "A04:2021",
            "Manipulated distance, workload, capacity or inventory inputs could produce a valid-looking but operationally incorrect fulfillment recommendation.",
            "Attacker or faulty upstream service changes scoring inputs -> deterministic scorer ranks candidates -> incorrect winner is returned and explained by AI.",
            "Decision logic is deterministic and separated from AI explanation; existing unit tests cover scoring behavior.",
            "Authenticate service-to-service calls, validate numeric ranges and identifiers, sign or trace decision inputs, record an auditable decision snapshot, and add property-based tests for extreme values.",
            3, 4, "HIGH"
        ))

    path, text = _first_match(repo, files, ["UseNpgsql"])
    if not path:
        path, text = _first_match(repo, files, ["Npgsql"])
    if path:
        threats.append(_threat(
            "ARCH-DB-001", "Database boundary", "PostgreSQL / Neon", repo, path, text,
            "Npgsql",
            "Repository uses PostgreSQL through Npgsql/Entity Framework Core.",
            "Information Disclosure", "CWE-522", "A02:2021",
            "A leaked or over-privileged database credential could expose or modify catalog, order, inventory, or fulfillment data.",
            "Credential is exposed or stolen -> attacker connects to PostgreSQL -> data is read or modified outside application authorization controls.",
            "Connection configuration is externalized from source code and secret scanners are currently clean.",
            "Keep credentials in GitHub/Azure secret stores, require TLS, use least-privilege service identities, separate service databases or schemas, rotate credentials, and alert on anomalous connections.",
            2, 5, "HIGH"
        ))

    path, text = _first_match(repo, files, ["permissions:"])
    if path:
        write_permission = "contents: write" in text.lower()
        threats.append(_threat(
            "ARCH-CI-001", "Software supply chain", "GitHub Actions", repo, path, text,
            "permissions:",
            "Repository contains a GitHub Actions workflow with explicit token permissions." + (" A job uses contents: write." if write_permission else ""),
            "Elevation of Privilege", "CWE-269", "A08:2021",
            "A compromised action, dependency, or untrusted pull-request execution path could abuse workflow credentials to alter repository content or published artifacts.",
            "Attacker influences workflow input or dependency -> workflow executes with token permissions -> repository or artifact is modified.",
            "Workflow permissions are declared explicitly and write access is isolated to the register-update job.",
            "Pin third-party actions by full commit SHA, keep pull-request jobs read-only, prevent secrets on untrusted forks, require branch protection and review, and use environment approvals for deployment credentials.",
            2, 5, "HIGH"
        ))

    return threats
