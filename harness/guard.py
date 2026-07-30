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
