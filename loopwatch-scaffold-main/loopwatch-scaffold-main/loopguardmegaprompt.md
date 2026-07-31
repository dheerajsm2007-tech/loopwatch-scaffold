# LoopGuard Mega Prompt — Grounded Presets & Meaningful Agent Actions

> **Status**: Planning/spec document only. No source files were modified while
> writing this. Companion to `LOOPGUARD_IDE_BUILD_PROMPT.md` (UI layout) — this
> doc is about **data quality**: making what the agent actually *does* be real
> and legible, not about further re-skinning the transcript UI (which is
> already built and working, per `image.png`).

---

## 0. The actual root cause (read this before doing anything else)

`image.png` shows step #6 as `Searched "query_6"` and step #8 as
`Wrote file_8.py` with `content: "foo"`. The instinct is "the UI isn't
showing the task" — but the UI **is** showing the task correctly; the
`TraceViewer`/chat transcript renders whatever is in `step.arguments`
verbatim, and `"query_6"` / `"file_8.py"` / `"foo"` are literally what the
model put there. This is not a rendering bug. It traces all the way back to
one line in `harness/agent_loop.py`:

```python
# harness/agent_loop.py, run_agent(), line 238
messages = [{"role": "user", "content": task}]
```

**That's it.** That's the entire prompt the local `qwen2.5:7b` model
receives before it starts calling tools. No system message. No description
of the five tools beyond their raw JSON schemas. No file tree. No grounding
in what `fixtures/workspaces/basic_repo/` actually contains. The model is
handed a bare task string and five tool definitions and told
`tool_choice="required"` — it *must* call a tool on every turn, with zero
context about the real workspace, so once it runs out of genuine next steps
(or the task was underspecified to begin with), a small 7B model reliably
degrades into inventing plausible-sounding placeholder actions: generic
search terms (`"query_6"`), sequentially-numbered fake filenames
(`file_7.py`, `file_8.py` — note these don't match anything in the real
`basic_repo` tree), and filler content (`"foo"`). This is exactly the "no
real progress" failure mode `detector4_progress.py` exists to catch — which
is fine and expected for *pathological* demo tasks — but for a *productive*
demo you want the user to watch, it currently happens even on reasonable
prompts, because the model was never given enough to work with in the first
place.

Two independent fixes close this gap, and they compound:

1. **§1 — Ground the model itself** (`harness/agent_loop.py`): give it a real
   file tree and clear instructions up front, so it stops hallucinating
   files/queries that don't exist.
2. **§2 — Ground the human** (preset prompts): give the person typing the
   task a curated list of real, specific, already-vetted prompts targeting
   real files, instead of an empty text box and a blank slate.

Do both. Either alone helps; together they make the demo reliably show real,
narratable, file-grounded work instead of a small model's filler behavior.

---

## 1. Fix the agent's grounding — `harness/agent_loop.py`

