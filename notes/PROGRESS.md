# Loopwatch — Progress Report

Living status doc. For the point-in-time writeup of the harness/guard build
specifically, see [[Session-Report-2026-07-30]]. This file covers everything
up to and including the Person 2 + Person 3 merge.

**Last updated**: 2026-07-30T12:18 IST — full codebase audit

## Ollama model in use

- **Default model**: `qwen2.5:7b`, set via `OLLAMA_MODEL` env var in `harness/agent_loop.py` (falls back to `qwen2.5:7b` if unset)
- **Fallback if too slow on this machine**: `qwen2.5:3b` or `llama3.2:3b`
- **Endpoint**: `http://localhost:11434/v1` (Ollama's OpenAI-compatible API), reached via the `openai` Python client, tool-calling enabled
- `cost_usd` is genuinely `0.0` for every step — no billing, local model, still satisfies `TRACE_SCHEMA.md`'s "not estimated" requirement
- This was a deliberate choice (your call, when asked) over Anthropic API / Bedrock, which is what `PERSON_1_HARNESS_GUARD.md` originally framed as the options

## What's done, in order

1. **Obsidian vault** — `notes/` connected as a vault ([[Home]], [[Checkpoints]], [[Agents-and-Skills]]).
2. **Agents & skills playbook** — per-folder subagent/skill mapping for the team.
3. **`/ecc:plan-orchestrate`** run against `PERSON_1_HARNESS_GUARD.md` → 5-step `/orchestrate` breakdown.
4. **`harness/agent_loop.py` implemented** (268 lines) — 4 tools (`search`/`read_file`/`write_file`/`done`), all scoped to workspace (path-traversal guarded via `_resolve_within_workspace()`, UTF-8, `MAX_WRITE_FILE_BYTES=1MB` cap, `MAX_SEARCH_FILE_BYTES=200KB` skip). `call_llm()` wired to local Ollama with tool-calling, `tool_choice="required"`, 60s timeout, and retry-on-malformed-output (up to `MAX_CALL_RETRIES=2`). `run_agent()` correctly inserts assistant tool_calls messages before tool-role messages (CRITICAL fix for multi-step Ollama).
5. **`harness/guard.py` implemented** (105 lines) — content-based `_hash_workspace()` (SHA-256 of file paths + contents, not just sizes), `timestamp` field in ISO-8601 UTC, workspace snapshot on halt via `shutil.copytree`, `RUN_ID_PATTERN` validation (`^[A-Za-z0-9_-]+$`) to prevent path traversal.
6. **Code review** (subagent) — found and fixed a CRITICAL bug (broken OpenAI tool-calling message sequence, would break every real run past step 1) plus HIGH (uncaught `TypeError` on bad tool args, Windows encoding could silently corrupt trace text) and MEDIUM issues (missing type hints, size-only hash missed same-size edits).
7. **Security review** (subagent) — found and fixed a CRITICAL, **exploit-confirmed** vulnerability: unvalidated `run_id` allowed path traversal, proven via a live PoC against `dashboard/server.py`'s trace endpoint (arbitrary file read, no auth). Fixed in both `guard.py` (chokepoint) and `dashboard/server.py` (the confirmed sink — Person 2's file, edited anyway given a live exploit).
8. **30 tests added**, all passing (`tests/test_agent_loop.py` — 16 tests, `tests/test_guard.py` — 14 tests). Covers: tool sandboxing, path-escape rejection, call_llm parsing/retry/failure, OpenAI message sequence regression, tool argument mismatch recovery, trace schema compliance, workspace hashing (including same-size edit detection), run_id validation, snapshot-on-halt behavior.
9. **Detector 4 merged** (170 lines) — replaced with Person 2's hardened version from `test1/` (handles missing `observation` via `NO_OBSERVATION_SENTINEL`, compares against immediately-previous step, not full history, `NO_PROGRESS_WINDOW=5`). Byte-for-byte copy, logic untouched. `HANDOFF_DETECTOR4_TO_PERSON1.md` preserved at repo root.
10. **Detectors 1-3 implemented**: detector1_caps (27 lines, `MAX_STEPS=40`, `MAX_SPEND_USD=$2.00`), detector2_exact (35 lines, `REPEAT_THRESHOLD=3` same fingerprint), detector3_near (53 lines, Jaccard token overlap `>=0.5`, `NEAR_REPEAT_COUNT=3` in `WINDOW=4`).
11. **`detectors/replay.py`** (72 lines) — runs all 4 detectors in order (dumbest→smartest), used live by guard.py and offline by eval/analyze.py. `evaluate_full_run()` replays saved trace file step-by-step.
12. **Eval corpus merged** — 33 task JSON files in `eval/corpus/` (15 pathological + 15 productive + 2 fixtures + 1 README). Plus Person 3's `Pranav/` working notes and `.agents/AGENTS.md`.
13. **`eval/analyze.py`** (67 lines) — offline replay producing catch rate + false-kill rate numbers for the deck.
14. **`eval/run_corpus.py`** (33 lines) — runs every corpus task through the real harness.
15. **Dashboard** — `dashboard/server.py` (132 lines, FastAPI): `/api/runs` lists traces, `/api/trace/{run_id}` replays through all 4 detectors returning per-step `novel` flags + halt verdict, `RUN_ID_PATTERN` validation. `dashboard/static/index.html` (150 lines): Chart.js cumulative spend + novelty charts, halt banner via `.textContent` (XSS-safe), 1s polling, run selector dropdown.
16. **Committed** as `129f234` — 41 files, exactly the detector4 + eval merge, nothing else mixed in.

