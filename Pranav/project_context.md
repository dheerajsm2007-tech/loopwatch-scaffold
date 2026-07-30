# Loopwatch — Full Project Context

A single reference for the whole project: the idea, the deck, the architecture, the
repo, and the plan. Paste this into a fresh AI session (Gemini, Claude, anything) or
keep it open in your editor when you need full context without re-explaining anything.

---

## 1. Event & submission

- **Event:** FRONTIER 2026, AWS Student Builder Groups, VIT Chennai — July 30–31, Netaji Auditorium AB-1
- **Format:** Round 1 is a PPT pitch for selection into Round 2 (a 24-hour build)
- **Track:** 05 — AI Safety & Observability
- **Team name:** Top notch coders
- **Team members:** Dheerajkumar Sasikumar (25BAI1082), Vijayaraghavan (25BAI1194), Pranav Kumar (25BAI1772)
- **Project title:** Loopwatch
- **One-line pitch:** "Loopwatch watches every step an AI coding agent takes and halts the run the moment it starts spinning — before the bug becomes the bill."
- **Tools on hand:** two Gemini Pro, one Claude Pro, split across the three of you

---

## 2. The problem

AI coding agents run in a think → call a tool → read the result loop that stops only
when the agent decides it's done. A stuck agent never decides, so it spins: retrying
an error it doesn't understand, searching for a file that doesn't exist, rewriting
the same code. Nothing crashes and no alert fires, so today a runaway run is
discovered from the invoice, not from a warning.

Agentic coding tools already run $200–$2,000+ per engineer per month, with bills
swinging 2–3x quarter over quarter. Today's agent observability tools — Langfuse,
LangSmith, Datadog's LLM monitoring — surface cost and latency after the fact in a
dashboard; **none of them autonomously halts a run based on whether it's still
making progress.** That's the real gap, not "nobody watches cost" (they do).

---

## 3. The solution

Loopwatch is a monitor that sits alongside a coding agent, inspects every step as it
happens, and halts the run the moment it detects spinning — reporting spend so far,
the reason it stopped, and a resume / kill / raise-budget choice.

A hard step-and-spend cap catches the worst cases in minutes of work, but can't tell
a stuck agent from a legitimately long one. The fourth detector asks whether the
last few steps produced any new information at all — a new file read, a new fact
learned, a changed state — which is what actually tells the two apart.

---

## 4. The mechanism — four detectors, dumbest to smartest

1. **Hard caps** — step count and spend ceiling. Catches the worst cases with almost no engineering.
2. **Exact repeat** — fingerprint each tool call (tool + arguments); flag identical fingerprints repeating.
3. **Near-repeat** — token-overlap similarity on recent same-tool calls; catches "config file" → "config.json" → "app config" — different strings, same dead end. (No embeddings model — cut deliberately for build time; see §7.)
4. **Progress detection — the core contribution.** A running hash-set of every tool observation, plus a hash/diff of workspace state between steps. A new hash or a changed workspace counts as progress; several steps in a row with neither means the agent isn't learning anything new, regardless of how different the steps look on the surface.

## 5. Why this isn't just a timeout

A step limit kills a stuck agent and a legitimately long one equally, because it
only counts steps. Detector 4 distinguishes them because it measures **information
gain**, not step count or surface variation. This is the first thing a knowledgeable
judge will probe — lead with it, don't bury it.

**Related objection to prepare for:** "isn't this just Langfuse/LangSmith/Datadog?"
Answer: those tools alert and dashboard; none of them autonomously halts a run based
on a progress signal. That's the sharper, defensible version of the gap — say this,
not "nobody watches cost," which is technically false.

---

## 6. Architecture & tech stack

```
Agent (hand-rolled loop) → In-process guard → LLM api + tools
                                 │      ▲
                     writes to  ▼      │ verdict: kill / pause / resume
                          Trace log (JSONL)
                                 │
                    ┌────────────┴────────────┐
              Detectors 1–4                Dashboard
           (offline replay)            (live spend + novelty curve)
```

