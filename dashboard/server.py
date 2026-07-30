"""
Owner: Person 2

Serves the live trace file to the dashboard frontend. Deliberately simple —
a static HTML page polling this every second, no websockets, no build step.
Run: uvicorn dashboard.server:app --reload --port 8000
"""
import hashlib
import json
import re
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from detectors.replay import evaluate_full_run

TRACES_DIR = Path(__file__).resolve().parent.parent / "traces"
STATIC_DIR = Path(__file__).resolve().parent / "static"

# Must match harness/guard.py's RUN_ID_PATTERN — run_id becomes a path segment
# here too; an unvalidated run_id was a confirmed arbitrary-file-read via
# backslash path traversal (e.g. GET /api/trace/..\..\some\file).
RUN_ID_PATTERN = re.compile(r"^[A-Za-z0-9_-]+$")

# Mirrors detectors/detector4_progress.py's sentinel: a value that can never
# collide with a real SHA-256 hex digest, used when a step has no
# "observation" text to hash.
_NO_OBSERVATION_SENTINEL = "<NO_OBSERVATION>"

app = FastAPI()
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


def _empty_response() -> dict:
    return {
        "steps": [],
        "total_cost": 0.0,
        "verdict": {
            "should_halt": False,
            "detector": "",
            "reason": "",
            "halted_at_step": None,
        },
    }


def _hash_observation(step: dict) -> str:
    """Same trick as detector4_progress.py's _hash_observation: hash the
    observation text, or fall back to a sentinel that can't collide with a
    real hash when the field is missing."""
    text = step.get("observation")
    if text is None:
        return _NO_OBSERVATION_SENTINEL
    return hashlib.sha256(text.encode()).hexdigest()


def _compute_novelty(steps: list[dict]) -> list[bool]:
    """Per-step novelty flag mirroring detectors/detector4_progress.py's
    check(): a step counts as progress if its observation hash differs from
    the IMMEDIATELY PREVIOUS step's observation hash, or its workspace_hash
    differs from the immediately previous step's workspace_hash (see that
    module's docstring for why "vs previous step" and not "ever seen
    before" — this function does not reuse detector4_progress.py's
    internals, which are only designed to return a final triggered/not
    Result, not a per-step trace).

    The first step has nothing to compare against, so it is never novel.
    """
    novelty = []
    last_obs_hash = None
    last_ws_hash = None
    for step in steps:
        obs_hash = _hash_observation(step)
        ws_hash = step.get("workspace_hash")
        ws_signal_present = ws_hash is not None

        obs_progressed = last_obs_hash is not None and obs_hash != last_obs_hash
        ws_progressed = (
            last_ws_hash is not None
            and ws_signal_present
            and ws_hash != last_ws_hash
        )
        novelty.append(obs_progressed or ws_progressed)

        last_obs_hash = obs_hash
        last_ws_hash = ws_hash
    return novelty


@app.get("/")
def index():
    return FileResponse(STATIC_DIR / "index.html")


@app.get("/api/runs")
def list_runs():
    if not TRACES_DIR.exists():
        return []
    return sorted(p.stem for p in TRACES_DIR.glob("*.jsonl"))


@app.get("/api/trace/{run_id}")
def get_trace(run_id: str):
    if not RUN_ID_PATTERN.fullmatch(run_id):
        return _empty_response()
    path = TRACES_DIR / f"{run_id}.jsonl"
    if not path.exists():
        return _empty_response()

    steps = [json.loads(line) for line in open(path)]
    novelty = _compute_novelty(steps)
    steps_with_novelty = [
        {**step, "novel": novel} for step, novel in zip(steps, novelty)
    ]

    # Real halt verdict, replayed from the actual trace file — the same
    # detectors (1-4) a live run would have hit, in the same order.
    verdict = evaluate_full_run(path)

    return {
        "steps": steps_with_novelty,
        "total_cost": sum(s["cost_usd"] for s in steps),
        "verdict": {
            "should_halt": verdict.should_halt,
            "detector": verdict.detector,
            "reason": verdict.reason,
            "halted_at_step": verdict.halted_at_step,
        },
    }
