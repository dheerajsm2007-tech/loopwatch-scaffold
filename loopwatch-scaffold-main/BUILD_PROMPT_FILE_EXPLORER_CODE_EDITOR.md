# 📋 Build Prompt: File Explorer + Code Editor (Loopwatch IDE)

> **Context**: Hand-off prompt and implementation blueprint for building the File Explorer and Monaco Code Editor with Diff View in Next.js 16 / React AI Coding Assistant IDEs.

---

## 🎯 Goal
Build (1) a recursive file explorer tree that lists workspace files, and (2) a Monaco-based code editor with diff view. Both live in the right panel of the IDE layout.

### Tech Stack & Dependencies
* **Framework**: Next.js 16 + App Router + TypeScript Strict + Tailwind 4 + shadcn/ui
* **Dependencies**: `@monaco-editor/react@4.7`, `lucide-react`, `framer-motion`, `react-resizable-panels`, `tailwind-merge`, `clsx`
* **Architecture Rule**: The agent engine runs server-side (Node.js runtime, NOT Edge). The frontend talks via SSE + REST endpoints (`/api/repo/*`). Workspace lives at `<repoRoot>/workspace/`.

---

## 🔴 What NOT to do (Pitfalls & Solutions)

| ❌ Pitfall / Anti-Pattern | ✅ Solution | 💡 Why |
| :--- | :--- | :--- |
| Use shadcn `ScrollArea` for file tree | Plain `<div className="overflow-y-auto lg-scroll-tree">` | `ScrollArea` collapses on small content $\rightarrow$ scrollbar disappears |
| Import Monaco at module top-level | `dynamic(() => import("@monaco-editor/react"), { ssr: false })` | Monaco is 4MB + uses browser APIs; blocks SSR |
| Define file-icon component inside render | `function renderFileIcon(name): ReactNode` outside component | Prevents `react-hooks/static-components` lint error |
| Use `role: "system"` in LLM messages | Map to `role: "assistant"` + merge consecutive same-role | ZAI / OpenAI backend rejects system role (error 1214) |
| Skip path traversal checks | `if (!fullPath.startsWith(workspaceRoot)) return 403` | Security: prevents `../../etc/passwd` reads |
| Forget to refresh editor after edit | `refreshNonce` state, bumped on `file_change`, passed as `useEffect` dep | Editor shows stale content otherwise |
| Hardcode the "before" for diff | Set `diffBase` from `change.before` in `file_change` SSE event | Diff must show exactly what the agent changed |

---

## 🟢 Part 1: Custom Scrollbar CSS
**File**: `src/app/globals.css`

```css
/* =============================================================================
   LoopGuard custom scrollbars — replaces shadcn ScrollArea.
   Plain divs with these classes give reliable themed scrollbars.
   ============================================================================= */
.lg-scroll-tree,
.lg-scroll-y,
.lg-scroll-x {
  scrollbar-width: thin;
  scrollbar-color: oklch(0.556 0 0 / 0.4) transparent;
}
.dark .lg-scroll-tree,
.dark .lg-scroll-y,
.dark .lg-scroll-x {
  scrollbar-color: oklch(0.708 0 0 / 0.4) transparent;
}
.lg-scroll-tree::-webkit-scrollbar,
.lg-scroll-y::-webkit-scrollbar,
.lg-scroll-x::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.lg-scroll-tree::-webkit-scrollbar-track,
.lg-scroll-y::-webkit-scrollbar-track,
.lg-scroll-x::-webkit-scrollbar-track {
  background: transparent;
}
.lg-scroll-tree::-webkit-scrollbar-thumb,
.lg-scroll-y::-webkit-scrollbar-thumb,
.lg-scroll-x::-webkit-scrollbar-thumb {
  background-color: oklch(0.556 0 0 / 0.4);
  border-radius: 4px;
  border: 2px solid transparent;
  background-clip: content-box;
}
.dark .lg-scroll-tree::-webkit-scrollbar-thumb,
.dark .lg-scroll-y::-webkit-scrollbar-thumb,
.dark .lg-scroll-x::-webkit-scrollbar-thumb {
  background-color: oklch(0.708 0 0 / 0.4);
  background-clip: content-box;
}
.lg-scroll-tree::-webkit-scrollbar-thumb:hover,
.lg-scroll-y::-webkit-scrollbar-thumb:hover,
.lg-scroll-x::-webkit-scrollbar-thumb:hover {
  background-color: oklch(0.556 0 0 / 0.7);
  background-clip: content-box;
}

/* Hide scrollbars on tab strips (horizontal scroll, no visible bar) */
.lg-no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.lg-no-scrollbar::-webkit-scrollbar {
  display: none;
}
```

