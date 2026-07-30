# Demo Rehearsal Log — 2026-07-30

- **Date / Time**: 2026-07-30 16:30 IST
- **Target Presentation Duration**: 3 minutes (90s demo presentation + 90s judge Q&A)
- **Hardware Profile**: Local execution via Windows + Ollama OpenAI-compatible API (`qwen2.5:7b` at `http://localhost:11434/v1`)
- **Web Frontend**: React + Vite on `http://localhost:3000`, FastAPI Backend on `http://127.0.0.1:8000`

---

## Scripted Demo Beats (Verbatim Script)

### Beat 1: The Problem — Runaway Agent with Guard Disabled (30s)
> **Speaker**: *"Today's AI coding agents run in an autonomous loop: think, call a tool, observe result, and repeat until the agent decides it's done. But when an agent gets stuck—like searching for a non-existent file or retrying a dead-end fix—it never decides it's done. Watch what happens here on the Loopwatch dashboard when the guard is disabled: the step counter climbs, API tokens burn, and cost builds up continuously with zero indication of failure until you check your invoice."*
- **Action**: Open `http://localhost:3000`, select `demo_guard_off` from run picker. Highlight cumulative spend climbing.

### Beat 2: The Solution — Autonomously Halting with Guard Enabled (30s)
> **Speaker**: *"Now here is the exact same runaway task with Loopwatch's guard enabled. Loopwatch inspects every step, tracks information novelty and workspace state changes. Around step 5 to 9, Detector 4 detects zero novelty across recent steps and autonomously halts execution instantly. It displays the halt banner, reports cumulative spend so far ($0.0000 on local models), precise failure reasoning, and prompts for human intervention."*
- **Action**: Select `demo_guard_on` in run picker. Show Red `HALTED` banner and `no_progress` detector reason.

### Beat 3: Precision — Healthy Long Tasks Are Allowed to Finish (30s)
> **Speaker**: *"Crucially, Loopwatch isn't just a simple step counter or timeout limit. If an agent is executing a complex, 40-step refactoring task where every step edits files or reads new information, Loopwatch detects positive novelty on every step and allows the run to complete cleanly without false kills."*
- **Action**: Select `demo_long_productive`. Show step progression without triggering halt banner.

---

## Execution Verification & Timing Notes

- **Full Run-through Duration**: ~85 seconds
- **Observed Hardware Performance**:
  - `qwen2.5:7b` local inference latency: ~1.2s to 2.8s per step on local Ollama instance.
  - Model Warmup: First query takes ~3s to initialize KV cache; pre-warm model before taking the stage with a quick health request.
  - Dashboard Polling: FastAPI backend handles 1s polling with zero lag; UI updates synchronously.
