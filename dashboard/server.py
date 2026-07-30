"""
Owner: Person 2

Serves the live trace file to the dashboard frontend. Deliberately simple —
a static HTML page polling this every second, no websockets, no build step.
Run: uvicorn dashboard.server:app --reload --port 8000
"""
import json
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

TRACES_DIR = Path(__file__).resolve().parent.parent / "traces"
STATIC_DIR = Path(__file__).resolve().parent / "static"

app = FastAPI()
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


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
    path = TRACES_DIR / f"{run_id}.jsonl"
    if not path.exists():
        return {"steps": [], "total_cost": 0.0}

    steps = [json.loads(line) for line in open(path)]
    return {
        "steps": steps,
        "total_cost": sum(s["cost_usd"] for s in steps),
    }
