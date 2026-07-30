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
