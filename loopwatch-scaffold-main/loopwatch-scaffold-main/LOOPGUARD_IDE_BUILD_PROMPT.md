# Build Prompt: LoopGuard IDE — Streaming Agent Run UX

> **Status**: Planning/spec document only. No source files were modified while
> writing this — it is a handoff prompt for whoever (human or agent session)
> implements the changes described below.
>
> **Supersedes**: an earlier `BUILD_PROMPT_FILE_EXPLORER_CODE_EDITOR.md` (added
> in commit `5c3d8b1`, reverted in `4770417`). That draft was written against a
> Next.js 16 + App Router + shadcn/ui + SSE stack — none of which this repo
> uses. Every recommendation below is grounded in the actual files that exist
> in this repo today (checked by reading them directly, not assumed).

---

## 1. Goal

Reference screenshot: `WhatsApp Image 2026-07-31 at 8.48.58 AM.jpeg` (a preview
of a separate "LoopGuard IDE" build, served from a `space-z.ai` preview URL —
this is a design reference, not code from this repo).

The ask: when a user types a custom task into LoopWatch's live demo, the run
should look and feel like that screenshot — a persistent chat-style agent
panel on the left narrating each step as it happens, and a real file
explorer + Monaco editor on the right that streams in the agent's reads and
edits — instead of the current one-shot "prompt box at the bottom of a step
timeline" layout.

The good news: **the underlying plumbing already exists.** `IdeRightPanel.jsx`,
`FileExplorerTree.jsx`, `POST /api/agent/run`, and 1s polling of
`GET /api/trace/{run_id}` are already built and working (verified by reading
`frontend/src/pages/LiveDemo.jsx`, `frontend/src/components/IdeRightPanel.jsx`,
`frontend/src/components/FileExplorerTree.jsx`, and
`loopwatch-scaffold-main/dashboard/server.py` in full). This is a **UX/layout
rework and a few real data-accuracy fixes**, not a from-scratch build.

---

## 2. What the reference screenshot actually shows (element by element)

Reading the image carefully, top to bottom, left to right:

- **Top nav bar**: `Home` link · a `LoopGuard IDE` badge (green check icon) ·
  a `— no preset —` dropdown · a `New Project` button · a light/dark theme
  toggle (sun icon) on the far right.
- **Left panel sub-header**: two tabs, `Chat` (active) and a status pill next
  to it reading `Idle`; far right of that row shows `ctx 0`.
- **Left panel empty state**: centered pulse/radio icon, heading
  `Start a conversation`, body copy `Describe a task below and the AI agent
  will read files, edit code, and create new files to build your project.`,
  and a keyboard-shortcut hint: `Press ⌘+↵ to run · ⌘+E to evolve your prompt`.
- **Left panel input bar** (bottom): a single-line input
  `Ask the agent to build, fix, or explain something…`, an `Evolve` button,
  and a `Run` button. An avatar chip (`N`) sits at the bottom-left corner.
- **Left panel status bar** (very bottom): `breaker: [green dot]` ·
  `ctx: 0 / 24,000` · `total: 0` · `iter: 0`.
- **Right panel top bar**: `</> Code` (active) / `◎ Preview` toggle.
- **Right panel sub-header**: `Explorer | Changes | Alerts | H[istory]` tabs
  on the left, `No open files` centered, `Current | Diff` toggle on the
  right.
- **File explorer tree**: folder `src` (expanded) containing `auth.ts` (834B),
  `config.ts` (196B), `middlewar…` (419B), `orderServi…` (684B), `server.ts`
  (326B), `types.ts` (262B); then top-level `package.json` (275B),
  `PROJECT_OV…` (2.9K), `README.md` (334B), `tsconfig.json` (224B). **Every
  file row shows a byte-size badge.**
- **Editor empty state**: a `?` icon, `No file open. Pick a file from the
  explorer, or run the agent to see its reads and edits stream in.`
- **Status bar terminology**: `breaker` (armed/tripped), `ctx` (context
  tokens used / budget), `total` (running total — cost or token count),
  `iter` (step/iteration count), `llm: idle` (model activity state).

This is a clean 1:1 conceptual match for LoopWatch's own vocabulary —
`breaker` maps directly to the halt/guard verdict, `iter` to trace step
index, `ctx`/`total` to `input_tokens`/`output_tokens`/`cost_usd` already
present on every trace step per `TRACE_SCHEMA.md`. The reference isn't
introducing new concepts, just a cleaner presentation of data LoopWatch
already computes.

---

