# Loopwatch

A monitor that sits alongside an AI coding agent, watches every step, and halts the
run the moment it detects spinning — reporting spend so far, the reason it stopped,
and a resume / kill / raise-budget choice. Built for FRONTIER 2026, Track 05 (AI
Safety & Observability).

See `TRACE_SCHEMA.md` for the one contract every part of this repo depends on.

## Setup

```bash
git clone <repo-url>
cd loopwatch
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

Smoke-test the detectors against the fixture (works before any real harness code exists):

```bash
python -m detectors.replay
```

Run the dashboard:

```bash
uvicorn dashboard.server:app --reload --port 8000
```

## Who owns what

| Folder | Owner | What |
|---|---|---|
| `harness/` | Person 1 | agent loop, in-process guard, trace writing |
| `detectors/` (1-3) | Person 1 | hard caps, exact repeat, near repeat |
| `detectors/` (4) | Person 2 | progress detection — the core differentiator |
| `dashboard/` | Person 2 | live spend + novelty curve |
| `eval/` | Person 3 | corpus tasks, corpus runner, catch-rate / false-kill analysis |
| `demo/` | joint, from hour 16 | scripted live-demo runs |

## Checkpoints

- **Hour 2** — `TRACE_SCHEMA.md` frozen, `fixtures/sample_trace.jsonl` committed.
  Nothing downstream starts before this exists.
- **Hour 6** — detectors 1-3 pass against the fixture (`python -m detectors.replay`);
  dashboard renders the fixture.
- **Hour 12** — first real end-to-end run: real harness → real trace → all four
  detectors → dashboard, live. This is the actual integration moment — don't assume
  it just works, someone should sit and drive it.
- **Hour 16** — full demo (`demo/run_demo.py`) rehearsed twice.
- **Hour 20** — feature freeze. Bugfixes only from here.
- **Last 1-2 hours** — buffer. Don't schedule new work here.

## Why the fixture exists

`fixtures/sample_trace.jsonl` is a hand-written fake trace matching the frozen
schema, with one clean run and one obviously-spinning run baked in. It exists so
Person 2 and Person 3 can build and test against real-shaped data starting at hour 2,
without waiting for Person 1's real harness to be working. Swap it for real traces
as they become available — nobody has to sit idle waiting on someone else's
unfinished piece.