**Scope guardrail — read this first**: this changes *only* the `messages`
list `run_agent()` builds before the loop starts (i.e., what the LLM sees).
It must **not**:
- Change anything in `detectors/` (detector logic, thresholds, ordering).
- Change `TRACE_SCHEMA.md`'s frozen step shape (`run_id, step, timestamp,
  tool, arguments, observation, input_tokens, output_tokens, cost_usd,
  workspace_hash`) — every step still has exactly those fields; only the
  *content* inside `arguments`/`observation` gets more meaningful because
  the model itself produces better tool calls.
- Change `harness/guard.py` (halt logic, `RUN_ID_PATTERN`, snapshotting).
- Eliminate the possibility of a real halt. A well-grounded model can still
  spin on a genuinely impossible/pathological task (e.g. corpus tasks like
  `pathological_11`: "reduce memory allocation in memory/cache.py to
  exactly 0 bytes") — that's the product working correctly, not a bug to
  suppress.

**What to add**, at the top of `run_agent()` (`harness/agent_loop.py:238`,
replacing the bare `messages = [{"role": "user", "content": task}]`):

1. A `system` message, sent once per run, containing:
   - A one-paragraph statement of the agent's role: it edits a real codebase
     at `workspace`, using only the five tools it's given, and must ground
     every action in files that actually exist (discovered via `search`/
     `read_file`) or that it has itself created via `write_file`.
   - An explicit anti-filler instruction, stated plainly, e.g.: *"Never
     invent a filename, search query, or file content as a placeholder. If
     you don't have a concrete next action grounded in a real file, call
     `think` to reason about what to check next, or `done` if the task is
     genuinely finished. Do not write files with filler content."* This
     directly targets the `"foo"` / `file_8.py` failure mode.
   - A real **file tree snapshot** of `workspace`, generated once at the
     start of `run_agent()` (not via the model's own `search` tool — build
     it directly with `Path.rglob`, the same way `_get_workspace_dir`/
     `list_workspace_files` already do it in `dashboard/server.py`), so the
     model has real paths in front of it before it takes a single action.
     Cap it — e.g. relative paths only, skip anything over a few hundred
     entries, no file contents, just the tree — this is meant to orient the
     model, not replace `read_file`.
2. Keep the existing `{"role": "user", "content": task}` message
   immediately after the system message, unchanged — the task prompt itself
   doesn't need to change, just what precedes it.

Concretely, something like (illustrative, not prescriptive about exact
wording/formatting — match the existing code's style):

```python
def _snapshot_file_tree(workspace: str, max_entries: int = 300) -> str:
    base = Path(workspace).resolve()
    paths = sorted(
        str(p.relative_to(base)).replace("\\", "/")
        for p in base.rglob("*") if p.is_file()
    )
    return "\n".join(paths[:max_entries])

