"""
Scripted, LLM-free demo for recording. Uses your REAL detector pipeline
(detectors/replay.py) against hand-scripted trace steps — no API keys, no
LLM calls, nothing that can fail on stage. Proves the actual detection
logic works, which is the whole point of the demo.

Terminal 1 (start the dashboard, open http://localhost:8000 in a browser):
    uvicorn dashboard.server:app --port 8000

Terminal 2 (run this, this is what you narrate over):
    python demo/scripted_demo.py

Add --auto to skip the "press Enter" pauses (useful for a quick test run
before you actually record).
"""
import itertools
import json
import sys
import time
from pathlib import Path

from detectors.replay import evaluate

TRACES_DIR = Path(__file__).resolve().parent.parent / "traces"
TRACES_DIR.mkdir(exist_ok=True)
AUTO = "--auto" in sys.argv


def write_step(run_id, step):
    path = TRACES_DIR / f"{run_id}.jsonl"
    with open(path, "a") as f:
        f.write(json.dumps(step) + "\n")


def make_step(run_id, step_num, tool, arg_value, observation, workspace_hash, cost=0.003):
    key = "path" if tool in ("read_file", "write_file") else "query"
    return {
        "run_id": run_id,
        "step": step_num,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "tool": tool,
        "arguments": {key: arg_value},
        "observation": observation,
        "input_tokens": 700 + step_num * 5,
        "output_tokens": 120,
        "cost_usd": cost,
        "workspace_hash": workspace_hash,
    }


SPINNING_PHRASES = [
    "config file", "config.json", "app config", "settings file",
    "configuration", "env file", "config.yaml", "settings.py",
    "app settings", "environment config", "conf file", "yaml config",
]

PRODUCTIVE_STEPS = [
    ("search", "payment bug", "found payments/handler.py, payments/utils.py", "hash0"),
    ("read_file", "payments/handler.py", "def process(amount): return amount * TAX_RATE  # undefined", "hash0"),
    ("search", "TAX_RATE definition", "no matches found in /workspace", "hash0"),
    ("write_file", "payments/handler.py", "file written: TAX_RATE = 0.08 added", "hash1"),
    ("search", "run tests payments", "tests/test_payments.py found", "hash1"),
    ("read_file", "tests/test_payments.py", "def test_process(): assert process(100) == 108", "hash1"),
    ("write_file", "tests/test_payments.py", "file written: added edge case test", "hash2"),
    ("search", "run test suite", "3 passed, 0 failed", "hash2"),
    ("read_file", "payments/utils.py", "def format_currency(x): return f'${x:.2f}'", "hash2"),
    ("write_file", "payments/utils.py", "file written: added currency symbol param", "hash3"),
    ("search", "currency symbol usage", "found 2 call sites in payments/", "hash3"),
    ("write_file", "payments/handler.py", "file written: updated call sites", "hash4"),
    ("search", "run full test suite", "5 passed, 0 failed", "hash4"),
    ("read_file", "README.md", "# Payments module", "hash4"),
    ("write_file", "README.md", "file written: documented currency param", "hash5"),
]


def pause(msg):
    if AUTO:
        print(msg)
    else:
        input(msg)


def run_guard_off(run_id, delay=0.4):
    """Unbounded — cycles through spinning queries forever. Let it run for a
    few seconds on screen, then Ctrl+C it yourself, live, on camera. That's
    the point: nothing stops it but you."""
    print(f"\n=== {run_id}  (guard OFF — this will not stop on its own; Ctrl+C when ready) ===")
    steps = []
    try:
        for i, phrase in enumerate(itertools.cycle(SPINNING_PHRASES)):
            step = make_step(run_id, i, "search", phrase, "no matches found in /workspace", "hashA")
            steps.append(step)
            write_step(run_id, step)
            total_cost = sum(s["cost_usd"] for s in steps)
            print(f"step {i:2d} | search  {phrase[:30]:30s} | spend so far: ${total_cost:.4f}")
            time.sleep(delay)
    except KeyboardInterrupt:
        total_cost = sum(s["cost_usd"] for s in steps)
        print(f"\n[MANUALLY KILLED] after {len(steps)} steps, ${total_cost:.4f} spent — "
              f"nothing would have stopped this on its own.\n")


def run_guard_on(run_id, delay=0.5):
    print(f"\n=== {run_id}  (guard ON — same spinning task) ===")
    steps = []
    for i, phrase in enumerate(SPINNING_PHRASES):
        step = make_step(run_id, i, "search", phrase, "no matches found in /workspace", "hashA")
        steps.append(step)
        write_step(run_id, step)
        total_cost = sum(s["cost_usd"] for s in steps)
        print(f"step {i:2d} | search  {phrase[:30]:30s} | spend so far: ${total_cost:.4f}")

        result = evaluate(steps)
        if result.should_halt:
            print(f"\n[GUARD] halted at step {i}")
            print(f"[GUARD] detector: {result.detector}")
            print(f"[GUARD] reason: {result.reason}")
            print(f"[GUARD] spend so far: ${total_cost:.4f}")
            print(f"[GUARD] options: resume / kill / raise budget\n")
            return
        time.sleep(delay)
    print("\n[unexpected] finished without halting — check detector thresholds\n")


def run_long_productive(run_id, delay=0.35):
    print(f"\n=== {run_id}  (long but productive — should finish, not halt) ===")
    steps = []
    for i, (tool, arg, obs, ws_hash) in enumerate(PRODUCTIVE_STEPS):
        step = make_step(run_id, i, tool, arg, obs, ws_hash)
        steps.append(step)
        write_step(run_id, step)
        total_cost = sum(s["cost_usd"] for s in steps)
        print(f"step {i:2d} | {tool:10s} {arg[:28]:28s} | spend so far: ${total_cost:.4f}")

        result = evaluate(steps)
        if result.should_halt:
            print(f"\n[unexpected] halted at step {i}: {result.reason} — this run should NOT halt, "
                  f"check detector thresholds\n")
            return
        time.sleep(delay)
    total_cost = sum(s["cost_usd"] for s in steps)
    print(f"\n[AGENT] finished naturally after {len(steps)} steps, total spend ${total_cost:.4f}\n")


if __name__ == "__main__":
    pause("Press Enter to run DEMO 1 — guard OFF (watch it climb, then Ctrl+C it yourself)...")
    run_guard_off("demo_guard_off")

    pause("Press Enter to run DEMO 2 — guard ON (same task, should halt on its own)...")
    run_guard_on("demo_guard_on")

    pause("Press Enter to run DEMO 3 — long but productive (should finish, not halt)...")
    run_long_productive("demo_long_productive")
