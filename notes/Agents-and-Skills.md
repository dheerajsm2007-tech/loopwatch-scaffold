# Agents & Skills Playbook

How to get maximum leverage out of subagents and skills while building loopwatch,
given the tight hour-by-hour timeline in [[Checkpoints]] and three people working
mostly-independent folders (see the ownership table in [[../README|README]]).

## Standing rules (apply automatically, no need to ask)

- **Complex feature or refactor** → dispatch the `planner` agent before writing code.
- **Just wrote or modified code** → dispatch `code-reviewer` immediately after, before moving on.
- **New feature or bug fix** → follow `tdd-guide` (tests first, then implementation).
- **Architectural decision** (e.g. how detector 4 scores progress) → dispatch `architect`.
- **Security-sensitive code** — anything in `dashboard/` that takes input, or any
  endpoint — is a mandatory `security-reviewer` pass before commit, not optional.
- **Build broken** → `build-error-resolver` to get green again with minimal diffs,
  not architectural rewrites.

## Parallel dispatch

Person 1/2/3 own disjoint folders (`harness/` + `detectors 1-3`, `detector 4` +
`dashboard/`, `eval/`). Independent work like this is exactly what parallel agent
dispatch is for — one message, multiple `Agent` calls, not sequential one-after-another.
Use `superpowers:dispatching-parallel-agents` when kicking off a batch of independent
folder work.

**Delegation completion contract:** if notes/checkpoints get updated by dispatching
an agent, the dispatching side owns collecting the result before ending its turn.
"Waiting for a background agent" is not a stopping point — a spawned task isn't a
finished task.

## Per-folder map

| Folder | Owner | Agents | Skills |
|---|---|---|---|
| `harness/` | Person 1 | `tdd-guide`, `python-reviewer`, `build-error-resolver` | `ecc:python-testing`, `ecc:python-review`, `ecc:tdd-workflow` |
| `detectors/` (1-3, hard caps / exact / near repeat) | Person 1 | `tdd-guide`, `python-reviewer` | `ecc:python-testing`, `ecc:python-review` |
| `detectors/` (4, progress detection — the core differentiator) | Person 2 | `architect` first (design before code), then `tdd-guide`, `python-reviewer` | `ecc:python-patterns`, `ecc:python-testing` |
| `dashboard/` (FastAPI + live UI) | Person 2 | `fastapi-reviewer`, `security-reviewer`, `code-reviewer` | `ecc:fastapi-review`, `ecc:frontend-patterns` if UI logic grows |
| `eval/` (corpus, catch-rate / false-kill analysis) | Person 3 | `tdd-guide`, `python-reviewer` | `ecc:python-testing`, `ecc:eval-harness`, `ecc:benchmark-methodology` |
| `demo/` (joint, hour 16+) | joint | `e2e-runner` | `ecc:e2e-testing`, `ecc:browser-qa` |

## When to go multi-perspective

Detector 4 (progress detection) is the project's core differentiator and the
easiest place to get subtly wrong — worth more than a single reviewer pass.
For that piece specifically, use split-role subagents once there's a real
implementation to critique:

- factual reviewer — does it do what the design doc says?
- senior engineer — is the approach sound, any obvious failure modes?
- security expert — anything here trust untrusted trace data unsafely?
- consistency reviewer — does it match the conventions in `detectors/` 1-3?
- redundancy checker — is this reinventing something detectors 1-3 already do?

## Workflow tool (multi-agent orchestration)

Don't reach for the `Workflow` tool by default — it's opt-in only, per session
rules. If the team explicitly wants a heavier multi-agent pass (e.g. a full
adversarial review before the hour-16 demo freeze), say so and it can be used
then; otherwise stick to direct `Agent` dispatch as described above.

## Before each commit

1. `code-reviewer` (always)
2. `security-reviewer` if the diff touches `dashboard/` or anything parsing
   external input
3. Tests green (`python -m detectors.replay`, plus whatever `eval/` has by then)
4. Check off the relevant line in [[Checkpoints]]
