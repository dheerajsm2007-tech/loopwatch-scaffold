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
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from detectors.replay import evaluate_full_run

TRACES_DIR = Path(__file__).resolve().parent.parent / "traces"
STATIC_DIR = Path(__file__).resolve().parent / "static"
CORPUS_DIR = Path(__file__).resolve().parent.parent / "eval" / "corpus"

# Must match harness/guard.py's RUN_ID_PATTERN — run_id becomes a path segment
# here too; an unvalidated run_id was a confirmed arbitrary-file-read via
# backslash path traversal (e.g. GET /api/trace/..\..\some\file).
RUN_ID_PATTERN = re.compile(r"^[A-Za-z0-9_-]+$")

# Mirrors detectors/detector4_progress.py's sentinel: a value that can never
# collide with a real SHA-256 hex digest, used when a step has no
# "observation" text to hash.
_NO_OBSERVATION_SENTINEL = "<NO_OBSERVATION>"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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


CUSTOM_PROMPTS: dict[str, str] = {}

PRESET_PROMPTS = {
    "fixture_spinning": "Refactor auth_service.py to use async/await and update password hashing.",
    "fixture_productive": "Add user input validation to payments/processor.py and create unit tests.",
    "demo_guard_off": "Refactor auth_service.py while disabling safety circuit breakers (Spinning).",
    "demo_guard_on": "Refactor auth_service.py with safety circuit breakers enabled (Halted at Step 5).",
    "demo_long_productive": "Perform long refactoring of payments module with currency support across 40 steps.",
    "demo_halt_step_cap": "Run agent loop exceeding maximum step threshold (40 steps cap).",
    "demo_halt_spend_cap": "Run agent loop exceeding total spend cap ($2.00 limit).",
    "demo_halt_exact_repeat": "Perform identical repeated tool calls causing Detector 2 (Exact Repeat) halt.",
    "demo_halt_near_repeat": "Perform near-identical repetitive tool calls causing Detector 3 (Near Repeat) halt.",
    "demo_halt_no_progress": "Perform flat unproductive actions causing Detector 4 (No Progress) halt.",
}


def _resolve_prompt(run_id: str) -> str:
    if run_id in CUSTOM_PROMPTS:
        return CUSTOM_PROMPTS[run_id]
    
    corpus_file = CORPUS_DIR / f"{run_id}.json"
    if corpus_file.exists():
        try:
            data = json.loads(corpus_file.read_text(encoding="utf-8"))
            if "prompt" in data:
                return data["prompt"]
        except Exception:
            pass
            
    return PRESET_PROMPTS.get(run_id, "")


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
        "prompt": _resolve_prompt(run_id),
        "verdict": {
            "should_halt": verdict.should_halt,
            "detector": verdict.detector,
            "reason": verdict.reason,
            "halted_at_step": verdict.halted_at_step,
        },
    }


def _get_workspace_dir(run_id: str) -> Path:
    snapshots_dir = TRACES_DIR / "snapshots"
    snapshot_path = snapshots_dir / run_id
    if snapshot_path.exists() and snapshot_path.is_dir():
        return snapshot_path
    
    root_dir = Path(__file__).resolve().parent.parent
    demo_path = root_dir / f"demo_workspace_{run_id.replace('demo_guard_off', '1').replace('demo_guard_on', '2').replace('demo_long_productive', '3')}"
    if demo_path.exists() and demo_path.is_dir():
        return demo_path

    return root_dir / "fixtures" / "workspaces" / "basic_repo"


@app.get("/api/workspace/{run_id}/files")
def list_workspace_files(run_id: str):
    if not RUN_ID_PATTERN.fullmatch(run_id):
        return []
    ws_dir = _get_workspace_dir(run_id)
    if not ws_dir.exists():
        return []
    files = []
    for p in sorted(ws_dir.rglob("*")):
        if p.is_file():
            try:
                st_size = p.stat().st_size
            except Exception:
                st_size = 0
            files.append({
                "path": str(p.relative_to(ws_dir)).replace("\\", "/"),
                "size": st_size,
            })
    return files


@app.get("/api/workspace/{run_id}/file")
def get_workspace_file(run_id: str, path: str):
    if not RUN_ID_PATTERN.fullmatch(run_id):
        return {"content": "invalid run_id"}
    ws_dir = _get_workspace_dir(run_id).resolve()
    target = (ws_dir / path).resolve()
    if ws_dir not in target.parents and target != ws_dir:
        return {"content": "error: path traversal rejected"}
    if not target.exists() or not target.is_file():
        return {"content": f"file not found: {path}"}
    return {"content": target.read_text(encoding="utf-8", errors="replace")}


class FileSavePayload(BaseModel):
    content: str


@app.post("/api/workspace/{run_id}/file")
def save_workspace_file(run_id: str, path: str, payload: FileSavePayload):
    if not RUN_ID_PATTERN.fullmatch(run_id):
        return {"success": False, "error": "invalid run_id"}
    ws_dir = _get_workspace_dir(run_id).resolve()
    target = (ws_dir / path).resolve()
    if ws_dir not in target.parents and target != ws_dir:
        return {"success": False, "error": "path traversal rejected"}
    try:
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(payload.content, encoding="utf-8")
        return {"success": True, "path": path, "size": len(payload.content)}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.get("/api/presets")
def list_presets():
    if not CORPUS_DIR.exists():
        return []
    presets = []
    for p in sorted(CORPUS_DIR.glob("*.json")):
        if p.name in ("fixture_productive.json", "fixture_spinning.json"):
            continue
        try:
            data = json.loads(p.read_text(encoding="utf-8"))
            presets.append({
                "task_id": data.get("task_id", p.stem),
                "category": data.get("category", "productive"),
                "prompt": data.get("prompt", ""),
                "expected_outcome": data.get("expected_outcome", ""),
            })
        except Exception:
            continue
    return presets


class RunAgentPayload(BaseModel):
    prompt: str


@app.post("/api/agent/run")
def start_custom_agent_run(payload: RunAgentPayload):
    import threading
    import time
    from harness.agent_loop import run_agent

    prompt = payload.prompt.strip()
    if not prompt:
        return {"error": "Prompt cannot be empty"}

    run_id = f"custom_run_{int(time.time())}"
    CUSTOM_PROMPTS[run_id] = prompt
    ws_dir = str(Path(__file__).resolve().parent.parent / "fixtures" / "workspaces" / "basic_repo")

    def worker():
        try:
            run_agent(task=prompt, workspace=ws_dir, run_id=run_id, halting_enabled=True)
        except Exception as exc:
            print(f"[start_custom_agent_run] error running agent for {run_id}: {exc}")

    t = threading.Thread(target=worker, daemon=True)
    t.start()

    return {"run_id": run_id, "status": "started", "prompt": prompt}
