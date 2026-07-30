# Your Role: Person 3 — Corpus, Eval & Deck

One line summary: **you own the credibility number and the pitch narrative.**
Person 1 builds the agent + guard, Person 2 builds the smart detector + dashboard —
but nobody believes any of it works unless *you* prove it with real numbers, and
nobody funds/awards it unless *you* tell the story well on stage.

## Why your role matters

Catch rate alone is easy to fake — a guard that kills every run "catches" 100% of
pathological runs. What makes Loopwatch credible is the **pair** of numbers:

- **Catch rate**: of the ~15 pathological (spinning) tasks, how many did the guard halt?
- **False-kill rate**: of the ~15 productive (legit) tasks, how many did it wrongly halt?

You always report both together: *"caught N/15 pathological runs, wrongly killed M/15
productive runs."* Say the second number before a judge asks — that's what makes the
first one believable.

You also own the **pitch deck from hour zero**, not hour twenty. Slide 6 starts with a
"90% target" placeholder that your real numbers eventually replace.

## Your deliverables

| File | What you do with it |
|---|---|
| `eval/corpus/*.json` | **You write these**: ~15 pathological + ~15 productive task definitions |
| `eval/run_corpus.py` | Runs every corpus task through the real harness → one trace file per task in `traces/` |
| `eval/analyze.py` | Replays traces offline against the detectors → prints catch rate + false-kill rate |
| `demo/run_demo.py` | Joint file — you help script and rehearse the live-pitch runs from hour 16 |
| The pitch deck | Yours from hour 0; swap slide 6's placeholder for your real numbers at the end |

### 1. The corpus (your first, most important task)

Each task is one JSON file in `eval/corpus/`:

```json
{
  "task_id": "pathological_01",
  "category": "pathological",
  "prompt": "find and fix the bug in payments/nonexistent_file.py",
  "workspace_seed": "fixtures/workspaces/basic_repo",
  "expected_outcome": "guard should halt — the file does not exist"
}
```

- **Pathological tasks (~15)**: things that should make an agent spin — missing files,
  bugs in non-existent code, ambiguous instructions with no valid target.
  **Vary the shapes** — if all 15 are the same "file doesn't exist" pattern, the catch
  rate falls apart under judge questioning.
- **Productive tasks (~15)**: real, completable coding tasks of varying length —
  including at least one deliberately long ~40-step task, to prove the guard doesn't
  kill slow-but-real work.

### 2. The runner (`eval/run_corpus.py`)

Loads every JSON in `eval/corpus/`, feeds each prompt through Person 1's real
`harness.agent_loop.run_agent`, producing one trace per task. **Start this the moment
the harness barely works** — 30 real agent runs take real wall-clock time, and this
is the step that quietly eats hours if postponed.

### 3. The analyzer (`eval/analyze.py`)

Replays every trace offline through `detectors.replay.evaluate_full_run`, tallies:
- pathological runs where the detectors said halt → catch rate
- productive runs where they said halt → false-kill rate

Because it replays *offline*, you can re-run it instantly whenever Person 2 tweaks a
detector — no need to re-run the expensive agent runs.

### 4. The demo + deck

From hour 16 you rehearse the scripted demo with Person 2 (guard-off run climbing,
guard-on run halting ~step 9, long productive run allowed to finish), record a backup
video, and finalize the deck with your real numbers.

## Your hour-by-hour plan

| Hours | What you do |
|---|---|
| **0–2** | No harness exists yet — this is NOT downtime. Write the 30 task definitions. Vary difficulty and shape within each category. Start the deck. |
| **2–6** | The moment Person 1's agent loop runs at all, start `run_corpus.py` in the background. Executing 30 real runs is slow — start early. |
| **6–12** | Keep the corpus running. Once Person 2's detector 4 lands, start replaying with `python eval/analyze.py`. |
| **12–16** | Compute catch rate + false-kill rate for real. Bonus (nearly free once replay works): sweep detector thresholds (e.g. `NO_PROGRESS_WINDOW`) and show how the two numbers trade off — the most research-shaped output of the day. |
| **16–20** | Rehearse the live demo end-to-end with Person 2; record a backup video in case the live demo breaks on stage. |
| **20–24** | Replace the deck's "90% target" with real numbers. Polish, buffer, sleep. |

## Constraints to respect

- **The trace schema is frozen after hour 2** and owned by Person 1. If you think it
  needs a field, ping the group chat before touching `TRACE_SCHEMA.md` — every
  detector and the dashboard depend on it staying still.
- `analyze.py` skips traces without a matching corpus task (e.g. demo traces), so
  demo runs won't pollute your numbers.
- Use `fixtures/sample_trace.jsonl` to test your analysis pipeline before any real
  traces exist — you never have to wait idle on Person 1.

## The one sentence to remember

> Anyone can catch everything by killing everything — your job is proving Loopwatch
> catches the spinners **without** killing honest work, and telling that story on stage.
