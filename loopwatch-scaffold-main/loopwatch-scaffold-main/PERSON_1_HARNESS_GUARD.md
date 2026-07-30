# Loopwatch — Person 1 brief: Harness & Guard

You own the piece everyone else depends on: the agent loop, the in-process
guard, and detectors 1–3. If you're late, everyone is late — protect the
hour 2 checkpoint above everything else.

## Kickoff prompt — paste everything in the box below into Gemini (or Claude, or your editor's AI chat) to start

```
I'm building "Loopwatch" for a 24-hour hackathon — a monitor that halts a
runaway AI coding agent mid-run. My job is the harness: a hand-rolled agent
loop (think -> call a tool -> read result), an in-process guard that wraps
every step and logs it, and the three simplest of four spinning detectors.

Here is the trace schema every part of this project depends on — it's
frozen, do not suggest changing field names:

# Trace schema — FROZEN after hour 2

One JSON object per line (JSONL), one file per run, written to `traces/<run_id>.jsonl`.
If this needs to change after hour 2, say so out loud in the group chat before editing —
every detector and the dashboard read this shape.

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

## Field notes

- `step` — 0-indexed, increments once per think→call→observe cycle.
- `tool` — one of `"search"`, `"read_file"`, `"write_file"`, `"think"`.
- `arguments` — whatever the tool needs; keep it JSON-serializable.
- `observation` — the raw text the agent read back. Detector 4 hashes this.
- `input_tokens` / `output_tokens` / `cost_usd` — from the LLM API response for that step, not estimated.
- `workspace_hash` — hash of the scratch directory's state after this step (e.g. `git rev-parse HEAD` if using a scratch git repo, or a hash of file listing + sizes). Detector 4 uses changes in this to catch progress a text-hash alone would miss (e.g. same search, but a file got edited).

## Who owns this file

Person 1 (harness). If you're Person 2 or 3 and think the schema needs a field, ping the
group before changing this file — everyone's code depends on it staying still.


Here is the exact stub code I'm starting from. Keep every function name,
argument order, and return shape exactly as given — two teammates are
building against these signatures independently and can't see my changes
until I push, so a silent rename breaks their code without warning.

--- harness/agent_loop.py ---
"""
Owner: Person 1

Minimal think -> call a tool -> read result loop. Deliberately hand-rolled,
not a framework, so the "agent-agnostic" story in the deck stays honest and
so there's no framework setup eating hour 0-2.

Three tools only: search, read_file, write_file, all scoped to a scratch
directory so demo runs are safe to blow away and reset.
"""
import time
import uuid

from harness.guard import Guard


def search(workspace: str, query: str) -> str:
    # TODO: naive text search over files in `workspace`
    raise NotImplementedError


def read_file(workspace: str, path: str) -> str:
    # TODO: read a file relative to `workspace`
    raise NotImplementedError


def write_file(workspace: str, path: str, content: str) -> str:
    # TODO: write a file relative to `workspace`
    raise NotImplementedError


def call_llm(messages: list) -> dict:
    """
    TODO: call the LLM API here (Bedrock Converse or Anthropic API directly —
    see the open decision in the deck). Must return a dict with at least:
      { "tool": str, "arguments": dict, "input_tokens": int,
        "output_tokens": int, "cost_usd": float }
    Token counts and cost MUST come from the API response, not be estimated —
    that's what makes the cost number in the deck real.
    """
    raise NotImplementedError


def run_agent(task: str, workspace: str, run_id: str | None = None) -> str:
    """Runs the loop until the agent stops itself, or the guard halts it."""
    run_id = run_id or f"run_{uuid.uuid4().hex[:8]}"
    guard = Guard(run_id=run_id)

    messages = [{"role": "user", "content": task}]
    step = 0

    while True:
        response = call_llm(messages)

        tool = response["tool"]
        args = response["arguments"]

        if tool == "search":
            observation = search(workspace, **args)
        elif tool == "read_file":
            observation = read_file(workspace, **args)
        elif tool == "write_file":
            observation = write_file(workspace, **args)
        elif tool == "done":
            break
        else:
            raise ValueError(f"unknown tool: {tool}")

        verdict = guard.record_step(
            step=step,
            tool=tool,
            arguments=args,
            observation=observation,
            input_tokens=response["input_tokens"],
            output_tokens=response["output_tokens"],
            cost_usd=response["cost_usd"],
            workspace=workspace,
        )

        if verdict.halt:
            print(f"[guard] halted at step {step}: {verdict.reason}")
            print(f"[guard] spend so far: ${verdict.spend_so_far:.4f}")
            break

        messages.append({"role": "tool", "content": observation})
        step += 1
        time.sleep(0)  # placeholder for rate limiting if needed

    return run_id


if __name__ == "__main__":
    # quick manual smoke test once the TODOs above are filled in
    run_agent(task="find and fix the bug in payments/handler.py", workspace="./scratch")


--- harness/guard.py ---
"""
Owner: Person 1

Wraps every step of the agent loop: appends it to traces/<run_id>.jsonl in
the frozen schema (see TRACE_SCHEMA.md), then asks the detectors whether to
halt. Kept separate from agent_loop.py so Person 2 can develop and test
detectors/replay.py against traces/fixtures without touching this file.
"""
import json
import os
from dataclasses import dataclass, field
from pathlib import Path

from detectors import replay

TRACES_DIR = Path(__file__).resolve().parent.parent / "traces"


@dataclass
class Verdict:
    halt: bool
    reason: str = ""
    spend_so_far: float = 0.0


@dataclass
class Guard:
    run_id: str
    total_cost: float = 0.0
    steps: list = field(default_factory=list)

    def record_step(self, step, tool, arguments, observation,
                     input_tokens, output_tokens, cost_usd, workspace):
        entry = {
            "run_id": self.run_id,
            "step": step,
            "tool": tool,
            "arguments": arguments,
            "observation": observation,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "cost_usd": cost_usd,
            "workspace_hash": self._hash_workspace(workspace),
        }
        self.steps.append(entry)
        self.total_cost += cost_usd
        self._append_to_trace_file(entry)

        # TODO: before halting, snapshot the workspace (e.g. copy scratch dir
        # or `git stash`) so a killed run doesn't leave things half-edited.
        result = replay.evaluate(self.steps)
        if result.should_halt:
            return Verdict(halt=True, reason=result.reason, spend_so_far=self.total_cost)
        return Verdict(halt=False, spend_so_far=self.total_cost)

    def _hash_workspace(self, workspace: str) -> str:
        # TODO: hash file listing + sizes, or `git rev-parse HEAD` if workspace
        # is a scratch git repo. Detector 4 depends on this changing when the
        # agent actually edits something.
        raise NotImplementedError

    def _append_to_trace_file(self, entry: dict):
        TRACES_DIR.mkdir(exist_ok=True)
        path = TRACES_DIR / f"{self.run_id}.jsonl"
        with open(path, "a") as f:
            f.write(json.dumps(entry) + "\n")


--- detectors/detector1_caps.py ---
"""
Owner: Person 1

Detector 1 — hard caps. Cheapest, dumbest, catches the worst cases.
"""
from dataclasses import dataclass

MAX_STEPS = 40
MAX_SPEND_USD = 2.00


@dataclass
class Result:
    triggered: bool
    reason: str = ""


def check(steps: list[dict]) -> Result:
    if len(steps) >= MAX_STEPS:
        return Result(True, f"hit step cap ({MAX_STEPS})")

    total_cost = sum(s["cost_usd"] for s in steps)
    if total_cost >= MAX_SPEND_USD:
        return Result(True, f"hit spend cap (${MAX_SPEND_USD:.2f})")

    return Result(False)


--- detectors/detector2_exact.py ---
"""
Owner: Person 1

Detector 2 — exact repeat. Fingerprints each (tool, arguments) pair;
flags if the same fingerprint fires too many times.
"""
import hashlib
import json
from collections import Counter
from dataclasses import dataclass

REPEAT_THRESHOLD = 3  # same exact call this many times -> flag


@dataclass
class Result:
    triggered: bool
    reason: str = ""


def fingerprint(step: dict) -> str:
    payload = json.dumps({"tool": step["tool"], "arguments": step["arguments"]}, sort_keys=True)
    return hashlib.sha256(payload.encode()).hexdigest()


def check(steps: list[dict]) -> Result:
    fingerprints = [fingerprint(s) for s in steps]
    counts = Counter(fingerprints)
    worst_fp, worst_count = counts.most_common(1)[0] if counts else (None, 0)

    if worst_count >= REPEAT_THRESHOLD:
        return Result(True, f"same call repeated {worst_count} times")

    return Result(False)


--- detectors/detector3_near.py ---
"""
Owner: Person 1

Detector 3 — near repeat. Catches "config file" -> "config.json" -> "app
config": different strings, same dead end. Deliberately no embeddings model
(cut for time — see deck's reality-check slide); token-overlap similarity
is cheap, deterministic, and good enough.
"""
import re
from dataclasses import dataclass

WINDOW = 4              # look at the last N same-tool calls
SIMILARITY_THRESHOLD = 0.5   # jaccard overlap to count as "near-repeat"
NEAR_REPEAT_COUNT = 3    # this many near-duplicates in the window -> flag


@dataclass
class Result:
    triggered: bool
    reason: str = ""


def _tokens(step: dict) -> set:
    text = " ".join(str(v) for v in step["arguments"].values())
    return set(re.findall(r"[a-z0-9]+", text.lower()))


def _jaccard(a: set, b: set) -> float:
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)


def check(steps: list[dict]) -> Result:
    if len(steps) < 2:
        return Result(False)

    recent = steps[-WINDOW:]
    same_tool = [s for s in recent if s["tool"] == recent[-1]["tool"]]
    if len(same_tool) < 2:
        return Result(False)

    near_dupes = 0
    base = _tokens(same_tool[-1])
    for s in same_tool[:-1]:
        if _jaccard(base, _tokens(s)) >= SIMILARITY_THRESHOLD:
            near_dupes += 1

    if near_dupes >= NEAR_REPEAT_COUNT - 1:
        return Result(True, f"{near_dupes + 1} near-identical {recent[-1]['tool']} calls in a row")

    return Result(False)


My first task: implement call_llm() in agent_loop.py using [Bedrock Converse
API / Anthropic API directly — tell me which] with model [fill in]. It must
return input_tokens, output_tokens, and cost_usd read from the API response
itself, not estimated — that's what makes our cost number in the deck real
instead of guessed. Then help me implement search/read_file/write_file
scoped to a workspace directory, then _hash_workspace in guard.py (file
listing + sizes, or git rev-parse HEAD if the workspace is a scratch git
repo — your call, tell me the tradeoff).
```