## 3. Current state in this repo (verified by reading the actual files)

### 3.1 Left panel — `frontend/src/pages/LiveDemo.jsx`

Today the left column is: run selector → play/pause/speed transport controls
→ `NoveltyChart` → `TraceViewer` (a scrollable list of past steps) → a
one-line prompt `<form>` pinned at the bottom → a status footer.

Concretely, at `LiveDemo.jsx:445-490`, the status footer already contains
`breaker: active`, `ctx: 15,000 / 24,000`, `total: $…`, and
`llm: qwen2.5:7b (Ollama)` — **the labels from the reference screenshot
already exist**, but two of the four are hardcoded literals, not derived
from real data:

```jsx
<span className="flex items-center gap-1 text-emerald-400">
  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> breaker: active
</span>
<span>ctx: 15,000 / 24,000</span>
```

- `breaker: active` is always emerald/"active" — it never reflects
  `verdict.should_halt`.
- `ctx: 15,000 / 24,000` is a fixed string — it never reflects the actual
  sum of `input_tokens`/`output_tokens` across `visibleSteps`.
- `total` and `llm` are correctly wired already (`totalSpend`, static model
  name).

There is no persistent "Chat" panel with an `Idle`/streaming state, no empty
state matching the reference copy, and no `Evolve` button or `⌘+↵` /
`⌘+E` shortcuts.

### 3.2 Step display — `frontend/src/components/TraceViewer.jsx`

Already does a reasonable job of "every step shown neatly": each step is a
card with a tool badge (`search`/`read_file`/`write_file`/`think`, color
coded), timestamp, cost, token counts, a workspace-hash chip, the raw
`arguments` JSON, and the `observation` text, plus a per-step "copy JSON"
button and a tool filter bar. This does **not** need to be rebuilt — it
needs to be re-skinned (see §5.1) and reused as the body of the new Chat
panel, replacing the flat scrolling list with per-step "message" framing
(icon + one-line human-readable action, expandable for the raw
arguments/observation) so a task run reads like a chat transcript rather
than a raw log dump. It currently uses the old cyan/crimson palette
(`#00f0ff`, `#141a26`, `#0e121a`) instead of the GitHub-dark palette
(`#58a6ff`, `#161b22`, `#0d1117`) the rest of the app moved to in
`index.css` — this is a leftover from before the palette migration and
should be updated for visual consistency with `IdeRightPanel`/
`FileExplorerTree`.

### 3.3 Right panel — `IdeRightPanel.jsx` + `FileExplorerTree.jsx`

Already matches the reference closely: Code/Preview toggle, Explorer /
Changes / Alerts / History / Cost sub-tabs, tab strip with close buttons,
Save (Ctrl+S) / Copy / Current-Diff toggle, and an empty state
(`No file open. Pick a file from the explorer to view or edit its code.`) —
nearly the exact copy from the screenshot already. Only `explorer` is wired
up; `changes`/`alerts`/`history`/`cost` all render a static
`"{TAB} View Active"` placeholder (`IdeRightPanel.jsx:138-142`).

`FileExplorerTree.jsx` builds a proper collapsible tree from the flat file
list already — it just doesn't render a size badge per file, because
`GET /api/workspace/{run_id}/files` (`server.py:166-177`) returns a flat
array of path strings only, no size:

```python
files.append(str(p.relative_to(ws_dir)).replace("\\", "/"))
```

### 3.4 Backend — `loopwatch-scaffold-main/dashboard/server.py`

`POST /api/agent/run` already starts a real agent run in a background
thread and returns a `run_id` immediately; the frontend already polls
`GET /api/trace/{run_id}` every `POLL_INTERVAL_MS` (1000ms, from `api.js`)
and gets back real steps + a real detector verdict on every poll
(`evaluate_full_run` re-replays the trace file through all 4 detectors each
time — this is correct/live, not stale). **No SSE/WebSocket work is needed**
to get "streaming" — 1s polling is what the reference screenshot's own
product almost certainly also does under the hood for a preview build like
this, and it's already wired end-to-end here.

The one real gap: **playback vs. live data can race.** `LiveDemo.jsx`
advances `currentStepIndex` on its own `speed`-based timer
(`LiveDemo.jsx:176-196`), independent of how many steps have actually
arrived from the poll. For a live custom run this is wrong — the UI should
never display a step index beyond what the backend has actually returned.
For playback of a *finished* preset/backend trace, the timer-based scrubbing
is fine and should stay as-is.

---

## 4. Non-goals / explicitly out of scope

