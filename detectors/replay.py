"""
Owner: Person 1 (wiring), Person 2 (detector 4 logic feeds in here)

Runs all four detectors, dumbest to smartest, against a list of trace steps.
Used two ways:
  - live, by harness/guard.py, called after every step
  - offline, by eval/run_corpus.py, replayed against saved trace files
This is the one file that ties Person 1's detectors 1-3 and Person 2's
detector 4 together — keep its interface stable once agreed.
"""
import json
from dataclasses import dataclass
from pathlib import Path

from detectors import detector1_caps, detector2_exact, detector3_near, detector4_progress

DETECTORS = [
    ("hard_cap", detector1_caps),
    ("exact_repeat", detector2_exact),
    ("near_repeat", detector3_near),
    ("no_progress", detector4_progress),
]


@dataclass
class ReplayResult:
    should_halt: bool
    detector: str = ""
    reason: str = ""
    halted_at_step: int | None = None


def evaluate(steps: list[dict]) -> ReplayResult:
    """Call after every new step is appended. Returns the first detector
    that fires, in dumbest-to-smartest order."""
    for name, module in DETECTORS:
        result = module.check(steps)
        if result.triggered:
            return ReplayResult(
                should_halt=True,
                detector=name,
                reason=result.reason,
                halted_at_step=steps[-1]["step"] if steps else None,
            )
    return ReplayResult(should_halt=False)


def evaluate_full_run(trace_path: Path) -> ReplayResult:
    """Offline replay: feed a saved trace file in step-by-step and report
    the first step at which any detector would have halted (or none)."""
    steps = []
    with open(trace_path) as f:
        for line in f:
            steps.append(json.loads(line))
            result = evaluate(steps)
            if result.should_halt:
                return result
    return ReplayResult(should_halt=False)


if __name__ == "__main__":
    # quick smoke test against the fixtures
    fixtures_dir = Path(__file__).resolve().parent.parent / "fixtures"
    for name in ("fixture_productive", "fixture_spinning"):
        steps = [
            json.loads(line)
            for line in open(fixtures_dir / "sample_trace.jsonl")
            if json.loads(line)["run_id"] == name
        ]
        result = evaluate(steps)
        print(f"{name}: {result}")
