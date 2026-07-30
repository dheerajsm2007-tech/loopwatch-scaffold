# Loopwatch

A monitor that sits alongside an AI coding agent, watches every step, and halts the
run the moment it detects spinning — reporting spend so far, the reason it stopped,
and a resume / kill / raise-budget choice. Built for FRONTIER 2026, Track 05 (AI
Safety & Observability).

See `TRACE_SCHEMA.md` for the one contract every part of this repo depends on.

## Status

- **Production Status**: ✅ Production-Ready & Demo-Ready (Verified on Windows + local Ollama `qwen2.5:7b`)
- **Automated Test Suite**: 31/31 passed (`pytest -v`)
- **Security Audit**: Zero vulnerabilities; path traversal rejected by `_resolve_within_workspace()` and `RUN_ID_PATTERN`.

## Setup & Running

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Run unit tests
pytest -v

# 3. Run dashboard backend
uvicorn dashboard.server:app --host 127.0.0.1 --port 8000
```

To run the React frontend:
```bash
cd frontend
npm run dev
# Dashboard opens on http://localhost:3000
```

## Demo Script (Live Presentation)

Run all three demo beats back-to-back:
```bash
python -m demo.run_demo
```

1. **Beat 1: Guard Disabled (`demo_guard_off`)**
   - *Narrative*: "Without Loopwatch, a stuck agent spins indefinitely, consuming tokens and building costs invisibly."
   - *Action*: Select `demo_guard_off` in dashboard. Watch cumulative spend climb over steps.
2. **Beat 2: Guard Enabled (`demo_guard_on`)**
   - *Narrative*: "With Loopwatch, Detector 4 measures information novelty and halts the run autonomously around step 5-9."
   - *Action*: Select `demo_guard_on`. Observe `HALTED` banner with exact reasoning.
3. **Beat 3: Long Productive Task (`demo_long_productive`)**
   - *Narrative*: "Loopwatch measures information gain, not just step counts — so complex, 40-step refactoring tasks finish without false kills."
   - *Action*: Select `demo_long_productive`. Observe task completion without halting.

## Evaluation & Corpus

To run the 30-task evaluation corpus against local Ollama:
```bash
python -m eval.run_corpus
```

To compute Catch Rate (% pathological runs halted) vs. False-Kill Rate (% productive runs wrongly halted):
```bash
python -m eval.analyze
```

## Who owns what

| Folder | Owner | What |
|---|---|---|
| `harness/` | Person 1 | agent loop, in-process guard, trace writing |
| `detectors/` (1-3) | Person 1 | hard caps, exact repeat, near repeat |
| `detectors/` (4) | Person 2 | progress detection — the core differentiator |
| `dashboard/` | Person 2 | live spend + novelty curve |
| `eval/` | Person 3 | corpus tasks, corpus runner, catch-rate / false-kill analysis |
| `demo/` | joint | scripted live-demo runs |

## Checkpoints

- [x] **Hour 2** — `TRACE_SCHEMA.md` frozen, `fixtures/sample_trace.jsonl` committed.
- [x] **Hour 6** — detectors 1-3 pass against the fixture (`python -m detectors.replay`); dashboard renders real traces.
- [x] **Hour 12** — real end-to-end run: real harness → real trace → all four detectors → dashboard, live.
- [x] **Hour 16** — full demo (`demo/run_demo.py`) rehearsed and verified.
- [x] **Hour 20** — feature freeze & production hardening complete.

## Why the fixture exists

`fixtures/sample_trace.jsonl` is a fake trace matching the frozen schema, with one clean run and one obviously-spinning run baked in. It allows Person 2 and Person 3 to build and test against real-shaped data starting at hour 2 without waiting for Person 1's real harness to be working.