## Closed this session (2026-07-30, later)

- **Real-Ollama unblock** — root cause was environment, not code: `qwen2.5:7b` wasn't pulled, and the fallback models available (`gemma3:4b`/`gemma3:latest`) don't support tool-calling at all on this Ollama build (`400: does not support tools`). Pulled `qwen2.5:7b` (4.7GB); re-verified live — response shape parsing, `tool_choice="required"`, and the `tool_call_id` pairing fix (previously mock-only) all confirmed working against a real 3-step run.
- **Dashboard built out** — it wasn't actually unbuilt (FastAPI + Chart.js + 1s polling already existed), it was missing halt-verdict surfacing and a real detector-4-accurate novelty signal. Both added: `/api/trace/{run_id}` now replays the trace through `detectors.replay.evaluate_full_run()` and returns per-step `novel` flags mirroring detector 4's real two-signal (observation-or-workspace-hash-changed-vs-previous-step) logic; frontend renders a prominent halt banner via `.textContent` (no XSS).
- **Hour-12 checkpoint fully verified, zero mocks/fixtures**: real `run_agent()` call → real `traces/hour12_real_check.jsonl` (2 real steps, model actually fixed a real bug in a scratch file) → real `evaluate_full_run()` pass (no crash, correctly didn't halt) → real dashboard `curl` showing that exact trace rendered live.
- **Security + code review run on the full diff** — zero CRITICAL/HIGH security findings (path-traversal fix confirmed still intact, halt-reason rendering confirmed XSS-safe, no leftover Bedrock/Anthropic credentials). Code review: one HIGH (code-quality only — `run_agent()` over the 50-line guideline), a couple MEDIUM/LOW nits, tests still 30/30.

## ⚠️ Most important open item: uncommitted work

Steps 4-8 above (the actual harness/guard implementation and **both CRITICAL
fixes**) exist **only in the working tree right now** — they were
deliberately kept out of the `129f234` merge commit since that commit was
scoped to just the detector4/eval merge, per instruction ("don't touch
harness/, dashboard/"). They are not yet a separate commit, and the local
`main` branch is 1 commit ahead of `origin/main` with **neither** commit
pushed. If this machine is lost or the working tree is reset, this work is
gone.

## Current repo state (verified 2026-07-30T12:18 IST)

```
main (1 commit ahead of origin/main, nothing pushed)
  129f234 (HEAD -> main)  merge: Person 2 detector4 (hardened) + Person 3 eval corpus/analysis
  f5396f4 (origin/main)   scaffold: trace schema, fixture trace, folder structure per owner

Modified (tracked, uncommitted — git diff HEAD):
  M  .gitignore                   (trace/scratch exclusions, Obsidian vault state)
  M  dashboard/server.py          (run_id validation — CRITICAL security fix + novelty/halt API)
  M  dashboard/static/index.html  (halt banner, novelty chart, run selector)
  M  harness/agent_loop.py        (full implementation + tool-calling fix)
  M  harness/guard.py             (full implementation + run_id validation)
  M  requirements.txt             (openai instead of anthropic/boto3)

Untracked:
  ?? PERSON_1_HARNESS_GUARD.md     (task spec — should probably be committed)
  ?? notes/                        (this Obsidian vault)
  ?? test1/                        (Person 2's original handoff drop — safe to delete)
  ?? tests/                        (30 tests — MUST be committed)

Traces (gitignored, regenerated):
  traces/hour12_real_check.jsonl   (2-step real run from hour-12 verification)
```

## What's left to do

### 🔴 Critical (data-loss / blocking)

1. **Commit the uncommitted work** — 6 modified + 2 untracked directories (`tests/`, `PERSON_1_HARNESS_GUARD.md`) contain ALL the actual implementation. Recommended commit scope:
   - `.gitignore`, `requirements.txt`
   - `harness/agent_loop.py`, `harness/guard.py`
   - `dashboard/server.py`, `dashboard/static/index.html`
   - `tests/test_agent_loop.py`, `tests/test_guard.py`
   - `PERSON_1_HARNESS_GUARD.md`
2. **Push to origin** — both `129f234` (merge commit) and the new commit need to reach GitHub. Local `main` is already 1 ahead of `origin/main`.

### 🟡 Required for demo (Hour 16 checkpoint)

3. **Wire up `demo/run_demo.py`'s `demo_guard_off()` TODO** — line 21-22 has a TODO: currently calls `run_agent()` same as guard-on; needs a flag on `Guard` (e.g. `halting_enabled=False`) or a separate `run_agent()` code path that skips the guard's halt check, and a manual stop after N steps.
4. **Create `fixtures/workspaces/basic_repo`** — every single corpus task's `workspace_seed` points to `fixtures/workspaces/basic_repo` which **does not exist**. Neither `run_corpus.py` nor any demo run can work without it. Needs at minimum a few Python files with planted bugs to match the corpus prompts.

### 🟠 Important but non-blocking

5. **`eval/run_corpus.py` workspace mutation bug** (flag for Person 3) — uses `workspace_seed` directly as the live workspace without copying to a scratch directory first. Re-running the corpus mutates the shared seed, not a disposable copy. Fix: `shutil.copytree(workspace_seed, tmp_dir)` before each run.
6. **`TRACE_SCHEMA.md` lists `"think"` as a valid tool** — `run_agent()` doesn't define or handle a `"think"` tool. Either add it (a no-op tool that just returns the agent's reasoning as observation) or update the schema to remove it. Group-chat decision needed.
7. **`guard.py` trace-file write missing `encoding="utf-8"`** — line 103: `open(path, "a")` should be `open(path, "a", encoding="utf-8")`. On Windows, the default encoding is `cp1252`, which could silently corrupt non-ASCII observation text in the trace file.

### ⚪ Cleanup (optional)

8. **Delete `test1/`** — the original Person 2 handoff drop. Everything needed has been extracted (`detector4_progress.py` copied, `HANDOFF_DETECTOR4_TO_PERSON1.md` kept at repo root). 3 subdirs + 2 files, safe to remove.
9. **Extract `run_agent()` tool-dispatch block** — latest code review flagged it as HIGH (code quality): the function is 70+ lines. Extract the `if tool == "search" ... elif ...` block into a `_execute_tool()` helper.
10. **Decide on `notes/`** — currently untracked. The Obsidian vault has useful docs (`Checkpoints.md`, `Session-Report`, `Agents-and-Skills.md`, this file). Either commit the `.md` files (not `.obsidian/` state) or keep them local-only.

## File inventory (verified)

| Path | Lines | Owner | Status |
|---|---|---|---|
| `harness/agent_loop.py` | 268 | Person 1 | ✅ implemented, uncommitted |
| `harness/guard.py` | 105 | Person 1 | ✅ implemented, uncommitted |
| `dashboard/server.py` | 132 | Person 2 (+ P1 security fix) | ✅ implemented, uncommitted |
| `dashboard/static/index.html` | 150 | Person 2 (+ P1 enhancements) | ✅ implemented, uncommitted |
| `detectors/detector1_caps.py` | 27 | Person 1 | ✅ committed |
| `detectors/detector2_exact.py` | 35 | Person 1 | ✅ committed |
| `detectors/detector3_near.py` | 53 | Person 1 | ✅ committed |
| `detectors/detector4_progress.py` | 170 | Person 2 | ✅ committed (hardened) |
| `detectors/replay.py` | 72 | Person 1 + 2 | ✅ committed |
| `eval/run_corpus.py` | 33 | Person 3 | ✅ committed (has workspace mutation bug) |
| `eval/analyze.py` | 67 | Person 3 | ✅ committed |
| `eval/corpus/` | 33 files | Person 3 | ✅ committed |
| `demo/run_demo.py` | 40 | Joint | ⚠️ committed but `demo_guard_off()` is a TODO |
| `tests/test_agent_loop.py` | 185 | Person 1 | ✅ implemented, **untracked** |
| `tests/test_guard.py` | 146 | Person 1 | ✅ implemented, **untracked** |
| `fixtures/sample_trace.jsonl` | — | Person 1 | ✅ committed |
| `fixtures/workspaces/basic_repo` | — | — | ❌ **missing** |
| `TRACE_SCHEMA.md` | 35 | Person 1 | ✅ committed, frozen |
| `requirements.txt` | 5 | Person 1 | ✅ modified (openai), uncommitted |

## Progress against [[Checkpoints]]

| Checkpoint | Status |
|---|---|
| Hour 2 — schema frozen, fixture committed | ✅ done |
| Hour 6 — detectors 1-3 pass against fixture | ✅ done |
| Hour 6 — detector 4 (hardened) merged and passing | ✅ done (this session) |
| Hour 6 — dashboard renders real trace data | ✅ done — verified live via curl |
| Hour 12 — real harness → real trace → all 4 detectors → dashboard, live | ✅ done — zero mocks/fixtures, verified end-to-end |
| Corpus (`eval/corpus/*.json`) | ✅ 33/33 files present (merged this session) |
| `fixtures/workspaces/basic_repo` (needed to actually run the corpus) | ❌ **missing** — blocks `run_corpus.py` and all demos |
| Hour 16 — demo rehearsed twice | ⬜ not started — `demo_guard_off()` is a TODO, `basic_repo` missing |
| Hour 20 — feature freeze | ⬜ not reached |
| Work committed to git | ⚠️ **partial** — merge committed; harness/guard/dashboard/tests NOT committed |
| Work pushed to origin | ⬜ nothing pushed this session |
