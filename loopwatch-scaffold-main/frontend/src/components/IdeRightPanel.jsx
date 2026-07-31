import React, { useState, useEffect, useRef } from 'react';
import Editor, { DiffEditor } from '@monaco-editor/react';
import { FileEdit, X, Save, Edit3, Lock, Check, Copy, RefreshCw, FileCode, Eye, Code2, AlertTriangle, ShieldAlert, History, Clock } from 'lucide-react';
import FileExplorerTree from './FileExplorerTree';
import { fetchWorkspaceFile, saveWorkspaceFile } from '../api';

function inferLanguage(path) {
  if (!path) return 'plaintext';
  const ext = path.split('.').pop().toLowerCase();
  if (['py'].includes(ext)) return 'python';
  if (['js', 'jsx'].includes(ext)) return 'javascript';
  if (['ts', 'tsx'].includes(ext)) return 'typescript';
  if (['json'].includes(ext)) return 'json';
  if (['md'].includes(ext)) return 'markdown';
  if (['css', 'scss'].includes(ext)) return 'css';
  if (['html'].includes(ext)) return 'html';
  if (['sh', 'bash'].includes(ext)) return 'shell';
  return 'plaintext';
}

export default function IdeRightPanel({
  selectedRunId,
  activePath,
  onOpenFile,
  openTabs,
  closeTab,
  refreshNonce = 0,
  diffBase = null,
  allSteps = [],
  verdict = {},
  apiRuns = [],
  setSelectedRunId,
  onViewDiff,
}) {
  const [sidebarTab, setSidebarTab] = useState('explorer');
  const [diffMode, setDiffMode] = useState(false);
  const [fileContent, setFileContent] = useState('');
  const [savedContent, setSavedContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveToast, setSaveToast] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [copied, setCopied] = useState(false);

  const editorRef = useRef(null);
  const isDirty = fileContent !== savedContent;

  useEffect(() => {
    if (!activePath) {
      setFileContent('');
      setSavedContent('');
      return;
    }

    async function loadFile() {
      const data = await fetchWorkspaceFile(selectedRunId || 'default', activePath);
      const content = data?.content || '';
      setFileContent(content);
      setSavedContent(content);
    }

    loadFile();
  }, [selectedRunId, activePath, refreshNonce]);

  const handleSave = async () => {
    if (!activePath || isSaving) return;
    setIsSaving(true);
    const res = await saveWorkspaceFile(selectedRunId || 'default', activePath, fileContent);
    setIsSaving(false);
    if (res.success) {
      setSavedContent(fileContent);
      setSaveToast('Saved to disk!');
      setTimeout(() => setSaveToast(null), 2500);
    } else {
      setSaveToast(`Save failed: ${res.error}`);
      setTimeout(() => setSaveToast(null), 4000);
    }
  };

  const handleCopy = () => {
    if (!fileContent) return;
    navigator.clipboard.writeText(fileContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEditorMount = (editor) => {
    editorRef.current = editor;
  };

  // Derive unique written files for Changes Tab
  const changedFilesMap = {};
  allSteps.forEach((step) => {
    if (step.tool === 'write_file' && step.arguments) {
      const filePath = step.arguments.path || step.arguments.file;
      if (filePath) {
        changedFilesMap[filePath] = (changedFilesMap[filePath] || 0) + 1;
      }
    }
  });
  const changedFiles = Object.keys(changedFilesMap);

  const language = inferLanguage(activePath);

  return (
    <div className="flex flex-col h-full bg-[#0d1117] border-l border-[#21262d] font-mono select-none overflow-hidden">
      
      {/* Right Panel Sub-Header */}
      <div className="flex items-center justify-between border-b border-[#21262d] bg-[#161b22] px-3 py-1.5 text-xs text-[#8b949e]">
        {/* Left Sub-Sidebar Tabs */}
        <div className="flex items-center gap-3">
          {['explorer', 'changes', 'alerts', 'history'].map((tab) => (
            <button
              key={tab}
              onClick={() => setSidebarTab(tab)}
              className={`capitalize text-xs transition-colors cursor-pointer ${
                sidebarTab === tab ? 'text-white font-bold border-b-2 border-[#1f6feb] pb-0.5' : 'hover:text-[#c9d1d9]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main Split Body: Sub-Sidebar (FileExplorer/Changes/Alerts/History) + Monaco Editor */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        
        {/* Sub-Sidebar (Dynamic Tab Views) */}
          <div className="w-64 shrink-0 border-r border-[#21262d] bg-[#0d1117] flex flex-col overflow-hidden">
            
            {/* 1. EXPLORER TAB */}
            {sidebarTab === 'explorer' && (
              <FileExplorerTree
                selectedRunId={selectedRunId}
                activePath={activePath}
                onOpenFile={onOpenFile}
                refreshNonce={refreshNonce}
              />
            )}

            {/* 2. CHANGES TAB */}
            {sidebarTab === 'changes' && (
              <div className="flex flex-col h-full bg-[#0d1117] text-xs">
                <div className="px-3 py-1.5 bg-[#161b22] border-b border-[#21262d] text-[#8b949e] font-bold text-[10px] uppercase">
                  FILE CHANGES ({changedFiles.length})
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1 lg-scroll-tree">
                  {changedFiles.length === 0 ? (
                    <div className="p-4 text-center text-[#8b949e] text-xs">No file edits in current run</div>
                  ) : (
                    changedFiles.map((path) => (
                      <div
                        key={path}
                        onClick={() => {
                          onOpenFile(path);
                          setDiffMode(true);
                        }}
                        className="p-2 rounded bg-[#161b22] border border-[#21262d] hover:border-[#1f6feb]/50 flex items-center justify-between cursor-pointer group"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Edit3 className="w-3.5 h-3.5 text-[#3fb950] shrink-0" />
                          <span className="truncate text-white font-mono">{path}</span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#238636]/20 text-[#3fb950] border border-[#238636]/40">
                          {changedFilesMap[path]} edit{changedFilesMap[path] > 1 ? 's' : ''}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 3. ALERTS TAB */}
            {sidebarTab === 'alerts' && (
              <div className="flex flex-col h-full bg-[#0d1117] text-xs">
                <div className="px-3 py-1.5 bg-[#161b22] border-b border-[#21262d] text-[#8b949e] font-bold text-[10px] uppercase">
                  GUARD ALERTS & VERDICTS
                </div>
                <div className="p-3">
                  {verdict?.should_halt ? (
                    <div className="p-3 rounded-lg bg-[#da3633]/15 border border-[#da3633]/50 text-[#f85149] space-y-2">
                      <div className="flex items-center gap-2 font-bold text-white">
                        <ShieldAlert className="w-4 h-4 text-[#f85149]" />
                        <span>GUARD HALT TRIPPED</span>
                      </div>
                      <div className="text-[11px] text-[#c9d1d9] space-y-1">
                        <div><strong className="text-[#8b949e]">Detector:</strong> {verdict.detector || 'In-process Guard'}</div>
                        <div><strong className="text-[#8b949e]">Halted Step:</strong> #{verdict.halted_at_step}</div>
                        <div><strong className="text-[#8b949e]">Trigger Reason:</strong> {verdict.reason}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 text-center text-[#3fb950] bg-[#238636]/10 border border-[#238636]/30 rounded-lg space-y-1">
                      <Check className="w-5 h-5 mx-auto text-[#3fb950]" />
                      <div className="font-bold text-xs">No Active Guard Halts</div>
                      <div className="text-[10px] text-[#8b949e]">Agent execution is passing cleanly.</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 4. HISTORY TAB */}
            {sidebarTab === 'history' && (
              <div className="flex flex-col h-full bg-[#0d1117] text-xs">
                <div className="px-3 py-1.5 bg-[#161b22] border-b border-[#21262d] text-[#8b949e] font-bold text-[10px] uppercase">
                  RUN HISTORY ({apiRuns.length})
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1 lg-scroll-tree">
                  {apiRuns.map((r) => (
                    <button
                      key={r}
                      onClick={() => setSelectedRunId && setSelectedRunId(r)}
                      className={`w-full p-2 rounded text-left border flex items-center justify-between cursor-pointer transition-colors ${
                        selectedRunId === r
                          ? 'bg-[#1f6feb]/20 text-[#58a6ff] border-[#1f6feb]/50 font-bold'
                          : 'bg-[#161b22] text-[#8b949e] border-[#21262d] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <History className="w-3.5 h-3.5 shrink-0 text-[#58a6ff]" />
                        <span className="truncate">{r}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Monaco Editor & Tab Strip */}
          <div className="flex-1 flex flex-col bg-[#090b10] min-w-0 overflow-hidden relative">
            
            {/* Editor Open Tabs Strip + Current/Diff Toggle */}
            <div className="flex items-center justify-between border-b border-[#21262d] bg-[#161b22] h-9 shrink-0 px-2">
              
              {/* Tab Strip */}
              <div className="flex items-center gap-1 overflow-x-auto lg-no-scrollbar flex-1 min-w-0 pr-2">
                {openTabs.length === 0 && (
                  <span className="text-xs text-[#8b949e] px-2">No open files</span>
                )}
                {openTabs.map((path) => {
                  const filename = path.split('/').pop();
                  const isActive = path === activePath;
                  return (
                    <div
                      key={path}
                      onClick={() => onOpenFile(path)}
                      className={`group flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border transition-all cursor-pointer shrink-0 ${
                        isActive
                          ? 'bg-[#0d1117] text-white border-[#30363d] font-semibold'
                          : 'bg-transparent text-[#8b949e] border-transparent hover:bg-[#21262d]/50'
                      }`}
                    >
                      <FileEdit className="w-3 h-3 text-[#58a6ff]" />
                      <span className="max-w-[140px] truncate">{filename}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          closeTab(path);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-white rounded"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Action Controls & Current / Diff View Toggle */}
              <div className="flex items-center gap-2 shrink-0 border-l border-[#21262d] pl-2">
                {activePath && (
                  <>
                    {/* Save Button */}
                    <button
                      onClick={handleSave}
                      disabled={!isDirty || isSaving}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-bold transition-all ${
                        isDirty
                          ? 'bg-[#238636] text-white hover:bg-[#2ea043] cursor-pointer'
                          : 'bg-[#21262d] text-[#8b949e] opacity-50 cursor-not-allowed'
                      }`}
                      title="Save (Ctrl+S)"
                    >
                      {isSaving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                      <span>Save</span>
                    </button>

                    {/* Copy */}
                    <button
                      onClick={handleCopy}
                      className="text-[#8b949e] hover:text-[#58a6ff] p-1 rounded transition-colors"
                      title="Copy Code"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-[#3fb950]" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </>
                )}

                {/* Current / Diff Toggle */}
                <div className="flex items-center bg-[#0d1117] p-0.5 rounded border border-[#21262d] text-[11px]">
                  <button
                    onClick={() => setDiffMode(false)}
                    className={`px-2 py-0.5 rounded cursor-pointer ${
                      !diffMode ? 'bg-[#21262d] text-white font-bold' : 'text-[#8b949e]'
                    }`}
                  >
                    Current
                  </button>
                  <button
                    onClick={() => setDiffMode(true)}
                    className={`px-2 py-0.5 rounded cursor-pointer ${
                      diffMode ? 'bg-[#21262d] text-white font-bold' : 'text-[#8b949e]'
                    }`}
                  >
                    Diff
                  </button>
                </div>
              </div>

            </div>

            {/* Save Toast Notification */}
            {saveToast && (
              <div
                className={`absolute top-12 right-4 z-20 px-3 py-1.5 rounded text-xs shadow-xl border flex items-center gap-2 animate-fadeIn ${
                  saveToast.type === 'success'
                    ? 'bg-[#238636]/20 text-[#3fb950] border-[#238636]/50'
                    : 'bg-[#da3633]/20 text-[#f85149] border-[#da3633]/50'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>{saveToast.text}</span>
              </div>
            )}

            {/* Editor Body */}
            <div className="flex-1 min-h-0">
              {!activePath ? (
                <div className="flex flex-col items-center justify-center h-full text-[#8b949e] space-y-2 p-6 text-center">
                  <FileCode className="w-10 h-10 text-[#30363d]" />
                  <p className="text-xs">No file open. Pick a file from the explorer to view or edit its code.</p>
                </div>
              ) : diffMode ? (
                <DiffEditor
                  height="100%"
                  original={diffBase || savedContent}
                  modified={fileContent}
                  language={language}
                  theme="vs-dark"
                  options={{
                    readOnly: true,
                    renderSideBySide: true,
                    minimap: { enabled: false },
                    fontSize: 13,
                    lineNumbers: 'on',
                    automaticLayout: true,
                  }}
                />
              ) : (
                <Editor
                  height="100%"
                  path={activePath}
                  language={language}
                  value={fileContent}
                  onChange={(val) => setFileContent(val || '')}
                  onMount={handleEditorMount}
                  theme="vs-dark"
                  options={{
                    readOnly: isReadOnly,
                    minimap: { enabled: false },
                    fontSize: 13,
                    lineNumbers: 'on',
                    wordWrap: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                  }}
                />
              )}
            </div>

          </div>

        </div>
    </div>
  );
}