- **Agent loop:** hand-rolled Python (~150 lines), not a framework — keeps the
  "agent-agnostic" story honest and avoids framework setup eating hours 0–2. Three
  tools: search, read_file, write_file, scoped to a scratch workspace.
- **LLM & tool calls:** Amazon Bedrock Converse API (Claude models) — gives exact
  per-call input/output token counts, which is what makes the cost number *measured*
  rather than estimated. Open decision: fall back to the Anthropic API directly if
  Bedrock credentials/model access aren't sorted quickly — don't lose an hour to IAM.
- **Guard:** a Python wrapper around each step; raises on halt, snapshots the
  workspace first so a killed run doesn't leave things half-edited.
- **Trace store:** one JSON Lines file per run — no database server, appends
  naturally, exactly what offline replay needs.
- **Detectors 1–3:** pure Python — `hashlib` fingerprints, token-overlap similarity.
- **Detector 4:** SHA-256 hashes of observations + a workspace hash/diff.
- **Dashboard:** FastAPI serving the trace file; one static HTML page with Chart.js
  polling every second. No React, no build step, no websockets.

---

## 7. Scope & reality check (the honest limits)

**In scope for 24 hours:** a self-written agent loop, an in-process guard, all four
detectors, a live dashboard, and a demo on a guaranteed-impossible task plus a
legitimately long one.

**Out of scope:** framework-agnostic support (LangChain, Claude Code, etc.) and a
pre-run cost governor — real future work, not this build.

**Cost to run:** near zero beyond the LLM calls the agent itself makes, since
detectors evaluate saved traces rather than live inference.

**Known failure mode — named on purpose:** Detector 4 can misread a slow
build/test cycle as "no progress" for a few steps while the agent is genuinely
working. This is reported as the false-kill rate rather than hidden.

**Roadmap after the hackathon:** an OpenTelemetry-based sidecar, paired with a
cost-governor dashboard (predict costs pre-run, then protect with Loopwatch —
clean two-workstream split for a bigger team later).

---

## 8. Measurement & impact

Report **catch rate** (% of genuinely stuck runs correctly halted) against
**false-kill rate** (% of healthy long runs wrongly killed) — never catch rate
alone, since anything can hit 100% catch rate by killing everything. Measured
across ~15 pathological runs and ~15 long-but-productive runs.

**Current deck state:** slide 6 shows "90%" explicitly labeled as a **target**, not
a real result, since the hackathon hasn't run yet. Replace this with the real
number the moment `eval/analyze.py` produces one — see §12.

---

## 9. What we built on (citations, already in the deck)

1. Yao et al., "ReAct: Synergizing Reasoning and Acting in Language Models," ICLR 2023 (arXiv:2210.03629) — the think/act/observe loop the agent and guard are built around.
2. OpenTelemetry GenAI Semantic Conventions (`open-telemetry/semantic-conventions-genai`) — the span/token-usage shape the trace log follows; what the post-hackathon OTel sidecar would emit into.
3. Amazon Bedrock Converse API documentation — source for exact per-call token accounting.

Borrowed vs. ours: the trace format and span shape draw on [1] and [2]; the four
detectors, the guard, and the dashboard are original.

---

## 10. Repo structure

```
loopwatch/
  TRACE_SCHEMA.md      ← frozen contract, see §11
  README.md
  requirements.txt
  .gitignore
  harness/              Person 1 — agent_loop.py, guard.py
  detectors/             Person 1 (1–3), Person 2 (4)
    detector1_caps.py
    detector2_exact.py
    detector3_near.py
    detector4_progress.py
    replay.py            (wiring — dumbest-to-smartest order)
  dashboard/             Person 2 — server.py, static/index.html
  eval/                   Person 3
    corpus/               ~15 pathological + ~15 productive task JSON files
    run_corpus.py
    analyze.py
  demo/                   joint — run_demo.py (two scripted pitch runs + one long-productive)
  fixtures/
    sample_trace.jsonl   ← hand-written fake trace, lets Person 2 & 3 start before the real harness works
  role_briefs/
    PERSON_1_HARNESS_GUARD.md
    PERSON_2_DETECTOR4_DASHBOARD.md
    PERSON_3_EVAL_DECK.md
  traces/                 real run output, gitignored (regenerated constantly)
```

