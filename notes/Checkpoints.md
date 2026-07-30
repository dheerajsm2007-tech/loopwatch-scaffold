# Checkpoints

Live tracking against the plan in [[../README|README]]. Check items off as they land.

- [x] **Hour 2** — `TRACE_SCHEMA.md` frozen, `fixtures/sample_trace.jsonl` committed
- [x] **Hour 6** — detectors 1-3 pass against the fixture (`python -m detectors.replay`); dashboard renders real (non-fixture) trace data, confirmed live
- [x] **Hour 12** — first real end-to-end run: real harness → real trace → all four detectors → dashboard, live. Verified with zero mocks/fixtures: real `run_agent()` call against `qwen2.5:7b`, real `traces/hour12_real_check.jsonl`, real `evaluate_full_run()` pass, real dashboard render of that exact trace via `curl`.
- [ ] **Hour 16** — full demo (`demo/run_demo.py`) rehearsed twice
- [ ] **Hour 20** — feature freeze, bugfixes only
- [ ] **Last 1-2 hours** — buffer, no new work
