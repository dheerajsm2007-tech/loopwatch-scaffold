# ✨ LoopGuard IDE — Comprehensive Feature List

LoopGuard IDE combines advanced agent telemetry with a full-featured VS-Code style web development environment. Below is a detailed breakdown of all capabilities:

---

## 💻 1. Monaco Code Editor & Live Disk Persistence
* **VS-Code Engine**: Embedded Monaco Editor (`@monaco-editor/react`) supporting syntax highlighting for Python, JavaScript, TypeScript, JSON, Markdown, CSS, HTML, and Shell scripts.
* **Live Editing & Disk Persistence**: Full keyboard editing support with **`Ctrl+S` / `⌘+S`** disk saving directly to the active workspace.
* **Side-by-Side Diff Mode**: Compare current workspace file contents against original seed baselines in real time.
* **Tabbed Navigation**: Multi-tab editor bar with file close buttons (`X`) and active tab indicators.
* **Read-Only / Edit Toggle**: Protect files from accidental edits with a single click.

---

## 📁 2. Collapsible File Explorer Tree
* **Full Codebase Visibility**: Always-visible workspace file tree that loads immediately upon entering the IDE.
* **Byte-Size Badges**: Displays exact file sizes on each file row (e.g. `834B`, `2.9K`).
* **Interactive Tree Control**: Expand and collapse individual folders or use **`Collapse All`** / **`Expand All`** header actions.
* **Dynamic File Selection**: Clicking any file in the explorer tree opens it immediately in the Monaco Editor.

---

## 🛡️ 3. 4-Layer Detector Cascade Circuit Breaker
* **Detector 1 — Step & Spend Cap**: Prevents excessive costs by halting runs exceeding 40 steps or $2.00 total spend.
* **Detector 2 — Exact Repeat**: Halts execution when the model issues identical tool calls consecutively.
* **Detector 3 — Near Repeat (Jaccard Similarity)**: Halts execution when parameter parameters show high textual similarity without structural progress.
* **Detector 4 — No Progress**: Uses observation hashing and workspace SHA-256 fingerprinting to detect 5 flat, unproductive steps.
* **Interactive Halt Banner**: Displays detector name, halt reason, halted step index, and options to **Resume** or **Kill** execution.

---

## 📈 4. Information Gain & Novelty Curve
* **Dynamic SVG Visualization**: Renders real-time novelty scores per step against the 5-step flat halt threshold line.
* **Task Prompt Header**: Displays the active task prompt directly above the curve chart for complete context visibility.
* **Interactive Step Scrubbing**: Hover or click data points on the curve to inspect step details and jump the playback index.

---

## 🚀 5. Interactive Task Launcher
* **No Pre-Loaded Mock Runs**: Clean initial entry view that opens directly into an interactive task selection interface.
* **🔴 5 Pathological Evaluation Tasks**: Curated cards representing spinning, impossible, or phantom bug tasks where the guard will halt.
* **🟢 5 Productive Evaluation Tasks**: Curated cards representing real refactoring and feature tasks where the guard will pass.
* **Real-Time Custom Task Execution**: Prominent prompt input bar supporting custom task prompts (`"create payments/currency.py with conversion methods"`) executed live via Ollama `qwen2.5:7b`.

---

## ⏱️ 6. Playback & Telemetry Controls
* **Transport Control Bar**: Manual **`▶ Start Demo`** / **`Pause`** / **`Reset`** controls with speed multipliers (**1x**, **2x**, **5x**).
* **Live Telemetry Footer**: Real-time USD spend counter, step counter, token context gauge (`ctx: N / 24,000`), and model indicator (`llm: qwen2.5:7b`).
* **Navbar Preset Dropdown**: Top bar dropdown listing all 30 evaluation corpus tasks for instant switching.
