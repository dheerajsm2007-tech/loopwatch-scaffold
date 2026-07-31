import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Folder, FolderOpen, FileText, FileCode, FileJson, FileCog, File } from 'lucide-react';
import { fetchWorkspaceFiles, fetchWorkspaceFile } from '../api';

function renderFileIcon(name) {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'json') return <FileJson className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
  if (ext === 'md') return <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
  if (['ts', 'tsx'].includes(ext || '')) return <FileCode className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
  if (['js', 'jsx', 'py'].includes(ext || '')) return <FileCode className="w-3.5 h-3.5 text-yellow-400 shrink-0" />;
  if (['css', 'scss'].includes(ext || '')) return <FileCog className="w-3.5 h-3.5 text-pink-400 shrink-0" />;
  return <File className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
}

function formatSize(bytes) {
  if (bytes === undefined || bytes === null) return '';
  if (bytes < 1024) return `${bytes}B`;
  return `${(bytes / 1024).toFixed(1)}K`;
}

// Convert file objects or flat file list into tree structure
function buildTreeFromPaths(fileList) {
  const root = [];
  const map = {};

  fileList.forEach((item) => {
    const path = typeof item === 'string' ? item : item.path;
    const size = typeof item === 'object' ? item.size : undefined;

    const parts = path.split('/');
    let currentLevel = root;
    let currentPath = '';

    parts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isFile = index === parts.length - 1;

      if (!map[currentPath]) {
        const node = {
          name: part,
          path: currentPath,
          type: isFile ? 'file' : 'directory',
          size: isFile ? size : undefined,
          children: isFile ? undefined : [],
        };
        map[currentPath] = node;
        currentLevel.push(node);
      } else if (isFile && size !== undefined) {
        map[currentPath].size = size;
      }

      if (!isFile) {
        currentLevel = map[currentPath].children;
      }
    });
  });

  // Sort directories first, then files alphabetically
  const sortTree = (nodes) => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach((n) => {
      if (n.children) sortTree(n.children);
    });
  };

  sortTree(root);
  return root;
}

export default function FileExplorerTree({ selectedRunId, onOpenFile, activePath, refreshNonce = 0 }) {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedDirs, setExpandedDirs] = useState(new Set(['src', 'services', 'payments']));

  useEffect(() => {
    if (!selectedRunId) return;

    async function loadFiles() {
      setLoading(true);
      const list = await fetchWorkspaceFiles(selectedRunId);
      const builtTree = buildTreeFromPaths(list);
      setTree(builtTree);
      setLoading(false);
    }

    loadFiles();
  }, [selectedRunId, refreshNonce]);

  const toggleDirectory = (dirPath) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev);
      if (next.has(dirPath)) {
        next.delete(dirPath); // Collapse directory
      } else {
        next.add(dirPath); // Expand directory
      }
      return next;
    });
  };

  const collapseAll = () => {
    setExpandedDirs(new Set());
  };

  const expandAll = () => {
    const allDirs = new Set();
    const collectDirs = (nodes) => {
      nodes.forEach((n) => {
        if (n.type === 'directory') {
          allDirs.add(n.path);
          if (n.children) collectDirs(n.children);
        }
      });
    };
    collectDirs(tree);
    setExpandedDirs(allDirs);
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-xs font-mono select-none">
      
      {/* Explorer Header Controls */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#21262d] bg-[#161b22] text-[#8b949e]">
        <span className="text-[10px] font-bold uppercase tracking-wider">EXPLORER</span>
        <div className="flex items-center gap-1 text-[10px]">
          <button
            onClick={collapseAll}
            className="px-1.5 py-0.5 rounded hover:bg-[#21262d] hover:text-white transition-colors"
            title="Collapse All Folders"
          >
            Collapse All
          </button>
          <span>|</span>
          <button
            onClick={expandAll}
            className="px-1.5 py-0.5 rounded hover:bg-[#21262d] hover:text-white transition-colors"
            title="Expand All Folders"
          >
            Expand All
          </button>
        </div>
      </div>

      {/* Directory & File Tree View */}
      <div className="flex-1 overflow-y-auto p-1 space-y-0.5 lg-scroll-tree">
        {loading ? (
          <div className="p-3 text-center text-[#8b949e] text-xs">Loading tree...</div>
        ) : tree.length === 0 ? (
          <div className="p-3 text-center text-[#8b949e] text-xs">No workspace files</div>
        ) : (
          tree.map((node) => (
            <TreeNode
              key={node.path}
              node={node}
              depth={0}
              onOpenFile={onOpenFile}
              activePath={activePath}
              expandedDirs={expandedDirs}
              toggleDirectory={toggleDirectory}
            />
          ))
        )}
      </div>

    </div>
  );
}

function TreeNode({ node, depth, onOpenFile, activePath, expandedDirs, toggleDirectory }) {
  const isExpanded = expandedDirs.has(node.path);
  const isActive = activePath === node.path;

  if (node.type === 'directory') {
    return (
      <div>
        <button
          onClick={() => toggleDirectory(node.path)}
          style={{ paddingLeft: `${depth * 12 + 6}px` }}
          className="flex items-center gap-1.5 w-full py-1 px-1 rounded hover:bg-[#21262d]/70 text-[#c9d1d9] transition-colors text-left group"
        >
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-[#8b949e] shrink-0" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-[#8b949e] shrink-0" />
          )}
          {isExpanded ? (
            <FolderOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          ) : (
            <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          )}
          <span className="truncate font-semibold">{node.name}</span>
        </button>

        {/* Recursive Children Render (Collapsible) */}
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
                toggleDirectory={toggleDirectory}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => onOpenFile(node.path)}
      style={{ paddingLeft: `${depth * 12 + 20}px` }}
      className={`flex items-center justify-between w-full py-1 px-1.5 rounded transition-colors text-left ${
        isActive
          ? 'bg-[#1f6feb]/20 text-[#58a6ff] font-semibold border border-[#1f6feb]/40'
          : 'text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d]/50'
      }`}
    >
      <div className="flex items-center gap-1.5 truncate min-w-0 flex-1">
        {renderFileIcon(node.name)}
        <span className="truncate">{node.name}</span>
      </div>
      {node.size !== undefined && (
        <span className="text-[10px] text-[#8b949e]/60 font-mono shrink-0 ml-2">
          {formatSize(node.size)}
        </span>
      )}
    </button>
  );
}
