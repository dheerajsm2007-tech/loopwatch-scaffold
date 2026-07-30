"""
Owner: Person 1

Wraps every step of the agent loop: appends it to traces/<run_id>.jsonl in
the frozen schema (see TRACE_SCHEMA.md), then asks the detectors whether to
halt. Kept separate from agent_loop.py so Person 2 can develop and test
detectors/replay.py against traces/fixtures without touching this file.
"""
import hashlib
import json
import re
import shutil
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path

from detectors import replay

TRACES_DIR = Path(__file__).resolve().parent.parent / "traces"
SNAPSHOTS_DIR = TRACES_DIR / "snapshots"

# run_id becomes a path segment (traces/<run_id>.jsonl, snapshots/<run_id>/) in
# both this file and dashboard/server.py — an unvalidated run_id is a path-
# traversal / arbitrary file read-write-delete primitive, confirmed exploitable
# via dashboard's GET /api/trace/{run_id} with a backslash-based traversal.
RUN_ID_PATTERN = re.compile(r"^[A-Za-z0-9_-]+$")


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
    halting_enabled: bool = True  # False for demo's "guard off" beat — still traces everything

    def __post_init__(self):
        if not RUN_ID_PATTERN.fullmatch(self.run_id):
            raise ValueError(f"invalid run_id (must match {RUN_ID_PATTERN.pattern}): {self.run_id!r}")

    def record_step(self, step: int, tool: str, arguments: dict, observation: str,
                     input_tokens: int, output_tokens: int, cost_usd: float,
                     workspace: str) -> "Verdict":
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
            "workspace_hash": self._hash_workspace(workspace),
        }
        self.steps.append(entry)
        self.total_cost += cost_usd
        self._append_to_trace_file(entry)

        result = replay.evaluate(self.steps)
        if result.should_halt and self.halting_enabled:
            self._snapshot_workspace(workspace)
            return Verdict(halt=True, reason=result.reason, spend_so_far=self.total_cost)
        return Verdict(halt=False, spend_so_far=self.total_cost)

    def _hash_workspace(self, workspace: str) -> str:
        """Content hash so same-size edits still change the hash (detector 4
        depends on this); skips files that vanish mid-scan instead of raising."""
        base = Path(workspace)
        if not base.exists():
            return hashlib.sha256(b"").hexdigest()
        hasher = hashlib.sha256()
        for p in sorted(base.rglob("*")):
            if not p.is_file():
                continue
            try:
                content = p.read_bytes()
            except OSError:
                continue
            hasher.update(str(p.relative_to(base)).encode())
            hasher.update(content)
        return hasher.hexdigest()

    def _snapshot_workspace(self, workspace: str) -> None:
        """Copy the workspace aside before a halted run leaves it half-edited."""
        src = Path(workspace)
        if not src.exists():
            return
        dest = SNAPSHOTS_DIR / self.run_id
        if dest.exists():
            shutil.rmtree(dest)
        SNAPSHOTS_DIR.mkdir(parents=True, exist_ok=True)
        shutil.copytree(src, dest)

    def _append_to_trace_file(self, entry: dict):
        TRACES_DIR.mkdir(exist_ok=True)
        path = TRACES_DIR / f"{self.run_id}.jsonl"
        with open(path, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry) + "\n")
