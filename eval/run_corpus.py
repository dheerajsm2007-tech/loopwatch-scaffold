"""
Owner: Person 3

Runs every task in eval/corpus/ once through the real harness, producing one
trace file per task in traces/. Run this in the background from the moment
harness/agent_loop.py works — it's the step that quietly eats hours if left
until later, because executing 30 real runs takes real wall-clock time.
"""
import json
from pathlib import Path

from harness.agent_loop import run_agent

CORPUS_DIR = Path(__file__).resolve().parent / "corpus"


def load_tasks() -> list[dict]:
    return [json.loads(p.read_text()) for p in sorted(CORPUS_DIR.glob("*.json"))]


def run_all():
    tasks = load_tasks()
    print(f"running {len(tasks)} corpus tasks...")
    for task in tasks:
        run_id = task["task_id"]
        print(f"  {run_id} ({task['category']}) ...")
        run_agent(task=task["prompt"], workspace=task["workspace_seed"], run_id=run_id)
    print("done — see traces/ for output, then run eval/analyze.py")


if __name__ == "__main__":
    run_all()
