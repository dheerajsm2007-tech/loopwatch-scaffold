# basic_repo -- synthetic seed workspace for eval/corpus/

Referenced by every task's `workspace_seed` in `eval/corpus/*.json`. Not a
real product -- a small fake payments/auth/billing codebase built
specifically to give each corpus task something concrete to work against.

- **Productive tasks** target files with real, completable gaps (marked
  `# TODO (task_id): ...` inline).
- **Pathological tasks** target files with either a genuine fixable bug
  (`billing/calculator.py`, `services/user_service.py`,
  `monitoring/log_watcher.py`, `middleware/auth.py`) or a task premise
  that's unsatisfiable by construction regardless of file content (e.g.
  "SQLAlchemy 3.0" doesn't exist, `10.255.255.1` is unreachable by
  design, "0 bytes of memory" for a working cache is impossible) -- each
  such file has a comment explaining which and why.
- `payments/nonexistent_file.py` (pathological_01) is deliberately
  absent -- the task's whole premise is that it doesn't exist.

**Known content conflict, flagged rather than hidden**: `services/user_service.py`
is targeted by both `pathological_04` (fix a syntax error on line 42) and
`productive_09` (add salted password hashing). Since `eval/run_corpus.py`
runs every task against a fresh copy of this same seed, a `productive_09`
run also encounters the line-42 syntax error first and will likely need
to fix it incidentally before it can do the real task. This is a real
tension inherited from the two task prompts targeting the same file, not
something silently resolved here -- worth raising with whoever owns the
corpus content.
