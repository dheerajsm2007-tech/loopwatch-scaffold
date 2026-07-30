"""
Owner: Person 3

Runs every task in eval/corpus/ once through the real harness, producing one
trace file per task in traces/. Run this in the background from the moment
harness/agent_loop.py works — it's the step that quietly eats hours if left
until later, because executing 30 real runs takes real wall-clock time.
"""
import json
import shutil
from pathlib import Path

from harness.agent_loop import run_agent

CORPUS_DIR = Path(__file__).resolve().parent / "corpus"
REPO_ROOT = Path(__file__).resolve().parent.parent
SCRATCH_DIR = REPO_ROOT / "scratch"


def load_tasks() -> list[dict]:
    return [json.loads(p.read_text()) for p in sorted(CORPUS_DIR.glob("*.json"))]


def _fresh_workspace(task_id: str, workspace_seed: str) -> Path:
    """Copy workspace_seed into a disposable per-task scratch dir so a run
    never mutates the shared seed — without this, later runs (or re-runs)
    would see whatever an earlier task left behind instead of a clean seed."""
    seed = REPO_ROOT / workspace_seed
    workspace = SCRATCH_DIR / f"corpus_{task_id}"
    if workspace.exists():
        shutil.rmtree(workspace)
    if seed.exists():
        shutil.copytree(seed, workspace)
    else:
        workspace.mkdir(parents=True, exist_ok=True)
    return workspace


def run_all():
    tasks = load_tasks()
    print(f"running {len(tasks)} corpus tasks...")
    failed = []
    for task in tasks:
        run_id = task["task_id"]
        print(f"  {run_id} ({task['category']}) ...")
        workspace = _fresh_workspace(run_id, task["workspace_seed"])
        try:
            run_agent(task=task["prompt"], workspace=str(workspace), run_id=run_id)
        except Exception as exc:
            # One task's unexpected crash shouldn't take out the other 29 --
            # a real run of all 30 tasks is real wall-clock time (see module
            # docstring), so losing that to one bad task is expensive.
            print(f"  !! {run_id} FAILED: {exc}")
            failed.append((run_id, str(exc)))
    print("done — see traces/ for output, then run eval/analyze.py")
    if failed:
        print(f"{len(failed)} task(s) failed and were skipped:")
        for run_id, err in failed:
            print(f"  - {run_id}: {err}")


if __name__ == "__main__":
    run_all()
