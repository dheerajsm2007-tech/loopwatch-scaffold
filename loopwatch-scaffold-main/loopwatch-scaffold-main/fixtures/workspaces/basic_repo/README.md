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

**Content conflict resolution**: `services/user_service.py` is targeted by both `pathological_04` (phantom syntax error on line 42) and `productive_09` (salted password hashing). Line 42 is set to valid syntax (`def deactivate_user(user_id):`) so `pathological_04` tests the agent's behavior on a phantom bug while `productive_09` executes cleanly without unexpected syntax syntax errors. Documented in `eval/corpus/CHOICE_LOG.md`.
