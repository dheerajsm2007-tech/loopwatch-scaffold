"""
Owner: Person 1

Detector 3 — near repeat. Catches "config file" -> "config.json" -> "app
config": different strings, same dead end. Deliberately no embeddings model
(cut for time — see deck's reality-check slide); token-overlap similarity
is cheap, deterministic, and good enough.
"""
import re
from dataclasses import dataclass

WINDOW = 4              # look at the last N same-tool calls
SIMILARITY_THRESHOLD = 0.5   # jaccard overlap to count as "near-repeat"
NEAR_REPEAT_COUNT = 3    # this many near-duplicates in the window -> flag


@dataclass
class Result:
    triggered: bool
    reason: str = ""


def _tokens(step: dict) -> set:
    text = " ".join(str(v) for v in step["arguments"].values())
    return set(re.findall(r"[a-z0-9]+", text.lower()))


def _jaccard(a: set, b: set) -> float:
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)


def check(steps: list[dict]) -> Result:
    if len(steps) < 2:
        return Result(False)

    recent = steps[-WINDOW:]
    same_tool = [s for s in recent if s["tool"] == recent[-1]["tool"]]
    if len(same_tool) < 2:
        return Result(False)

    near_dupes = 0
    base = _tokens(same_tool[-1])
    for s in same_tool[:-1]:
        if _jaccard(base, _tokens(s)) >= SIMILARITY_THRESHOLD:
            near_dupes += 1

    if near_dupes >= NEAR_REPEAT_COUNT - 1:
        return Result(True, f"{near_dupes + 1} near-identical {recent[-1]['tool']} calls in a row")

    return Result(False)
