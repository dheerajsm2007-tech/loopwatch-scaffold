"""
Owner: Person 3

Replays every corpus trace offline against the detectors and reports:
  - catch rate: % of pathological runs correctly halted
  - false-kill rate: % of productive runs wrongly halted
This is the credibility number for the deck's impact slide — report both,
not just catch rate (anyone can catch everything by killing everything).
"""
import json
from pathlib import Path

from detectors.replay import evaluate_full_run

CORPUS_DIR = Path(__file__).resolve().parent / "corpus"
TRACES_DIR = Path(__file__).resolve().parent.parent / "traces"


def load_task_categories() -> dict:
    return {
        json.loads(p.read_text())["task_id"]: json.loads(p.read_text())["category"]
        for p in CORPUS_DIR.glob("*.json")
    }


def analyze():
    categories = load_task_categories()

    pathological_total = pathological_caught = 0
    productive_total = productive_wrongly_killed = 0

    for trace_path in sorted(TRACES_DIR.glob("*.jsonl")):
        run_id = trace_path.stem
        category = categories.get(run_id)
        if category is None:
            continue  # not a corpus run (e.g. a demo trace) — skip

        result = evaluate_full_run(trace_path)

        if category == "pathological":
            pathological_total += 1
            if result.should_halt:
                pathological_caught += 1
        elif category == "productive":
            productive_total += 1
            if result.should_halt:
                productive_wrongly_killed += 1

    catch_rate = pathological_caught / pathological_total if pathological_total else 0
    false_kill_rate = productive_wrongly_killed / productive_total if productive_total else 0

    print(f"pathological: {pathological_caught}/{pathological_total} caught  ({catch_rate:.0%})")
    print(f"productive:   {productive_wrongly_killed}/{productive_total} wrongly killed  ({false_kill_rate:.0%})")
    print()
    print("-> use these numbers on deck slide 6, replacing the '90% target'")

    return {
        "catch_rate": catch_rate,
        "false_kill_rate": false_kill_rate,
        "pathological_total": pathological_total,
        "productive_total": productive_total,
    }


if __name__ == "__main__":
    analyze()