- **No SSE, WebSockets, or backend streaming rewrite.** The existing 1s
  polling loop already delivers step-by-step updates fast enough for this
  UX; don't add transport complexity that isn't needed. `server.py`'s own
  docstring is explicit about this being a deliberate choice
  ("no websockets, no build step").
- **No framework change.** This is Vite + plain React + Tailwind +
  `lucide-react` + `@monaco-editor/react`, not Next.js/shadcn. Do not port
  TSX/shadcn component code from other references — translate concepts,
  not code.
- **No new "preset"/"New Project" backend concept** unless separately
  requested — the top-nav dropdown and button in the reference are cosmetic
  chrome for now; wiring them to real preset-switching is a separate task.
- **Don't touch `detectors/`, `harness/`, or `TRACE_SCHEMA.md`.** This is a
  frontend presentation + light backend-field-addition task, not a detector
  or trace-schema change.

---

## 5. Concrete build plan

### 5.1 Left panel: turn the timeline into a persistent Chat panel

**File**: `frontend/src/pages/LiveDemo.jsx` (restructure), reusing
`TraceViewer.jsx` (re-skin) and `HaltBanner.jsx` (keep as-is, it already
renders correctly when `verdict.should_halt` is true).

- Add a `Chat` / status-pill sub-header above the step feed:
  `Chat` tab label + a pill showing `Idle` (no run selected /
  `!isSubmittingTask && allSteps.length === 0`), `Running` (a live run is
  actively polling and hasn't finished), or `Done` (finished run, no active
  poll needed). Add `ctx: <used> / 24,000` to that same header row, computed
  as `visibleSteps.reduce((sum, s) => sum + s.input_tokens + s.output_tokens, 0)`
  — **remove the hardcoded `15,000`**.
- Empty state (shown when `allSteps.length === 0` and no run has been
  started yet): centered icon (reuse `Activity` or similar from
  `lucide-react`, already imported), heading `Start a conversation`, body
  copy matching the reference (`Describe a task below and the AI agent will
  read files, edit code, and create new files to build your project.`), and
  a shortcut hint line (`⌘+Enter to run · ⌘+E to evolve your prompt` — on
  Windows/non-Mac, render `Ctrl+Enter` instead of `⌘+Enter`; detect via
  `navigator.platform` or just show both).
- Re-skin `TraceViewer.jsx` step cards as chat "messages": each step becomes
  one message bubble with a small tool icon + a **plain-English one-liner**
  derived from `tool`/`arguments` (e.g. `Read services/auth_service.py`,
  `Wrote payments/processor.py`, `Thinking…`), collapsed by default, with a
  click-to-expand row showing the existing detail (args JSON, observation
  text, cost/tokens/hash chips) — keep all the existing data, just default
  to a denser one-line-per-step view so a 20+ step run doesn't require
  scrolling past walls of JSON to follow along. Update the color tokens from
  `#00f0ff`/`#141a26`/`#0e121a` to the GitHub-dark palette already used
  elsewhere (`#58a6ff`/`#161b22`/`#0d1117`, see `index.css`).
- Replace the bottom prompt `<form>` (`LiveDemo.jsx:446-490`) with an input
  bar matching the reference: text input with placeholder `Ask the agent to
  build, fix, or explain something…`, an `Evolve` button (can be a no-op /
  "coming soon" affordance if prompt-rewriting isn't in scope yet — don't
  block the rest of this on that feature existing), and a `Run` button
  (already exists as `Run Task`, just rename + restyle to match).
