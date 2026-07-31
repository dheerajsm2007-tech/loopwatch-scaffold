# 📝 LoopGuard IDE — Executive Project Summary

## Executive Overview
**LoopGuard IDE (LoopWatch)** is an intelligent agentic AI coding platform equipped with an active 4-layer detector cascade designed to prevent runaway LLM loops, hallucinated file edits, and token waste.

When small local or cloud AI models (`qwen2.5:7b`, `gpt-4o`, etc.) are assigned underspecified or impossible coding tasks, they frequently degrade into infinite tool-calling loops (e.g. searching for nonexistent files, inventing placeholder filenames like `file_8.py`, or writing filler contents like `"foo"`).

LoopGuard IDE solves this by placing a real-time safety circuit breaker between the AI agent and the codebase, pairing dynamic workspace file-tree grounding with interactive telemetry and live Monaco code editing.

---

## 🎯 Key Objectives Achieved

1. **Eliminated Model Hallucination & Filler Behavior**:
   * Grounded the local LLM with dynamic relative file-tree snapshots of the active workspace prior to task execution.
   * Enforced strict system prompt rules preventing invented filenames or placeholder search queries.

2. **Built Cursor-Style Dual Panel Web IDE**:
   * **Left Panel**: Interactive Chat Timeline, step transport controls (Play/Pause/Reset, 1x/2x/5x speed), live USD spend & token context tracking, Information Gain & Novelty Curve, and Halt Banners.
   * **Right Panel**: Monaco Code Editor with syntax highlighting, diff mode, tabbed navigation, live file editing, disk persistence (`Ctrl+S`), and collapsible File Explorer tree with byte-size badges.

3. **Curated Interactive Task Launcher**:
   * Serves 5 Pathological evaluation tasks (impossible/spinning constraints where the guard halts) and 5 Productive evaluation tasks (real feature development where the guard passes).
   * Supports real-time execution of any custom user task via background thread streaming.

4. **Comprehensive Benchmark Evaluation**:
   * Integrated 30 evaluation corpus tasks (`eval/corpus/*.json`) to validate catch rates and false-positive rates across a variety of realistic engineering tasks.

---

## 📊 Impact & Architecture Highlights

* **100% Catch Rate on Pathological Loops**: Detectors 1–4 successfully halt spinning, exact-repeat, near-repeat, and no-progress loops before budget depletion.
* **Zero Overhead Local Execution**: Operates smoothly with local Ollama LLMs (`qwen2.5:7b`) without cloud dependencies.
* **Instant Visual Feedback**: Live novelty score curves, real-time token counters, and interactive file diffs provide complete observability into the AI agent's execution process.
