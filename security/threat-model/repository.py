from __future__ import annotations
from pathlib import Path
import fnmatch, subprocess

SERVICE_NAMES = [
    "CatalogService", "InventoryService", "OrderService",
    "FulfillmentService", "AIService", "shell", "order-mfe",
    "fulfillment-mfe", "manager-mfe"
]


def git_commit(repo: Path) -> str:
    try:
        return subprocess.check_output(
            ["git", "rev-parse", "HEAD"], cwd=repo, text=True
        ).strip()
    except Exception:
        return "unknown"


def classify(path: str) -> tuple[str, str]:
    normalized = path.replace("\\", "/")
    service = next((name for name in SERVICE_NAMES if name.lower() in normalized.lower()), "Repository")
    if ".github/workflows" in normalized:
        return "CI/CD", "GitHub Actions"
    if service in {"shell", "order-mfe", "fulfillment-mfe", "manager-mfe"}:
        return "Frontend / Micro-frontend", service
    if "AIService" in normalized:
        return "AI explanation layer", service
    if service != "Repository":
        return "Backend API", service
    if any(x in normalized.lower() for x in ["docker", "terraform", "bicep", "deploy"]):
        return "Infrastructure", service
    return "Repository", service


def is_excluded(path: str, patterns: list[str]) -> bool:
    value = path.replace("\\", "/")
    return any(fnmatch.fnmatch(value, p) or fnmatch.fnmatch("/" + value, p) for p in patterns)
