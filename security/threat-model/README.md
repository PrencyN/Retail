# Live threat model

This pipeline runs Semgrep, Trivy, and Gitleaks, maps evidence to STRIDE/CWE/OWASP,
calculates risk deterministically, optionally asks Azure OpenAI for a grounded explanation,
and merges results into `docs/security/Threat-Risk-Register.xlsx`.

## Local run

1. Install Python 3.12, Semgrep, Trivy, and Gitleaks.
2. From the repository root:

```bash
python -m venv .venv
. .venv/bin/activate
pip install -r security/threat-model/requirements.txt semgrep
python security/threat-model/run.py
```

Windows PowerShell activation:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r security/threat-model/requirements.txt semgrep
python security/threat-model/run.py
```

Optional Azure OpenAI variables:

```text
AZURE_OPENAI_ENDPOINT
AZURE_OPENAI_API_KEY
AZURE_OPENAI_DEPLOYMENT
```

If they are absent, the deterministic fallback explanation is used.

## Test using existing scanner JSON

```bash
python security/threat-model/run.py --skip-scan
```

The following files must already exist:

- `.threat-model/scan-results/semgrep.json`
- `.threat-model/scan-results/trivy.json`
- `.threat-model/scan-results/gitleaks.json`