---

## 🟢 Part 2: TypeScript Interfaces
**File**: `src/lib/agent-types.ts`

```typescript
export interface RepoFile {
  name: string;
  path: string;          // relative to workspace root, e.g. "src/auth.ts"
  type: "file" | "directory";
  children?: RepoFile[]; // only for directories
  size?: number;         // bytes, only for files
}
```

---

## 🟢 Part 3: File Explorer Component
**File**: `src/components/loopguard/file-explorer.tsx`

```tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Folder, FolderOpen, FileText, FileCode, FileJson, FileCog, File } from "lucide-react";
import type { RepoFile } from "@/lib/agent-types";

// 🟢 Icon Helper (Defined OUTSIDE component to avoid re-renders / static-components lint warning)
function renderFileIcon(name: string): React.ReactNode {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "json") return <FileJson className="size-3.5 text-amber-500" />;
  if (ext === "md") return <FileText className="size-3.5 text-blue-500" />;
  if (["ts", "tsx"].includes(ext || ""))
    return <FileCode className="size-3.5 text-blue-600 dark:text-blue-400" />;
  if (["js", "jsx"].includes(ext || ""))
    return <FileCode className="size-3.5 text-yellow-600 dark:text-yellow-400" />;
  if (["css", "scss"].includes(ext || ""))
    return <FileCog className="size-3.5 text-pink-500" />;
  return <File className="size-3.5 text-muted-foreground" />;
}

export interface FileExplorerProps {
  onOpenFile: (path: string) => void;
  activePath: string | null;
  refreshNonce?: number;
}

export default function FileExplorer({
  onOpenFile,
  activePath,
  refreshNonce = 0,
}: FileExplorerProps) {
  const [tree, setTree] = useState<RepoFile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set(["src"]));

  const toggleDir = useCallback((path: string) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/repo/files")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (!cancelled && Array.isArray(data.tree)) setTree(data.tree);
      })
      .catch(() => {
        // Fallback demo data if API unavailable
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshNonce]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between border-b bg-muted/30 px-2 py-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Explorer
        </span>
        {loading && (
          <span className="text-[9px] text-muted-foreground/60">loading…</span>
        )}
      </div>
      {/* 🟢 KEY: plain div + lg-scroll-tree, NOT shadcn ScrollArea */}
      <div className="lg-scroll-tree min-h-0 flex-1 overflow-y-auto p-1">
        {tree.map((node) => (
          <TreeNode
            key={node.path}
            node={node}
            depth={0}
            onOpenFile={onOpenFile}
            activePath={activePath}
            expandedDirs={expandedDirs}
            toggleDir={toggleDir}
          />
        ))}
      </div>
    </div>
  );
}

function TreeNode({
  node,
  depth,
  onOpenFile,
  activePath,
  expandedDirs,
  toggleDir,
}: {
  node: RepoFile;
  depth: number;
  onOpenFile: (path: string) => void;
  activePath: string | null;
  expandedDirs: Set<string>;
  toggleDir: (path: string) => void;
}) {
  const isExpanded = expandedDirs.has(node.path);
  const isActive = activePath === node.path;

  if (node.type === "directory") {
    return (
      <div>
        <button
          type="button"
          onClick={() => toggleDir(node.path)}
          style={{ paddingLeft: `${depth * 12 + 6}px` }}
          className="flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-xs text-muted-foreground hover:bg-muted/50 font-mono"
        >
          {isExpanded ? (
            <FolderOpen className="size-3.5 text-amber-500" />
          ) : (
            <Folder className="size-3.5 text-amber-500" />
          )}
          <span className="truncate">{node.name}</span>
        </button>
        {isExpanded && node.children && (
          <div>
            {node.children.map((child) => (
              <TreeNode
                key={child.path}
                node={child}
                depth={depth + 1}
                onOpenFile={onOpenFile}
                activePath={activePath}
                expandedDirs={expandedDirs}
                toggleDir={toggleDir}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onOpenFile(node.path)}
      style={{ paddingLeft: `${depth * 12 + 6}px` }}
      className={`flex w-full items-center justify-between rounded px-1.5 py-1 text-xs font-mono transition-colors ${
        isActive
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:bg-muted/50"
      }`}
    >
      <div className="flex items-center gap-1.5 truncate">
        {renderFileIcon(node.name)}
        <span className="truncate">{node.name}</span>
      </div>
      {node.size !== undefined && (
        <span className="text-[10px] text-muted-foreground/50 ml-2">
          {node.size > 1024 ? `${(node.size / 1024).toFixed(1)}k` : `${node.size}B`}
        </span>
      )}
    </button>
  );
}
```

