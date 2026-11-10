CONFIDENCE_MULTIPLIER = {"HIGH": 1.0, "MEDIUM": 0.8, "LOW": 0.6}

def score(likelihood: int, impact: int, confidence: str) -> int:
    likelihood = max(1, min(5, int(likelihood)))
    impact = max(1, min(5, int(impact)))
    multiplier = CONFIDENCE_MULTIPLIER.get(confidence.upper(), 0.8)
    return min(25, max(1, round(likelihood * impact * multiplier)))

def rating(value: int) -> str:
    if value >= 20: return "Critical"
    if value >= 12: return "High"
    if value >= 6: return "Medium"
    return "Low"
