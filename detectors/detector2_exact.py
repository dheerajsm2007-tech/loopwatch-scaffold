"""
Owner: Person 1

Detector 2 — exact repeat. Fingerprints each (tool, arguments) pair;
flags if the same fingerprint fires too many times.
"""
import hashlib
import json
from collections import Counter
from dataclasses import dataclass

REPEAT_THRESHOLD = 3  # same exact call this many times -> flag


@dataclass
class Result:
    triggered: bool
    reason: str = ""


def fingerprint(step: dict) -> str:
    payload = json.dumps({"tool": step["tool"], "arguments": step["arguments"]}, sort_keys=True)
    return hashlib.sha256(payload.encode()).hexdigest()


def check(steps: list[dict]) -> Result:
    fingerprints = [fingerprint(s) for s in steps]
    counts = Counter(fingerprints)
    worst_fp, worst_count = counts.most_common(1)[0] if counts else (None, 0)

    if worst_count >= REPEAT_THRESHOLD:
        return Result(True, f"same call repeated {worst_count} times")

    return Result(False)
