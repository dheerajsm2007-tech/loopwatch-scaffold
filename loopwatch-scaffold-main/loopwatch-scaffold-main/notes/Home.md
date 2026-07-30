# Loopwatch

Monitor that sits alongside an AI coding agent, watches every step, and halts the
run the moment it detects spinning. FRONTIER 2026, Track 05 (AI Safety & Observability).

Source of truth for contracts and setup lives in the repo root, not here:

- [[../README|README]] — setup, ownership table, checkpoints
- [[../TRACE_SCHEMA|TRACE_SCHEMA]] — the one contract everything depends on
- [[../PERSON_1_HARNESS_GUARD|PERSON_1_HARNESS_GUARD]]

This vault is for running notes, decisions, and scratch thinking during the build —
not a substitute for those docs.

## Areas

- [[Checkpoints]] — live checklist against the README's hour-by-hour plan
- [[Agents-and-Skills]] — playbook for using subagents/skills at full leverage
- [[Session-Report-2026-07-30]] — harness/guard implementation, review findings, next steps
- [[PROGRESS]] — living status doc: what's done, what's left, Ollama model, checkpoint tracker
- Harness (Person 1)
- Detectors 1-3 (Person 1)
- Detector 4 — progress detection (Person 2)
- Dashboard (Person 2)
- Eval — corpus + catch-rate analysis (Person 3)
- Demo — joint, from hour 16
