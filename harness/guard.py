"""
Owner: Person 1

Wraps every step of the agent loop: appends it to traces/<run_id>.jsonl in
the frozen schema (see TRACE_SCHEMA.md), then asks the detectors whether to
halt. `enabled=False` still logs every step (so the dashboard shows the
climb) but never halts -- that's your "guard off" demo run.
"""
import json
import re
import shutil
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path

from detectors import replay
from harness.tools import hash_workspace

TRACES_DIR = Path(__file__).resolve().parent.parent / "traces"
SNAPSHOTS_DIR = Path(__file__).resolve().parent.parent / "snapshots"

# run_id becomes a path segment (traces/<run_id>.jsonl, snapshots/<run_id>_stepN/)
# -- unvalidated, this was a confirmed path-traversal vulnerability earlier
# this session (arbitrary file read via dashboard's /api/trace/{run_id}).
RUN_ID_PATTERN = re.compile(r"^[A-Za-z0-9_-]+$")


@dataclass
class Verdict:
    halt: bool
    reason: str = ""
    detector: str = ""
    spend_so_far: float = 0.0


@dataclass
class Guard:
    run_id: str
    enabled: bool = True
    total_cost: float = 0.0
    steps: list = field(default_factory=list)

    def __post_init__(self):
        if not RUN_ID_PATTERN.fullmatch(self.run_id):
            raise ValueError(f"invalid run_id (must match {RUN_ID_PATTERN.pattern}): {self.run_id!r}")

    def record_step(self, step, tool, arguments, observation,
                     input_tokens, output_tokens, cost_usd, workspace):
        entry = {
            "run_id": self.run_id,
            "step": step,
            "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "tool": tool,
            "arguments": arguments,
            "observation": observation,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "cost_usd": cost_usd,
            "workspace_hash": hash_workspace(workspace),
        }
        self.steps.append(entry)
        self.total_cost += cost_usd
        self._append_to_trace_file(entry)

        if not self.enabled:
            return Verdict(halt=False, spend_so_far=self.total_cost)

        result = replay.evaluate(self.steps)
        if result.should_halt:
            self._snapshot_workspace(workspace)
            return Verdict(
                halt=True,
                reason=result.reason,
                detector=result.detector,
                spend_so_far=self.total_cost,
            )
        return Verdict(halt=False, spend_so_far=self.total_cost)

    def _snapshot_workspace(self, workspace: str):
        SNAPSHOTS_DIR.mkdir(exist_ok=True)
        dest = SNAPSHOTS_DIR / f"{self.run_id}_step{self.steps[-1]['step']}"
        if dest.exists():
            shutil.rmtree(dest)
        shutil.copytree(workspace, dest)

    def _append_to_trace_file(self, entry: dict):
        TRACES_DIR.mkdir(exist_ok=True)
        path = TRACES_DIR / f"{self.run_id}.jsonl"
        with open(path, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry) + "\n")