- Wire `⌘+Enter`/`Ctrl+Enter` to submit the form and `⌘+E`/`Ctrl+E` to
  trigger `Evolve` via a `useEffect` keydown listener scoped to the input,
  mirroring the existing `Ctrl+S` binding pattern already used in
  `IdeRightPanel.jsx:76-78` (Monaco's `editor.addCommand`) — for a plain
  `<input>` this needs a regular `onKeyDown` handler instead, checking
  `e.metaKey || e.ctrlKey`.
- Fix `breaker` in the status bar to reflect real state: green/`active` when
  `!verdict.should_halt`, red/`tripped` when `verdict.should_halt` — reuse
  the crimson tokens already defined in `index.css`
  (`.border-glow-crimson`/`--color-crimson`).
- Fix live-run playback race (§3.4): when `selectedRunId` is a live/custom
  run that's still being polled (i.e., not a finished/preset trace),
  `currentStepIndex` should track `allSteps.length - 1` directly as new
  steps arrive rather than advancing on an independent `speed` timer. Keep
  the existing timer-based scrubbing for finished/preset traces where
  "replay at 1x/2x/5x" is the intended interaction.

### 5.2 Right panel: wire up remaining tabs + file sizes

**File**: `frontend/src/components/IdeRightPanel.jsx`

- **Changes tab**: list files touched during the current run (derivable
  client-side from `allSteps` — any step with `tool === 'write_file'`,
  deduped by `arguments.path`), each row opening that file in Diff mode
  (`diffMode = true`, reusing the existing `DiffEditor` wiring already
  present at `IdeRightPanel.jsx:259-274`).
- **Alerts tab**: show the detector verdict when `verdict.should_halt` is
  true — detector name, reason, step it triggered at (all already returned
  by `GET /api/trace/{run_id}`'s `verdict` object, no backend change
  needed). Empty state when no halt has occurred.
- **History tab**: simplest useful version is a scrollable list of prior
  `run_id`s from `fetchRuns()` (already fetched in `LiveDemo.jsx`), letting
  the user jump between runs without leaving the IDE view.
- Leave the **Cost** sub-tab out of the top-level tab row shown in the
  reference (it only shows `Explorer | Changes | Alerts | History`) — either
  drop it or fold cost into the status bar only, to match the reference
  exactly.

**File**: `frontend/src/components/FileExplorerTree.jsx`

- Add a byte-size badge next to each file row (right-aligned, muted color,
  matching the reference's `834B` / `2.9K` style — format bytes as `B` under
  1024, `K` with one decimal above that). Requires the backend change below.

**File**: `loopwatch-scaffold-main/dashboard/server.py`

- Extend `GET /api/workspace/{run_id}/files` (`server.py:166-177`) to return
  `{path, size}` objects instead of bare path strings:

  ```python
  files.append({
      "path": str(p.relative_to(ws_dir)).replace("\\", "/"),
      "size": p.stat().st_size,
  })
  ```

  This is a response-shape change — `fetchWorkspaceFiles()` in `api.js` and
  the tree-building logic in `FileExplorerTree.jsx`
  (`buildTreeFromPaths(paths)`, which currently expects a flat array of
  strings) both need to be updated together, in the same change, or the
  tree will break. `buildTreeFromPaths` should carry `size` onto the leaf
  file nodes it builds.

### 5.3 Top nav bar

**File**: `frontend/src/components/Navbar.jsx` (check current contents
before editing — not read in detail for this spec) or a new small header
specific to the `LiveDemo` page if the global `Navbar` shouldn't carry
IDE-specific chrome.

- Add the `LoopGuard IDE` badge treatment (small green-check pill) next to
  wherever the "Live Demo" nav entry currently lives, a `— no preset —`
  disabled-looking dropdown, and a `New Project` button that, at minimum,
  resets `LiveDemo.jsx` state back to its empty/idle state (clears
  `apiTrace`, `openTabs`, `userPrompt`, resets `selectedRunId`) — full
  "project" semantics are out of scope (§4).
- Theme toggle: this repo is dark-mode-only today (`index.css` hardcodes
  `--color-bg: #000000` etc. with no light variant). Treat the sun icon as
  either omitted or a disabled/decorative affordance rather than building a
  full light theme, unless that's separately requested.

---

## 6. Acceptance checklist

- [ ] Submitting a custom task shows a chat-style transcript that grows
      step-by-step as the backend produces them (verified against real
      polling, not just the mock datasets).
- [ ] `breaker`, `ctx`, `total`, `iter` in the status bar all reflect real
      trace data — no hardcoded `15,000` or always-green breaker.
- [ ] File explorer shows a size badge per file, sourced from a real
      backend field, not computed/faked on the frontend.
- [ ] Changes / Alerts / History tabs in the right panel show real data
      instead of the `"{TAB} View Active"` placeholder.
- [ ] Live custom runs never show a step index beyond what the backend has
      actually returned (no racing-ahead via the playback timer).
- [ ] `TraceViewer` step cards use the GitHub-dark palette
      (`#58a6ff`/`#161b22`/`#0d1117`), matching `IdeRightPanel` and
      `FileExplorerTree`, not the old cyan/crimson tokens.
- [ ] `pathological_04`/`productive_09`'s shared target,
      `fixtures/workspaces/basic_repo/services/user_service.py`, and
      `utils/logger.py`, are restored to their documented seed content
      before any fresh corpus/demo run is used to validate this work — both
      currently hold leftover output from a prior live `/api/agent/run`
      call (unrelated to this build, but will produce confusing results if
      not reset first).
