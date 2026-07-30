# Handoff — Person 2 → Person 1: Detector 4 is done

**From:** Person 2
**For:** Person 1 (harness owner)
**Re:** `detectors/detector4_progress.py` — feature-complete, end-to-end verified, ready to wire into `replay.py`
**Date:** 2026-07-30

---

## TL;DR

Detector 4 is built, tested, and ready. The signature `check(steps: list[dict]) -> Result` is exactly what your `detectors/replay.py` already calls (brief line 96). You can `from detectors.detector4_progress import check, Result` and it will drop into your existing `evaluate()` loop with no changes. Smoke test passes against the throwaway fixture (`python -m detectors.detector4_progress` → `ALL PASS`).

---

## What I built

One file: **`detectors/detector4_progress.py`**. Plus a throwaway fixture at `fixtures/sample_trace.jsonl` (see "Fixture note" below).

### Public interface (frozen, do not change)

```python
@dataclass
class Result:
    triggered: bool
    reason: str = ""

def check(steps: list[dict]) -> Result: ...
```

Plus two module-level constants:
- `NO_PROGRESS_WINDOW = 5` — the only knob, deliberately not tuned
- `NO_OBSERVATION_SENTINEL = "<NO_OBSERVATION>"` — internal sentinel for malformed data, see "Edge cases" below

### What it does

Watches the last few steps of a trace. If **the same observation text** AND **the same workspace state** repeat for 5 steps in a row, returns `Result(triggered=True, reason=...)`. Either signal changing on its own is enough to declare progress.

### The two novelty signals (both must fail to trigger)

1. **Observation text changed** — SHA-256 of `step["observation"]` differs from the previous step
2. **Workspace changed** — `step["workspace_hash"]` differs from the previous step

If either signal shows change → progress → reset streak. If both are unchanged → no progress → increment streak. If streak reaches 5 → trigger.

### The key design choice (read this if you have questions)

**Comparison is against the IMMEDIATELY PREVIOUS step, not the full history.**

This is deliberate. A slow build/test cycle re-reads the same log file 5+ times — observation text repeats. With a "set of all seen hashes" check, that would build up stale_streak and false-positive. With "previous step only", the workspace_hash changes every time the build touches a file, which resets the streak and lets the agent keep working. A truly stuck agent produces the same observation AND the same workspace_hash step after step, so neither signal resets.

This is the named false-positive mode on slide 5 of the deck. The "weight workspace_hash higher" strategy (tuning choice, not adding a new signal) is what fixes it.

---

## Verification — what passes right now

Run `python -m detectors.detector4_progress` from the project root. Output:

```
PASS — fixture_productive: triggered=False (expected False)
PASS — fixture_spinning: triggered=True (expected True)
ALL PASS
exit code: 0
```

- `fixture_productive` (12 steps, realistic working agent) → **not triggered** ✅
- `fixture_spinning` (10 identical steps) → **triggered at step 5** ✅

### Other cases verified by hand-built traces (in my testing, not in the smoke test)

- Empty list, 1-step list, 4-step list → not triggered (short-list guard)
- Slow build/test: 20 steps, same observation, `workspace_hash` changing every step → not triggered (the named FP case)
- Missing `observation` key on a step → no crash, treated as progress
- `workspace_hash=None` on every step → triggers on observation signal alone; reason string correctly says `0 saw no workspace change` (None is "no signal", not "unchanged")
- 4 identical steps → not triggered (boundary)
- 5 identical steps → triggered (boundary)

---

## Edge cases — what I hardened, in case your harness emits weird data

| Malformed input | Behaviour |
|---|---|
| `len(steps) < 5` | `Result(False)` immediately |
| Step missing `observation` key | Hashed to sentinel `"<NO_OBSERVATION>"`; treated as progress; no `KeyError` |
| `step["workspace_hash"] is None` | Treated as "no signal this step"; observation signal still applies; reason string does not inflate `quiet_workspace` |
| Step missing `workspace_hash` key | Same as `None` (uses `dict.get`) |
| `observation` is the empty string `""` | Real SHA-256 of empty string; not a special case |

The sentinel is uppercase with angle brackets; SHA-256 hex digests are exactly 64 lowercase hex characters. No collision possible.

---

## The reason string — what shows up in the dashboard and on the slide

When the detector triggers, the `reason` field is:

```
no new information in the last 5 steps: 4 of those steps repeated the
prior observation text and 4 saw no workspace change. Progress requires
either a new observation the agent has not read before, or the workspace
actually changing (workspace_hash differing from the previous step).
```

This is what `replay.py` will pass through to the dashboard and the deck. It is designed to be read cold — it names the window size, both signals, and the exit condition. The "4 of those steps" phrasing absorbs the "first step has no previous step to compare against" subtlety so judges don't ask about it.

---

## Fixture note — please replace

**`fixtures/sample_trace.jsonl` is a throwaway generated by me to close out the smoke test before your real fixture lands.** Per the brief, you own this file. I generated it with the two `run_id` values your `replay.py` hardcodes (`fixture_productive`, `fixture_spinning`) so my smoke test would print `ALL PASS`. When your real fixture arrives:

1. Replace the file.
2. Keep the two `run_id` names (so my smoke test and your `replay.py` both keep working).
3. Delete `fixtures/README.md` (it just notes that the fixture is throwaway).

I added `fixtures/README.md` to mark it as throwaway so it's obvious to anyone looking. If you don't want it, delete it together with the fixture.

If you want to verify my fixture against your schema before deleting it, the fields are: `run_id`, `step`, `timestamp`, `tool`, `arguments`, `observation`, `input_tokens`, `output_tokens`, `cost_usd`, `workspace_hash` — exactly the frozen schema from your `TRACE_SCHEMA.md` (lines 20–48 of the brief).

---

## What I did NOT do

- **Did not touch `detectors/replay.py`** — that's yours
- **Did not change the `check()` signature** — same name, same args, same return type as the brief
- **Did not tune `NO_PROGRESS_WINDOW`** — it stays at 5. Tuning is a decision for the team after Person 3's false-kill-rate number comes in, not something to bake in early
- **Did not add a tests/ directory** — Person 3 owns the evaluation harness
- **Did not build the dashboard** — separate work, also mine, will hand off when it's done

---

## What I need from you

Nothing blocking. Detector 4 is feature-complete from my side. When you wire `replay.py`, the only thing to know is:

- `from detectors.detector4_progress import check, Result` works as-is
- `check()` takes the full `steps` list each time it's called (the brief's `evaluate()` model — see brief line 167). It does not need incremental state.
- The first detector to return `triggered=True` in your `DETECTORS` list wins, in order. Detector 4 is already last in the order in the brief, which is correct — it's the smartest and should only run after the cheaper ones have passed.

If your real fixture produces a `Result` that contradicts the throwaway (e.g. spinning fixture doesn't trigger, or productive fixture does), that's a real signal — please ping me before changing `NO_PROGRESS_WINDOW`. I want to look at the data first.

---

## Files in the project right now

```
PERSON_2_DETECTOR4_DASHBOARD.md        (the brief, unchanged)
HANDOFF_DETECTOR4_TO_PERSON1.md        (this file)
detectors/
  __init__.py                          (empty)
  detector4_progress.py                (the work — feature-complete)
fixtures/
  README.md                            (throwaway marker, delete with fixture)
  sample_trace.jsonl                   (throwaway fixture, please replace)
```

That's it. Ready for your wiring pass.
