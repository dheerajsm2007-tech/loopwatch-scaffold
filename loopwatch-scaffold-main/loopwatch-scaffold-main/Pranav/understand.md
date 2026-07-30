# Understanding: Loopwatch

> Note: `project_context.md` in this repo is empty, so this understanding is built from
> `README.md`, `TRACE_SCHEMA.md`, and `person_3.eval.md`.

## What the project is

**Loopwatch** is a 24-hour hackathon project (FRONTIER 2026, Track 05 — AI Safety &
Observability). It is a **monitor/guard that sits alongside an AI coding agent**, watches
every step the agent takes, and **halts the run the moment it detects the agent
"spinning"** (looping without making progress). When it halts, it reports:

- how much money has been spent so far,
- the reason it stopped,
- and offers a choice: **resume / kill / raise budget**.

The core pitch: runaway AI agents burn tokens and money doing the same useless thing over
and over. Loopwatch catches that in real time — without killing agents that are actually
doing productive (even if long) work.

## The one contract everything depends on: the trace schema

Every agent step is logged as one JSON object per line (JSONL) to `traces/<run_id>.jsonl`.
The schema is **frozen after hour 2** and owned by Person 1:

| Field | Meaning |
|---|---|
| `run_id` | which run this step belongs to |
| `step` | 0-indexed think→call→observe cycle counter |
| `timestamp` | when the step happened |
| `tool` | one of `search`, `read_file`, `write_file`, `think` |
| `arguments` | JSON-serializable tool inputs |
| `observation` | raw text the agent read back (Detector 4 hashes this) |
| `input_tokens` / `output_tokens` / `cost_usd` | real numbers from the LLM API, not estimated |
| `workspace_hash` | hash of the scratch dir's state after the step — catches "same search, but a file changed" progress |

Everything (detectors, dashboard, eval) reads this shape, which is why it must stay still.

## Architecture / who owns what

| Folder | Owner | What |
|---|---|---|
| `harness/` | Person 1 | agent loop, in-process guard, trace writing |
| `detectors/` 1–3 | Person 1 | hard caps, exact repeat, near repeat |
| `detectors/` 4 | Person 2 | **progress detection** — the core differentiator |
| `dashboard/` | Person 2 | live spend + novelty curve (FastAPI/uvicorn) |
| `eval/` | **Person 3 (you)** | corpus tasks, corpus runner, catch-rate / false-kill analysis |
| `demo/` | joint (hour 16+) | scripted live-demo runs |
| `fixtures/` | shared | hand-written fake trace so Persons 2 & 3 can build from hour 2 without waiting on the real harness |

## Timeline checkpoints

- **Hour 2** — schema frozen, `fixtures/sample_trace.jsonl` committed. Nothing downstream starts before this.
- **Hour 6** — detectors 1–3 pass against the fixture; dashboard renders it.
- **Hour 12** — first real end-to-end run: harness → trace → all 4 detectors → dashboard.
- **Hour 16** — full demo rehearsed twice.
- **Hour 20** — feature freeze; bugfixes only.
- **Last 1–2 hours** — buffer, no new work.

## The demo (live pitch)

Three scripted runs (`demo/run_demo.py`):
1. Impossible task, **guard OFF** → spend counter climbs until manually killed.
2. Impossible task, **guard ON** → halts around step 9, reports spend + reason.
3. A legitimately long productive task the guard **correctly lets finish**.

## The credibility metric

The headline result is **not** catch rate alone — anyone can catch 100% by killing
everything. The project's credibility rests on reporting **both**:

- **Catch rate** — % of pathological (spinning) runs correctly halted.
- **False-kill rate** — % of productive runs wrongly halted.

These two numbers, produced by Person 3's eval pipeline, replace the "90% target"
placeholder on slide 6 of the pitch deck.
