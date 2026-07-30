"""Parses logs/app.log and reports ERROR-level entries.

pathological_12 in the eval corpus: the parser below only matches
"ERROR:" (with a colon), but logs/app.log's real entries use "ERROR "
(a space, no colon) -- the parser silently matches nothing, which is the
actual bug to fix.
"""
from pathlib import Path

LOG_PATH = Path(__file__).resolve().parent.parent / "logs" / "app.log"


def find_errors():
    errors = []
    for line in LOG_PATH.read_text().splitlines():
        if "ERROR:" in line:  # BUG: real log lines use "ERROR " not "ERROR:"
            errors.append(line)
    return errors
