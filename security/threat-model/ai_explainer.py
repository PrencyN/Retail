from __future__ import annotations
import json, os, requests
from models import Finding


def fallback(f: Finding) -> dict:
    return {
        "threatScenario": f"An attacker may exploit {f.title.lower()} in {f.service}.",
        "attackPath": [f"Reach the affected component: {f.component}", f"Trigger rule {f.rule_id}", "Impact confidentiality, integrity, or availability"],
        "businessImpact": "The issue may affect service reliability, access control, or protected application data.",
        "recommendedMitigation": f"Review {f.path}:{f.line}, remediate rule {f.rule_id}, add an automated regression test, and rerun the security pipeline.",
        "verificationSteps": ["Confirm the scanner finding is no longer emitted", "Run unit, integration, and authorization tests"],
        "uncertainties": ["Runtime configuration and compensating controls were not verified by static analysis."]
    }


def explain(f: Finding, config: dict) -> dict:
    ai = config.get("ai", {})
    if not ai.get("enabled", False):
        return fallback(f)
    endpoint = os.getenv(ai.get("endpoint_env", "AZURE_OPENAI_ENDPOINT"), "").rstrip("/")
    key = os.getenv(ai.get("api_key_env", "AZURE_OPENAI_API_KEY"), "")
    deployment = os.getenv(ai.get("deployment_env", "AZURE_OPENAI_DEPLOYMENT"), "")
    if not endpoint or not key or not deployment:
        return fallback(f)
    payload = {
        "component": f.component, "service": f.service, "file": f.path,
        "line": f.line, "scannerRule": f.rule_id, "scannerTitle": f.title,
        "sanitizedEvidence": "[REDACTED]" if f.scanner in {"Gitleaks"} or "secret" in f.rule_id.lower() else f.evidence,
        "stride": f.stride, "cwe": f.cwe, "owasp": f.owasp
    }
    system = """You are an application-security threat modeller. Use only supplied evidence. Return JSON with keys threatScenario, attackPath (array), businessImpact, recommendedMitigation, verificationSteps (array), uncertainties (array). Do not invent files, controls, identities, secrets, exploitability, or compliance claims."""
    url = f"{endpoint}/openai/deployments/{deployment}/chat/completions?api-version={ai.get('api_version','2024-10-21')}"
    body = {"messages": [{"role":"system","content":system},{"role":"user","content":json.dumps(payload)}], "response_format":{"type":"json_object"}}
    try:
        response = requests.post(url, headers={"api-key":key,"Content-Type":"application/json"}, json=body, timeout=40)
        response.raise_for_status()
        result = json.loads(response.json()["choices"][0]["message"]["content"])
        return {**fallback(f), **result}
    except Exception:
        return fallback(f)