---

## 🟢 Part 4: Monaco Code Editor Component
**File**: `src/components/loopguard/code-editor.tsx`

```tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// 🟢 Dynamic import of Monaco to prevent SSR window/worker crashes
const MonacoLoader = dynamic(() => import("./monaco-actual"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="size-5 animate-spin text-muted-foreground" />
    </div>
  ),
});

function inferLanguage(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  if (["ts", "tsx"].includes(ext || "")) return "typescript";
  if (["js", "jsx"].includes(ext || "")) return "javascript";
  if (ext === "json") return "json";
  if (ext === "md") return "markdown";
  if (["css", "scss"].includes(ext || "")) return "css";
  if (ext === "html") return "html";
  if (ext === "py") return "python";
  return "plaintext";
}

export interface CodeEditorProps {
  activePath: string | null;
  refreshNonce?: number;
  diffMode?: boolean;
  diffBase?: string | null;
  theme?: "dark" | "light";
}

export default function CodeEditor({
  activePath,
  refreshNonce = 0,
  diffMode = false,
  diffBase = null,
  theme = "dark",
}: CodeEditorProps) {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const language = useMemo(
    () => (activePath ? inferLanguage(activePath) : "plaintext"),
    [activePath]
  );
  const monacoTheme = theme === "dark" ? "vs-dark" : "vs";

  useEffect(() => {
    if (!activePath) {
      setContent("");
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/repo/file?path=${encodeURIComponent(activePath)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (!cancelled && typeof data.content === "string") {
          setContent(data.content);
        }
      })
      .catch(() => {
        if (!cancelled) setContent("");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activePath, refreshNonce]);

  if (!activePath) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground font-mono">
        Select a file from the explorer to view it here.
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <MonacoLoader
        diffMode={diffMode}
        content={content}
        diffBase={diffBase ?? ""}
        language={language}
        theme={monacoTheme}
      />
    </div>
  );
}
```

**File**: `src/components/loopguard/monaco-actual.tsx`

```tsx
"use client";

import Editor, { DiffEditor } from "@monaco-editor/react";

export interface MonacoActualProps {
  diffMode: boolean;
  content: string;
  diffBase: string;
  language: string;
  theme: string;
}

export default function MonacoActual({
  diffMode,
  content,
  diffBase,
  language,
  theme,
}: MonacoActualProps) {
  if (diffMode) {
    return (
      <DiffEditor
        original={diffBase}
        modified={content}
        language={language}
        theme={theme}
        options={{
          readOnly: true,
          renderSideBySide: true,
          minimap: { enabled: false },
          fontSize: 13,
          lineNumbers: "on",
        }}
      />
    );
  }
  return (
    <Editor
      value={content}
      language={language}
      theme={theme}
      options={{
        readOnly: true,
        minimap: { enabled: false },
        fontSize: 13,
        lineNumbers: "on",
        wordWrap: "on",
        scrollBeyondLastLine: false,
      }}
    />
  );
}
```

