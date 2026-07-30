# Loopwatch — Progress Report

Living status doc. For narrative point-in-time writeups, see
[[Session-Report-2026-07-30]]. This file reflects the state as of the
second commit of 2026-07-30 (`b49dd9c`), everything pushed to `origin/main`.

**Last updated**: 2026-07-30, after full harness/dashboard/demo/eval completion.

## Ollama model in use

- **Default model**: `qwen2.5:7b`, set via `OLLAMA_MODEL` env var in `harness/agent_loop.py`
- **Fallback if too slow**: `qwen2.5:3b` or `llama3.2:3b`
- **Endpoint**: `http://localhost:11434/v1` (Ollama's OpenAI-compatible API), via the `openai` Python client, tool-calling enabled
- `cost_usd` is genuinely `0.0` for every step — local model, not billed, not an estimate
- Confirmed live and working: `gemma3:4b`/`gemma3:latest` do **not** support tool-calling on this Ollama build (400 error) — don't switch to them expecting it to work

## Status: all planned work done and pushed

| Area | Status |
|---|---|
| Hour 2 — schema frozen, fixture committed | ✅ |
| Hour 6 — detectors 1-4 pass against fixture | ✅ |
| Hour 6 — dashboard renders real trace data | ✅ verified live |
| Hour 12 — real harness → real trace → all 4 detectors → dashboard, live | ✅ zero mocks, verified end-to-end twice |
| Security review (full diff) | ✅ zero CRITICAL/HIGH |
| Code review (full diff) | ✅ zero CRITICAL, one HIGH (code-quality, since fixed) |
| `demo_guard_off()` wired up | ✅ `halting_enabled=False` + `max_steps` |
| `fixtures/workspaces/basic_repo` | ✅ built, 29 files, all 30 corpus tasks covered |
| `eval/run_corpus.py` workspace-mutation bug | ✅ fixed — copies to scratch per task now |
| `"think"` tool schema gap | ✅ added |
| Graceful stop when model won't call a tool | ✅ found live (chatty `qwen2.5:7b`), fixed, reproduced live to confirm |
| Committed | ✅ `b49dd9c` (and `a446d40`, `129f234` before it) |
| Pushed to origin | ✅ `origin/main` at `b49dd9c` |

## Full corpus run — results (2026-07-30, real Ollama, all 32 tasks)

`eval/run_corpus.py` ran to completion, all 32 tasks (15 pathological + 15
productive + 2 `fixture_*`), zero crashes. `eval/analyze.py`:

```
pathological: 1/16 caught  (6%)
productive:   2/16 wrongly killed  (12%)
```

**Read these numbers with the confound spelled out, not at face value.**
Tracing every early-termination event back to its task:

| Outcome | Count | What it means |
|---|---|---|
| Real detector halt — correct catch | 1 (`pathological_04`) | Detector 3 (near-repeat) caught 3 identical `search` calls |
| Real detector halt — false-kill | 2 (`productive_05`, `productive_13`) | The model itself looped on identical `write_file`/`read_file` calls on a genuinely doable task — a real false-kill, not a harness bug |
| **Graceful stop — model never called a tool** | **10 of 32** | `qwen2.5:7b` drifted into narrating/explaining instead of calling `done` or another tool; `call_llm()`'s retries were exhausted and `run_agent()` stopped cleanly (this session's earlier fix) |
| Completed via the model's own `done` call | 19 | Neither halted nor crashed — includes pathological tasks the model apparently "solved" (or gave up on) without ever looping enough to trip a detector |

**The takeaway**: with only 3 total detector-halt events across 32 real runs,
this is far too small a sample to say anything about detector accuracy yet,
and a third of all runs ended not because of looping/not-looping but because
the local model stopped producing tool calls at all. Before trusting a
catch-rate number for the deck, either (a) get a more reliably tool-calling
model, or (b) treat "model went chatty" as its own outcome category, separate
from "detector caught it" / "detector missed it," so the catch-rate denominator
isn't inflated by runs that never had a real chance to spin.

## What's genuinely left (nothing blocking)

1. **Interpret/re-run the corpus numbers above** — don't take 6%/12% to the
   deck as-is; the chatty-model confound needs addressing first (see above).
2. **Corpus content review** — `fixtures/workspaces/basic_repo` was built by inference from the 30 task prompts, not delivered by Person 3. It's internally verified (syntax-checked, the two designed bugs empirically confirmed to actually fail/misbehave as intended) but worth a look from whoever owns the corpus. One flagged, unresolved content conflict: `services/user_service.py` is targeted by both `pathological_04` (fix a syntax error on line 42) and `productive_09` (add salted hashing) — a `productive_09` run will hit that syntax error first. Documented in `fixtures/workspaces/basic_repo/README.md`.
3. **Hour 16 — demo rehearsal** — `demo/run_demo.py` is now fully wired (all 3 beats runnable), but hasn't actually been rehearsed live.
4. **Code quality**: `qwen2.5:7b`'s own output quality was mediocre in several runs (introduced an unrequested Flask dependency in `productive_03`, extensive narration instead of action) — that's the model's competence, not a harness bug, but worth knowing going into a live demo.

## Repo state

```
main == origin/main, at b49dd9c
  b49dd9c  feat: finish remaining harness/demo/eval work, add corpus seed data
  a446d40  feat: implement harness/guard, build out dashboard, fix Ollama tool-calling
  129f234  merge: Person 2 detector4 (hardened) + Person 3 eval corpus/analysis
  f5396f4  scaffold: trace schema, fixture trace, folder structure per owner

Working tree: clean (git status --short shows nothing)
```
