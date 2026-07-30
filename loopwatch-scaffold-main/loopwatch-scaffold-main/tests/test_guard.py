"""
Tests for harness/guard.py — trace writing (must match TRACE_SCHEMA.md
exactly), run_id validation, workspace hashing, and snapshot-before-halt.
"""
import json

import pytest

from harness.guard import Guard

SCHEMA_FIELDS = (
    "run_id",
    "step",
    "timestamp",
    "tool",
    "arguments",
    "observation",
    "input_tokens",
    "output_tokens",
    "cost_usd",
    "workspace_hash",
)


def _step_kwargs(**overrides):
    base = dict(
        step=0,
        tool="search",
        arguments={"query": "x"},
        observation="no matches found",
        input_tokens=10,
        output_tokens=5,
        cost_usd=0.001,
    )
    base.update(overrides)
    return base


def test_record_step_writes_trace_line_with_every_schema_field(tmp_path, monkeypatch):
    monkeypatch.setattr("harness.guard.TRACES_DIR", tmp_path)
    guard = Guard(run_id="test_run")

    guard.record_step(**_step_kwargs(), workspace=str(tmp_path))

    lines = (tmp_path / "test_run.jsonl").read_text().splitlines()
    assert len(lines) == 1
    entry = json.loads(lines[0])
    for field in SCHEMA_FIELDS:
        assert field in entry, f"missing schema field: {field}"
    assert entry["timestamp"].endswith("Z")


def test_record_step_appends_one_line_per_call(tmp_path, monkeypatch):
    monkeypatch.setattr("harness.guard.TRACES_DIR", tmp_path)
    guard = Guard(run_id="test_run")

    guard.record_step(**_step_kwargs(step=0), workspace=str(tmp_path))
    guard.record_step(**_step_kwargs(step=1), workspace=str(tmp_path))

    lines = (tmp_path / "test_run.jsonl").read_text().splitlines()
    assert len(lines) == 2


def test_hash_workspace_changes_when_file_is_edited(tmp_path):
    guard = Guard(run_id="test_run")
    (tmp_path / "a.txt").write_text("v1")
    hash1 = guard._hash_workspace(str(tmp_path))
    (tmp_path / "a.txt").write_text("v2 longer content")
    hash2 = guard._hash_workspace(str(tmp_path))
    assert hash1 != hash2


def test_hash_workspace_changes_on_same_size_content_edit(tmp_path):
    """Regression test: a size-only hash misses same-length edits, which
    undermines detector 4's whole purpose."""
    guard = Guard(run_id="test_run")
    (tmp_path / "a.txt").write_text("aaaa")
    hash1 = guard._hash_workspace(str(tmp_path))
    (tmp_path / "a.txt").write_text("bbbb")
    hash2 = guard._hash_workspace(str(tmp_path))
    assert hash1 != hash2


@pytest.mark.parametrize("bad_run_id", ["../escape", "..\\escape", "/etc/passwd", "a/b", "", "a b"])
def test_guard_rejects_invalid_run_id(bad_run_id):
    with pytest.raises(ValueError):
        Guard(run_id=bad_run_id)


def test_guard_accepts_normal_run_id():
    Guard(run_id="run_2026-07-30_001".replace("-", "_"))  # underscores/alnum only


def test_hash_workspace_stable_when_nothing_changes(tmp_path):
    guard = Guard(run_id="test_run")
    (tmp_path / "a.txt").write_text("v1")
    assert guard._hash_workspace(str(tmp_path)) == guard._hash_workspace(str(tmp_path))


def test_hash_workspace_handles_missing_directory(tmp_path):
    guard = Guard(run_id="test_run")
    missing = tmp_path / "does_not_exist"
    assert guard._hash_workspace(str(missing)) == guard._hash_workspace(str(missing))


def test_record_step_snapshots_workspace_when_replay_says_halt(tmp_path, monkeypatch):
    monkeypatch.setattr("harness.guard.TRACES_DIR", tmp_path / "traces")
    monkeypatch.setattr("harness.guard.SNAPSHOTS_DIR", tmp_path / "traces" / "snapshots")

    class FakeResult:
        should_halt = True
        reason = "fake halt"

    monkeypatch.setattr("harness.guard.replay.evaluate", lambda steps: FakeResult())

    workspace = tmp_path / "workspace"
    workspace.mkdir()
    (workspace / "f.txt").write_text("data")

    guard = Guard(run_id="halt_run")
    verdict = guard.record_step(**_step_kwargs(), workspace=str(workspace))

    assert verdict.halt is True
    assert verdict.reason == "fake halt"
    assert (tmp_path / "traces" / "snapshots" / "halt_run" / "f.txt").exists()


def test_record_step_does_not_snapshot_when_not_halted(tmp_path, monkeypatch):
    monkeypatch.setattr("harness.guard.TRACES_DIR", tmp_path / "traces")
    monkeypatch.setattr("harness.guard.SNAPSHOTS_DIR", tmp_path / "traces" / "snapshots")

    class FakeResult:
        should_halt = False
        reason = ""

    monkeypatch.setattr("harness.guard.replay.evaluate", lambda steps: FakeResult())

    workspace = tmp_path / "workspace"
    workspace.mkdir()

    guard = Guard(run_id="no_halt_run")
    verdict = guard.record_step(**_step_kwargs(), workspace=str(workspace))

    assert verdict.halt is False
    assert not (tmp_path / "traces" / "snapshots" / "no_halt_run").exists()