## Your files

| File | What |
|---|---|
| `harness/agent_loop.py` | the loop itself, the three tools, the LLM call |
| `harness/guard.py` | wraps each step, writes to `traces/<run_id>.jsonl`, asks detectors whether to halt |
| `detectors/detector1_caps.py` | step + spend hard caps |
| `detectors/detector2_exact.py` | exact-repeat fingerprinting |
| `detectors/detector3_near.py` | near-repeat token-overlap similarity |
| `detectors/replay.py` | wiring only — you own the dumbest-to-smartest ordering, Person 2 owns detector 4's internals |

## Hour by hour

- **0–2h** — Sit with Person 2 and 3 for 5 minutes, agree the schema is final (it already is, above — just confirm nobody needs a field added). Build the agent loop and guard against the fixture (`fixtures/sample_trace.jsonl`) before real tool calls work, so you can test the guard's halting logic in isolation.
- **2–6h** — Detectors 1–3. Test each with `python -m detectors.replay` — it already runs against the fixture and should print two lines (productive: no halt, spinning: halted by detector 4 once Person 2 has built it — until then, expect only 1-3 to possibly fire).
- **6–12h** — Real `call_llm`, real tools, first real trace file written end-to-end. This is also roughly when Person 3 starts hammering the harness running the corpus in the background — make sure `run_agent()` is stable enough for repeated automated calls by this point, not just interactive testing.
- **12h+** — You're the natural person to drive the hour-12 integration checkpoint (real harness → real trace → all four detectors → dashboard) since your piece is usually done first. After that, float to whoever's behind.

## Don't touch without saying so first

`TRACE_SCHEMA.md` — if you need a new field, say it out loud in the group
chat before editing. Every other file in this repo reads traces assuming
this shape stays still.
