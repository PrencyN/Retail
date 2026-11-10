from __future__ import annotations
from models import Finding

RULES = [
    ({"secret", "credential", "token", "password", "key"}, "Information Disclosure", "CWE-798", "A02:2021", 4, 5),
    ({"auth", "authorize", "permission", "role", "privilege"}, "Elevation of Privilege", "CWE-862", "A01:2021", 4, 5),
    ({"xss", "html", "script"}, "Tampering", "CWE-79", "A03:2021", 3, 4),
    ({"sql", "injection"}, "Tampering", "CWE-89", "A03:2021", 4, 5),
    ({"cors", "origin"}, "Spoofing", "CWE-346", "A05:2021", 3, 4),
    ({"log", "logging"}, "Information Disclosure", "CWE-532", "A09:2021", 3, 4),
    ({"workflow", "github", "action"}, "Elevation of Privilege", "CWE-269", "A08:2021", 3, 5),
    ({"vulnerab", "dependency", "package", "cve"}, "Tampering", "CWE-1104", "A06:2021", 3, 4),
    ({"denial", "resource", "limit", "timeout"}, "Denial of Service", "CWE-400", "A04:2021", 3, 3),
]


def map_finding(finding: Finding) -> Finding:
    text = f"{finding.rule_id} {finding.title} {finding.path}".lower()
    for tokens, stride, cwe, owasp, likelihood, impact in RULES:
        if any(token in text for token in tokens):
            finding.stride = stride
            finding.cwe = finding.cwe or cwe
            finding.owasp = finding.owasp or owasp
            finding.likelihood = likelihood
            finding.impact = impact
            return finding
    finding.stride = "Tampering"
    finding.cwe = finding.cwe or "CWE-693"
    finding.owasp = finding.owasp or "A04:2021"
    severity_values = {"LOW": (2,2), "MEDIUM": (3,3), "HIGH": (4,4), "CRITICAL": (5,5)}
    finding.likelihood, finding.impact = severity_values.get(finding.severity, (3,3))
    return finding
