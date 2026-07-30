# Improvements Report — 2026-07-30

Covers: the dashboard redesign done this round, the dead-code audit findings,
and a forward-looking list of what's worth improving next — split into
project-level and codebase-level.

## What changed this round

**Dashboard frontend — full redesign** (`dashboard/static/index.html`), built
against the `dataviz` skill's method rather than by eye:
- Validated reference palette used as-is (categorical slots 1/2 for spend/novelty,
  status-critical for the halt banner) — light and dark mode both fully specified,
  not an automatic flip.
- Proper line-chart specs: 2px lines, ~10% opacity area fill, crosshair+tooltip
  hover (Chart.js `interaction: {mode: 'index', intersect: false}`), hairline
  recessive gridlines, text in text-tokens never series color.
- Halt banner uses the status-critical color **with an icon and label**, never
  color alone, per the palette's own status-color rule.
- Table-view toggle on both charts — the accessibility twin every chart needs.
- Fixed a real (if minor) issue in the old version along the way: the run
  selector used to build `<option>` HTML via template-literal `innerHTML`
  (`select.innerHTML = runs.map(...)`) — run IDs are filesystem-derived and
  validated, so this wasn't exploitable, but it's still the wrong pattern.
  Replaced with `document.createElement` + `replaceChildren`.
- Verified live in a real browser (not just curl): dark mode, light mode, the
  halt banner, and the table toggle all screenshotted and confirmed working
  against real trace data, including a deliberately-halted run.

**Dead-code audit** (`pyflakes` across `harness/`, `detectors/`, `dashboard/`,
`eval/`, `demo/`, `tests/` — zero findings) plus a manual pass:
- Removed a **genuine no-op**: `time.sleep(0)` in `run_agent()`'s loop, labeled
  "placeholder for rate limiting" — sleeping for exactly 0 seconds does not
  rate-limit anything; it was dead weight with a misleading comment. Removed
  it and the now-unused `import time` alongside it.
- Fixed one stale comment referencing TODOs that no longer exist.
- Everything else came back clean — no unused imports, no dead functions, no
  tracked build artifacts (`__pycache__`, `.pyc`). This codebase is lean
  because it was built and reviewed twice already this session; there wasn't
  much to find. That's a real finding, not a non-answer.

Verified after cleanup: 31/31 tests pass, `detectors.replay` clean on both
fixtures, `pyflakes` clean.

## What's worth improving next — project level

1. **Run the full 30-task corpus for real.** Only 2 of 30 tasks have actually
   executed against live Ollama. This is the single highest-value next step —
   it's what produces the real catch-rate/false-kill numbers the deck needs,
   and it's the only way to know if `fixtures/workspaces/basic_repo`'s inferred
   content actually behaves as designed at scale.
2. **Tune the detector thresholds using real corpus data.** `NO_PROGRESS_WINDOW=5`,
   `MAX_STEPS=40`/`MAX_SPEND_USD=$2.00`, `REPEAT_THRESHOLD=3`,
   `SIMILARITY_THRESHOLD=0.5` are all deliberately untuned defaults per the
   original design intent — a real tuning pass only makes sense once #1 exists.
3. **Rehearse `demo/run_demo.py` live.** All 3 beats are wired and runnable now,
   but running the actual demo end-to-end (with the dashboard open) hasn't happened.
4. **Get a real review of `fixtures/workspaces/basic_repo`** from whoever owns
   the corpus — it was built by inferring intent from 30 task prompts, not
   delivered as a spec. One known content conflict is already flagged in its
   own README (`services/user_service.py` targeted by two incompatible tasks).
5. **README.md doesn't mention Ollama setup.** A new contributor following the
   current root README's setup steps has no idea they need Ollama running
   locally with `qwen2.5:7b` pulled — that's a real onboarding gap.
6. **`eval/run_corpus.py` runs all 30 tasks sequentially.** Each is an
   I/O-bound wait on Ollama; parallelizing (even a small worker pool) would
   directly address the original brief's own warning that this "quietly eats
   hours."

## What's worth improving — codebase level

1. **No shared `conftest.py`.** Nearly every test in `tests/test_guard.py` and
   several in `tests/test_agent_loop.py` repeat the same
   `monkeypatch.setattr("harness.guard.TRACES_DIR", tmp_path / "traces")`
   setup. A pytest fixture would remove that duplication.
2. **Path-constant boilerplate is repeated, not shared.** `guard.py`,
   `dashboard/server.py`, and `eval/run_corpus.py` each independently compute
   `Path(__file__).resolve().parent.parent` to find the repo root and derive
   `TRACES_DIR`/similar. A single `paths.py` (or constants module) would be
   one source of truth instead of three.
3. **Magic numbers are scattered, not centralized.** `MAX_WRITE_FILE_BYTES`,
   `MAX_SEARCH_FILE_BYTES`, `OLLAMA_TIMEOUT_SECONDS`, `MAX_CALL_RETRIES`
   (agent_loop.py), `NO_PROGRESS_WINDOW` (detector4), the hard caps (detector1)
   — each lives as a module-level constant in its own file. Fine at this size;
   would benefit from one settings module if the team or config surface grows.
4. **No type checking configured.** Type hints are used inconsistently (some
   functions fully typed, some not) with no `mypy`/`pyright` run anywhere —
   not enforced, so drift is possible.
5. **`run_agent()` is still ~85 lines** even after extracting `_execute_tool()`
   this session (down from ~100+). The message-construction block (building
   the assistant `tool_calls` message) could be its own small helper too.
6. **`demo/run_demo.py` doesn't clean up `./demo_workspace_*` between runs** —
   re-running the demo script reuses whatever a prior run left behind rather
   than a fresh workspace. Same underlying pattern `eval/run_corpus.py` had
   before this session's fix.
7. **No integration test for `dashboard/server.py`.** All dashboard testing
   this session was manual (curl, then a real browser) — a `TestClient`-based
   test suite would catch regressions like the earlier `pytest` collection
   break (`basic_repo/tests/` got picked up by accident) automatically instead
   of by luck.
8. **No structured logging.** `logging.warning()` exists in one place
   (`call_llm()`'s retry path); everything else is `print()`. Fine for a
   hackathon demo, worth a real logging setup (levels, maybe a file handler)
   if this becomes a longer-lived project.

## What's explicitly *not* a problem (checked, not just assumed)

- No unused imports, dead functions, or unreachable code in the real project
  source (`pyflakes` clean across every source directory).
- No build artifacts (`__pycache__`, `.pyc`) tracked in git.
- `requirements.txt` — every listed package (`fastapi`, `uvicorn`, `openai`,
  `pytest`) is genuinely used; nothing to trim.