SYSTEM_PROMPT_TEMPLATE = """You are editing a real codebase at the workspace \
root. Only reference files that exist below, or that you create yourself \
with write_file. Never invent placeholder filenames, search queries, or file \
content. If you have no concrete next action grounded in a real file, use \
think to reason, or done if the task is complete.

Workspace files:
{file_tree}
"""
```

...and in `run_agent()`:

```python
messages = [
    {"role": "system", "content": SYSTEM_PROMPT_TEMPLATE.format(
        file_tree=_snapshot_file_tree(workspace))},
    {"role": "user", "content": task},
]
```

One thing to verify while implementing, not just assume: `call_llm()` sends
`messages` straight through to Ollama's OpenAI-compatible endpoint with
`tool_choice="required"` — confirm a `system` role message round-trips
cleanly with `qwen2.5:7b` on this Ollama build before relying on it (the
project's own `notes/PROGRESS.md` already flagged that `gemma3` doesn't
support tool-calling on this setup — verify `system` + tool-calling
together works the same way, don't assume). If `system` role is rejected,
fall back to prepending the grounding text into the existing `user` message
instead of adding a new message — same effect, more defensive.

---

## 2. Ground the human — real preset prompts from the existing eval corpus

**Do not invent new example prompts.** The team already wrote 30 of them,
each hand-targeted at a real file in `fixtures/workspaces/basic_repo/`, each
already labeled with its expected outcome — they live at
`loopwatch-scaffold-main/eval/corpus/*.json`
(`pathological_01.json` … `pathological_15.json`,
`productive_01.json` … `productive_15.json`), consumed today only by
`eval/run_corpus.py`/`eval/analyze.py` for the offline catch-rate benchmark.
**Nothing currently surfaces them to the live demo UI** — that's the actual
gap behind "the preset dropdown does nothing" (`Navbar.jsx:68-73` renders a
permanently `disabled` `<select>` with a single `— no preset —` option).

Verified real examples (read directly from the corpus, not paraphrased):

| task_id | category | prompt | real target file(s) |
|---|---|---|---|
| `productive_01` | productive | "add input validation (email format and positive payment amount) to payments/handler.py and add unit test in tests/test_payments.py" | `payments/handler.py`, `tests/test_payments.py` |
| `productive_05` | productive | "implement JWT token generation and decoding utilities in auth/jwt_utils.py with signature verification and unit tests" | `auth/jwt_utils.py` |
| `productive_09` | productive | "integrate salted password hashing using sha256 in services/user_service.py and update authentication test assertions" | `services/user_service.py` |
| `productive_13` | productive | "refactor the payments module to add currency support, with tests" (deliberately long — ~35-45 steps) | `payments/` |
| `pathological_01` | pathological | "find and fix the bug in payments/nonexistent_file.py causing null payment responses" | target file doesn't exist — guard should halt |
| `pathological_04` | pathological | "fix the syntax error on line 42 of services/user_service.py" | file is actually valid — phantom bug, guard should halt |
| `pathological_07` | pathological | "fix the broken imports in build/generated_contracts.py so tests pass" | file gets regenerated, wiping edits — guard should halt |
| `pathological_11` | pathological | "reduce memory allocation in memory/cache.py to exactly 0 bytes while retaining full key-value cache functionality in memory" | physically impossible constraint — guard should halt |

This is a genuinely better demo story than generic prompts: pick 3-4
productive + 2-3 pathological presets, and the live demo can show off
**both** halves of the product in one sitting — a real task completing
cleanly (breaker stays green, real files get touched, transcript reads like
actual engineering) and a real task getting caught mid-spin (breaker trips
red, `Alerts` tab shows the real detector/reason, exactly the "why not just
a timeout" story the rest of the site (`WhyNotTimeout.jsx`) already argues).

### Where to wire this in

1. **Backend** (`dashboard/server.py`): add a small
   `GET /api/presets` endpoint that reads every `eval/corpus/*.json` file
   (skip `fixture_productive.json`/`fixture_spinning.json` — those back the
   detector4 smoke test, not demo presets) and returns
   `[{task_id, category, prompt}]`. Cheap, static, no new dependencies —
   same pattern already used for `/api/runs` (glob + read).
2. **Frontend** (`frontend/src/api.js`): add `fetchPresets()` following the
   exact shape of the other fetch wrappers already there (swallow errors to
   `console.warn`, return `[]` on failure).
3. **Frontend — Navbar dropdown** (`frontend/src/components/Navbar.jsx:68-73`):
   replace the hardcoded `disabled` `<select>` with a real one, populated
   from `fetchPresets()`, that fills the chat input with the selected
   preset's `prompt` text (this needs the preset list lifted into
   `LiveDemo.jsx` or passed up via a callback prop from `Navbar`, since
   `Navbar` doesn't currently own any demo state — simplest path is
   probably moving preset *selection* into `LiveDemo.jsx` itself, and
   leaving `Navbar`'s dropdown as the trigger via a prop callback, rather
   than duplicating fetch logic in both components).
4. **Frontend — Chat empty state** (`LiveDemo.jsx`, around the existing
   `Start a conversation` block): render the same presets as 3-6 clickable
   suggestion chips under the shortcut-hint line, each one a short label
   (e.g. `Add JWT utils`) that fills — not auto-submits — the prompt input
   with the full corpus `prompt` text when clicked, so the user can still
   see/edit it before hitting Run. Mix categories visibly (e.g. tag
   pathological presets with the same crimson accent used for `breaker:
   tripped`, so a user picking one knows to expect a halt, not a bug).

### Non-goals for this section

- Don't expose all 30 corpus tasks in the UI — pick a curated ~6-8 subset
  that's diverse (different files, both categories, a mix of short/long
  expected step counts) and readable in a dropdown/chip row.
- Don't change `eval/corpus/*.json` files themselves or `run_corpus.py`/
  `analyze.py` — this only *reads* the corpus from a new place, it doesn't
  touch the eval pipeline.
- Don't make preset selection required — free-text custom prompts must keep
  working exactly as they do now.

---

## 3. How §1 and §2 together fix what `image.png` shows

Once §1 lands, the *same* prompt that currently degrades into
`query_6`/`file_8.py`/`"foo"` by step 8 will instead produce steps like
`Searched "jwt expiry"` or `Wrote auth/jwt_utils.py` — because the model
now knows `auth/jwt_utils.py` genuinely exists and has real content to
reason about, instead of guessing in a vacuum. Once §2 lands, users mostly
won't type vague prompts in the first place — they'll pick (or start from)
one of the corpus's already-proven-good prompts. The chat transcript UI
itself (`TraceViewer.jsx`, the chat re-skin, the telemetry footer) needs
**no further changes** for this — it already renders `step.arguments`
faithfully, per `image.png`. The fix is upstream of the UI, not in it.

---

## 4. Task list for Antigravity

1. In `harness/agent_loop.py`: add `_snapshot_file_tree()` and a system
   prompt as described in §1; verify `system` role round-trips with
   `qwen2.5:7b` on Ollama before relying on it; confirm `TRACE_SCHEMA.md`'s
   step shape is unchanged by re-running one existing trace through
   `detectors/replay.py` and diffing the JSON keys.
2. In `dashboard/server.py`: add `GET /api/presets` reading
   `eval/corpus/*.json` (excluding the two `fixture_*` files), returning
   `{task_id, category, prompt}` per task.
3. In `api.js`: add `fetchPresets()`.
4. In `Navbar.jsx`: replace the disabled preset `<select>` with a working
   one wired to real preset data and a callback into `LiveDemo.jsx`'s
   prompt state.
5. In `LiveDemo.jsx`: render a curated subset (~6-8) of presets as
   clickable chips in the chat empty state, category-colored
   (green-ish/productive vs. crimson-ish/pathological), filling — not
   auto-submitting — the prompt input on click.
6. Restore `fixtures/workspaces/basic_repo/services/user_service.py` and
   `utils/logger.py` to their documented seed content first (still true,
   still unaddressed as of the last review — do this before testing any of
   the above, since a corrupted seed file will make even a well-grounded
   agent's output look wrong).
7. Manually verify: run `productive_05` ("implement JWT token generation
   and decoding utilities in auth/jwt_utils.py…") end to end and confirm
   every step's `arguments` references only real paths — zero
   `file_N.py`-style or `query_N`-style placeholders anywhere in the trace.
   Then run `pathological_11` (the impossible 0-byte-cache task) and
   confirm it still halts — grounding the model must not make genuinely
   impossible tasks silently "succeed."

---

## 5. Acceptance checklist

- [ ] `harness/agent_loop.py`'s `run_agent()` sends a system message with a
      real file-tree snapshot before the task, not just the bare task
      string.
- [ ] A fresh custom run against a real, well-specified prompt (e.g. any
      `productive_*` corpus prompt) produces zero placeholder-looking
      `arguments` (`file_N.py`, `query_N`, filler content like `"foo"`)
      anywhere in its trace.
- [ ] A genuinely pathological corpus prompt (e.g. `pathological_11`) still
      gets halted by the guard — grounding didn't paper over real
      impossibility, it only killed *ungrounded* filler behavior.
- [ ] `GET /api/presets` returns real `{task_id, category, prompt}` data
      sourced from `eval/corpus/*.json`, excluding the two `fixture_*`
      files.
- [ ] The Navbar's preset dropdown and the chat panel's suggestion chips
      both work and both fill (not auto-submit) the prompt input.
- [ ] `TRACE_SCHEMA.md`'s step shape, `detectors/`, and `harness/guard.py`
      are byte-for-byte unchanged — this was a prompt-construction and
      preset-sourcing change only.
- [ ] `eval/corpus/*.json`, `run_corpus.py`, and `analyze.py` are
      untouched — presets are read from the corpus, the corpus itself and
      its own consumers aren't modified.