Smoke test that always works, even before any real code is written:
```bash
python -m detectors.replay
```
Should print one line for a productive fixture (no halt) and one for a spinning
fixture (halted by `no_progress`).

---

## 11. Trace schema (frozen — do not change without telling the group)

```json
{
  "run_id": "run_2026-07-30_001",
  "step": 0,
  "timestamp": "2026-07-30T09:00:00Z",
  "tool": "search",
  "arguments": {"query": "config file"},
  "observation": "no matches found in /workspace",
  "input_tokens": 812,
  "output_tokens": 140,
  "cost_usd": 0.0031,
  "workspace_hash": "d41d8cd98f00b204e9800998ecf8427e"
}
```

`tool` is one of `search`, `read_file`, `write_file`, `think`. Token counts and cost
come from the LLM API response, never estimated. `workspace_hash` changes when the
agent actually edits something — Detector 4 depends on this.

---

## 12. Team roles & hour-by-hour plan

| Person | Owns | Tool |
|---|---|---|
| 1 | Harness, guard, detectors 1–3 — the trace-format contract | Claude Pro |
| 2 | Detector 4 (core contribution), live dashboard | Gemini Pro |
| 3 | Corpus (~30 tasks), eval/analysis, deck narrative | Gemini Pro |

Full detail, embedded stub code, and a ready-to-paste kickoff prompt for each
person's AI assistant live in `role_briefs/`.

- **Hour 0–2:** Trace schema confirmed (already frozen above), fixture trace
  committed. Person 3 starts writing the corpus task list (real work, not filler).
- **Hour 2–6:** Person 1 builds detectors 1–3; Person 2 builds Detector 4 and the
  dashboard skeleton, both against the fixture, without waiting on the real harness.
- **Hour 6–12:** Real harness produces real traces. Person 3 starts running the
  corpus in the background. First real end-to-end integration test — someone should
  actively drive this, not assume it works.
- **Hour 12–16:** Person 3 computes catch rate / false-kill rate and (if time)
  sweeps detector thresholds.
- **Hour 16–20:** Full demo rehearsed twice, backup video recorded.
- **Hour 20–24:** Feature freeze at hour 20. Deck gets real numbers swapping out
  the "90% target." Last 1–2 hours are pure integration buffer — don't schedule new
  work there.

---

## 13. Objections to have answers ready for

- **"Isn't this just a timeout?"** → Detector 4 measures information gain, not step
  count; a step limit can't tell stuck from long-running, Detector 4 can.
- **"Isn't this Langfuse/LangSmith/Datadog?"** → Those alert and dashboard; none of
  them autonomously halts based on a progress signal. That's the actual gap.
- **"What breaks Detector 4?"** → A slow build/test cycle can look like no progress
  for a few steps while genuinely working — named honestly in the deck as the
  false-kill risk, which is why that number is reported, not hidden.

---

## 14. Deliverables produced so far

- `Loopwatch.pptx` — the Round 1 pitch deck, all 7 slides filled, architecture
  diagram embedded, references cited.
- `loopwatch_scaffold.zip` — this repo structure, working detector pipeline
  (tested against the fixture), role briefs.
- `PERSON_1_HARNESS_GUARD.md`, `PERSON_2_DETECTOR4_DASHBOARD.md`,
  `PERSON_3_EVAL_DECK.md` — standalone copies of the role briefs for pasting
  directly into each person's AI assistant.
