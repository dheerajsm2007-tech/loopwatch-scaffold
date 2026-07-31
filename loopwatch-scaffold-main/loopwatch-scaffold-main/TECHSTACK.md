# 🛠️ LoopGuard IDE — Technical Stack & Architecture

## Overview
LoopGuard IDE (LoopWatch) is an agentic AI coding environment and real-time loop detection dashboard built with a modern React frontend and a FastAPI backend powering a 4-layer detector cascade.

---

## 🎨 Frontend Stack

| Technology | Role & Description |
|---|---|
| **React 18** | UI component architecture and state management |
| **Vite 5.4** | High-performance build tool and hot module replacement |
| **Monaco Editor (`@monaco-editor/react`)** | Full VS-Code style code editor, syntax highlighter, and side-by-side diff viewer |
| **TailwindCSS** | Pure dark-mode styling system (`#000000` pitch black theme, sleek glassmorphism) |
| **Lucide React** | Modern vector icon library |
| **Custom SVG Engine** | Responsive Information Gain & Novelty Curve visualization |

---

## ⚡ Backend Stack

| Technology | Role & Description |
|---|---|
| **Python 3.10+** | Core runtime for harness, guard detectors, and server |
| **FastAPI** | High-performance asynchronous REST API framework |
| **Uvicorn** | Lightning-fast ASGI server for handling backend routes and workspace disk IO |
| **Pydantic** | Schema validation for API payloads and workspace saving |

---

## 🤖 AI Agent & LLM Engine

| Component | Description |
|---|---|
| **Ollama** | Local LLM server operating OpenAI-compatible `/v1` endpoints |
| **`qwen2.5:7b`** | Primary local LLM model powering real-time tool calling |
| **Agent Harness** | Hand-rolled lightweight tool loop (`search`, `read_file`, `write_file`, `think`, `done`) |
| **Workspace Grounding** | Pre-execution system prompt injection with dynamic relative file-tree snapshots |

---

## 🛡️ Guard & Detector Cascade Architecture

```
                       ┌──────────────────────────────┐
                       │    Agent Action Request      │
                       └──────────────┬───────────────┘
                                      │
                                      ▼
                   ┌──────────────────────────────────────┐
                   │  Detector 1: Step & Spend Cap Guard   │
                   └──────────────────┬───────────────────┘
                                      │
                                      ▼
                   ┌──────────────────────────────────────┐
                   │  Detector 2: Exact Repeat Guard      │
                   └──────────────────┬───────────────────┘
                                      │
                                      ▼
                   ┌──────────────────────────────────────┐
                   │  Detector 3: Near Repeat (Jaccard)   │
                   └──────────────────┬───────────────────┘
                                      │
                                      ▼
                   ┌──────────────────────────────────────┐
                   │  Detector 4: No Progress (Hash) Guard │
                   └──────────────────┬───────────────────┘
                                      │
                         ┌────────────┴────────────┐
                         ▼                         ▼
                  [PASS: Execute]           [HALT: Circuit Break]
```

1. **Detector 1 (Step & Spend Cap)**: Halts if step count > 40 or total spend > $2.00.
2. **Detector 2 (Exact Repeat)**: Halts if identical tool call arguments occur 3 consecutive times.
3. **Detector 3 (Near Repeat)**: Halts if Jaccard similarity between tool call parameters exceeds threshold.
4. **Detector 4 (No Progress)**: Halts if 5 consecutive steps produce identical observation/workspace hashes.

---

## 🧪 Evaluation Benchmark Pipeline

* **Corpus Dataset**: 30 hand-crafted evaluation tasks (`eval/corpus/*.json`)
  * 15 Productive Tasks (Real refactoring and unit tests)
  * 15 Pathological Tasks (Impossible constraints, phantom bugs, unroutable networks)
* **Runner & Analyzer**: `eval/run_corpus.py` and `eval/analyze.py` for catch-rate & false-positive metrics.
