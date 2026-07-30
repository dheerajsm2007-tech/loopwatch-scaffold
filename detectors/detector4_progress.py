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

# Sentinel returned by _hash_observation when a step is missing
# the "observation" field. A real SHA-256 hex digest is exactly
# 64 lowercase hex chars, so this uppercase string can never
# collide. Callers treat this as a progress event — a missing
# field is new information.
NO_OBSERVATION_SENTINEL = "<NO_OBSERVATION>"


@dataclass
class Result:
    triggered: bool
    reason: str = ""


def _hash_observation(step: dict) -> str:
    """Stable hash of an observation's text content.

    Used to detect whether a step returned text the agent has
    already seen. SHA-256 is overkill cryptographically, but it's
    in the stdlib and the output is short enough to log.

    If a step is missing the "observation" field, return a
    sentinel value that is guaranteed not to collide with any
    real SHA-256 hex digest. The sentinel is "no observation" —
    callers that see this should treat it as a progress event,
    not as a repeated observation.
    """
    text = step.get("observation")
    if text is None:
        return NO_OBSERVATION_SENTINEL
    return hashlib.sha256(text.encode()).hexdigest()


def check(steps: list[dict]) -> Result:
    """Return Result(triggered=True) if the last NO_PROGRESS_WINDOW
    steps produced no new observation AND no workspace change.

    "New" is measured against the IMMEDIATELY PREVIOUS step, not
    the full history — see module docstring for why. The full
    reason string is built up as we walk, so the caller can see
    which signals were quiet.
    """
    if len(steps) < NO_PROGRESS_WINDOW:
        return Result(False)

    last_obs_hash: str | None = None
    last_ws_hash: str | None = None
    stale_streak = 0
    quiet_observations = 0
    quiet_workspace = 0

    for step in steps:
        obs_hash = _hash_observation(step)
        ws_hash = step.get("workspace_hash")
        ws_signal_present = ws_hash is not None

        obs_progressed = (last_obs_hash is not None
                          and obs_hash != last_obs_hash)
        # workspace_hash=None means "no signal this step" — it
        # neither counts as a change nor as unchanged.
        ws_progressed = (last_ws_hash is not None
                         and ws_signal_present
                         and ws_hash != last_ws_hash)

        if obs_progressed or ws_progressed:
            stale_streak = 0
            quiet_observations = 0
            quiet_workspace = 0
        else:
            stale_streak += 1
            if (last_obs_hash is not None
                    and obs_hash == last_obs_hash
                    and obs_hash != NO_OBSERVATION_SENTINEL):
                quiet_observations += 1
            # Only count workspace as "quiet" if we actually saw a
            # workspace signal on BOTH this step and the previous one.
            if ws_signal_present and last_ws_hash == ws_hash:
                quiet_workspace += 1

        if stale_streak >= NO_PROGRESS_WINDOW:
            return Result(
                True,
                (
                    f"no new information in the last {NO_PROGRESS_WINDOW} steps: "
                    f"{quiet_observations} of those steps repeated the prior "
                    f"observation text and {quiet_workspace} saw no workspace "
                    f"change. Progress requires either a new observation the "
                    f"agent has not read before, or the workspace actually "
                    f"changing (workspace_hash differing from the previous step)."
                ),
            )

        last_obs_hash = obs_hash
        last_ws_hash = ws_hash

    return Result(False)


if __name__ == "__main__":
    """Smoke test: load both fixtures and report whether the
    detector flags the spinning one and leaves the productive
    one alone. Exits 0 on PASS, 1 on FAIL.
    """
    import json
    import sys
    from pathlib import Path

    fixtures_path = Path(__file__).resolve().parent.parent / "fixtures" / "sample_trace.jsonl"
    if not fixtures_path.exists():
        print(f"FAIL — fixture file not found: {fixtures_path}")
        sys.exit(1)

    expected = {
        "fixture_productive": False,
        "fixture_spinning": True,
    }
    all_pass = True

    with open(fixtures_path) as f:
        steps_by_run: dict[str, list[dict]] = {}
        for line in f:
            line = line.strip()
            if not line:
                continue
            step = json.loads(line)
            steps_by_run.setdefault(step["run_id"], []).append(step)

    for run_id, want in expected.items():
        steps = steps_by_run.get(run_id, [])
        if not steps:
            print(f"FAIL — {run_id}: no steps in fixture")
            all_pass = False
            continue
        result = check(steps)
        ok = result.triggered is want
        status = "PASS" if ok else "FAIL"
        print(f"{status} — {run_id}: triggered={result.triggered} (expected {want})")
        if not ok:
            all_pass = False

    if all_pass:
        print("ALL PASS")
        sys.exit(0)
    else:
        print("SOME FAILED")
        sys.exit(1)