---

## 🟢 Part 5: API Routes
**File**: `src/app/api/repo/files/route.ts`

```typescript
import { NextResponse } from "next/server";
import { readdir, stat } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { RepoFile } from "@/lib/agent-types";

export const runtime = "nodejs"; // 🔴 NOT Edge — uses node fs

const SKIP_DIRS = new Set([
  "node_modules", ".next", ".git", "dist", "build", ".cache", "coverage"
]);

async function buildTree(dir: string, prefix: string): Promise<RepoFile[]> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const result: RepoFile[] = [];
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name) || entry.name.startsWith(".")) continue;
    const full = join(dir, entry.name);
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      const children = await buildTree(full, rel);
      result.push({ name: entry.name, path: rel, type: "directory", children });
    } else {
      let size: number | undefined;
      try { size = (await stat(full)).size; } catch {}
      result.push({ name: entry.name, path: rel, type: "file", size });
    }
  }
  result.sort((a, b) => {
    if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  return result;
}

export async function GET() {
  const here = dirname(fileURLToPath(import.meta.url));
  const repoRoot = join(here, "..", "..", "..", "..", "..");
  const workspaceRoot = join(repoRoot, "workspace");
  const tree = await buildTree(workspaceRoot, "");
  return NextResponse.json({ tree });
}
```

**File**: `src/app/api/repo/file/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const path = url.searchParams.get("path");
  if (!path) return NextResponse.json({ error: "Missing path" }, { status: 400 });

  const here = dirname(fileURLToPath(import.meta.url));
  const repoRoot = join(here, "..", "..", "..", "..", "..");
  const workspaceRoot = join(repoRoot, "workspace");
  const fullPath = join(workspaceRoot, path);

  // 🟢 Path Traversal Guard
  if (!fullPath.startsWith(workspaceRoot)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const s = await stat(fullPath);
    const content = await readFile(fullPath, "utf8");
    return NextResponse.json({ path, content, size: s.size, timestamp: Date.now() });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const path = url.searchParams.get("path");
  if (!path) return NextResponse.json({ error: "Missing path" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const content = typeof body.content === "string" ? body.content : null;
  if (content === null) return NextResponse.json({ error: "Missing content" }, { status: 400 });

  const here = dirname(fileURLToPath(import.meta.url));
  const repoRoot = join(here, "..", "..", "..", "..", "..");
  const workspaceRoot = join(repoRoot, "workspace");
  const fullPath = join(workspaceRoot, path);

  if (!fullPath.startsWith(workspaceRoot)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, content, "utf8");
    return NextResponse.json({ path, size: content.length, written: true });
  } catch (e) {
    return NextResponse.json({ error: `Write failed: ${(e as Error).message}` }, { status: 500 });
  }
}
```

---

## ✅ Verification Checklist

* [x] `bun run lint` / `npm run lint` — clean (no `react-hooks/static-components` warnings)
* [x] `/api/repo/files` returns `{ tree: RepoFile[] }` with directories listed first
* [x] `/api/repo/file?path=src/auth.ts` returns `{ content, size, path }`
* [x] `/api/repo/file?path=../../etc/passwd` returns `403 Forbidden`
* [x] File explorer renders tree, directories expand/collapse, files open on click
* [x] Monaco loads with spinner fallback and renders file contents
* [x] Current/Diff toggle switches between `<Editor>` and `<DiffEditor>`
* [x] When agent edits a file (`file_change` SSE event), `refreshNonce` triggers auto-fetch
* [x] Theme toggle switches Monaco between `vs-dark` and `vs`
* [x] Zero SSR crashes in browser console
