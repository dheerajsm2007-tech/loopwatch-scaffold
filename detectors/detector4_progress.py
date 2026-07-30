"""
Owner: Person 2

Detector 4 — progress detection. The actual contribution: asks whether the
last N steps produced any NEW information, not whether they look different.
This is what tells a stuck agent apart from a legitimately long one — a
step/spend cap alone can't do this (see deck slide 3).

Two independent novelty signals, either one counts as progress:
  1. A new observation the agent hasn't seen before (hash of the text).
  2. The workspace actually changed (workspace_hash differs from before).

Known false-positive mode (named honestly in the deck, slide 5): a slow
build-test cycle can look like "no new information" for a few steps while
genuinely working. That's why NO_PROGRESS_WINDOW isn't set too small, and
why the false-kill rate against the productive corpus is the number that
matters, not catch rate alone.
"""
import hashlib
from dataclasses import dataclass

NO_PROGRESS_WINDOW = 5   # steps with zero novelty in a row -> flag


@dataclass
class Result:
    triggered: bool
    reason: str = ""


def _hash_observation(step: dict) -> str:
    return hashlib.sha256(step["observation"].encode()).hexdigest()


def check(steps: list[dict]) -> Result:
    if len(steps) < NO_PROGRESS_WINDOW:
        return Result(False)

    seen_hashes = set()
    seen_workspace_hashes = set()
    stale_streak = 0

    for step in steps:
        obs_hash = _hash_observation(step)
        ws_hash = step.get("workspace_hash")

        is_new_observation = obs_hash not in seen_hashes
        is_new_workspace = ws_hash is not None and ws_hash not in seen_workspace_hashes

        seen_hashes.add(obs_hash)
        if ws_hash is not None:
            seen_workspace_hashes.add(ws_hash)

        if is_new_observation or is_new_workspace:
            stale_streak = 0
        else:
            stale_streak += 1

        if stale_streak >= NO_PROGRESS_WINDOW:
            return Result(
                True,
                f"no new information in the last {NO_PROGRESS_WINDOW} steps "
                f"(same observations, workspace unchanged)",
            )

    return Result(False)
