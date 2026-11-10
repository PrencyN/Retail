from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any


@dataclass
class Finding:
    scanner: str
    rule_id: str
    title: str
    severity: str
    confidence: str
    path: str
    line: int
    evidence: str
    component: str = "Unknown"
    service: str = "Unknown"
    stride: str = "Unknown"
    cwe: str = ""
    owasp: str = ""
    likelihood: int = 2
    impact: int = 3
    scanner_payload: dict[str, Any] | None = None

    def as_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class ArchitecturalThreat:
    threat_id: str
    component: str
    service: str
    source_file: str
    evidence: str
    stride_category: str
    cwe: str
    owasp_category: str
    threat_scenario: str
    attack_path: str
    existing_controls: str
    recommended_mitigation: str
    likelihood: int
    impact: int
    confidence: str = "MEDIUM"
    source_line: int = 1


@dataclass
class Risk:
    risk_id: str
    fingerprint: str
    status: str
    component: str
    service: str
    source_file: str
    source_line: int
    evidence: str
    scanner: str
    scanner_rule: str
    stride_category: str
    cwe: str
    owasp_category: str
    threat_scenario: str
    attack_path: str
    existing_controls: str
    recommended_mitigation: str
    likelihood: int
    impact: int
    risk_score: int
    severity: str
    confidence: str
    owner: str = ""
    target_date: str = ""
    detected_commit: str = ""
    first_detected: str = ""
    last_detected: str = ""
    resolution: str = ""
    reviewer_comments: str = ""
    accepted_risk_reason: str = ""
    missing_scan_count: int = 0

    def as_dict(self) -> dict[str, Any]:
        return asdict(self)
