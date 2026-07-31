import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { X, Folder, FileText, Code2, Copy, Check, Search, Save, Edit3, Lock, RefreshCw, HardDrive, FileCode } from 'lucide-react';
import { fetchWorkspaceFiles, fetchWorkspaceFile, saveWorkspaceFile } from '../api';

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

export default function WorkspaceViewer({ isOpen, onClose, selectedRunId }) {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [savedContent, setSavedContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [saveToast, setSaveToast] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);

  const editorRef = useRef(null);

  const isDirty = fileContent !== savedContent;

  useEffect(() => {
    if (!isOpen || !selectedRunId) return;

    async function loadFileList() {
      setIsLoading(true);
      const list = await fetchWorkspaceFiles(selectedRunId);
      setFiles(list);
      setIsLoading(false);

      if (list.length > 0 && (!selectedFile || !list.includes(selectedFile))) {
        setSelectedFile(list[0]);
      }
    }

    loadFileList();
  }, [isOpen, selectedRunId]);

  useEffect(() => {
    if (!isOpen || !selectedRunId || !selectedFile) return;

    async function loadFile() {
      setIsLoading(true);
      const data = await fetchWorkspaceFile(selectedRunId, selectedFile);
      const content = data?.content || '';
      setFileContent(content);
      setSavedContent(content);
      setIsLoading(false);
    }

    loadFile();
  }, [isOpen, selectedRunId, selectedFile]);

  const handleSave = async () => {
    if (!selectedFile || !selectedRunId || isSaving) return;
    setIsSaving(true);
    const result = await saveWorkspaceFile(selectedRunId, selectedFile, fileContent);
    setIsSaving(false);

    if (result && result.success) {
      setSavedContent(fileContent);
      setSaveToast({ type: 'success', text: `Saved "${selectedFile}" to disk!` });
      setTimeout(() => setSaveToast(null), 3000);
    } else {
      setSaveToast({ type: 'error', text: result?.error || 'Failed to save file' });
      setTimeout(() => setSaveToast(null), 4000);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(fileContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Bind Ctrl+S / Cmd+S shortcut inside Monaco
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave();
    });
  };

  if (!isOpen) return null;

  const filteredFiles = files.filter((f) => f.toLowerCase().includes(searchQuery.toLowerCase()));
  const language = inferLanguage(selectedFile);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md font-mono animate-fadeIn">
      
      <div className="w-full max-w-7xl h-[88vh] bg-[#090b0e] border-2 border-[#21293a] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Modal Window Header */}
        <div className="bg-[#141a26] px-6 py-3.5 border-b border-[#21293a] flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#00f0ff]/10 border border-[#00f0ff]/30 flex items-center justify-center text-[#00f0ff]">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">MONACO CODE EDITOR & EXPLORER</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/30 uppercase font-mono">
                  {selectedRunId}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30 uppercase font-mono">
                  LIVE EDITING ACTIVE
                </span>
              </div>
              <p className="text-xs text-[#8b9bb4]">
                Interactive Monaco IDE code editor with real-time disk persistence
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#21293a]/50 text-[#8b9bb4] hover:text-white hover:bg-[#21293a] flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Sidebar + Editor */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* File Tree Sidebar */}
          <div className="w-72 bg-[#0e121a] border-r border-[#21293a] flex flex-col">
            
            {/* Search Filter */}
            <div className="p-3 border-b border-[#21293a]">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#8b9bb4] absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter codebase files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#090b0e] text-white text-xs pl-8 pr-3 py-1.5 rounded-lg border border-[#21293a] focus:outline-none focus:border-[#00f0ff]"
                />
              </div>
            </div>

            {/* File List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {isLoading && files.length === 0 ? (
                <div className="p-4 text-xs text-[#8b9bb4] text-center">Loading files...</div>
              ) : filteredFiles.length === 0 ? (
                <div className="p-4 text-xs text-[#8b9bb4] text-center">No files found</div>
              ) : (
                filteredFiles.map((file) => (
                  <button
                    key={file}
                    onClick={() => {
                      if (isDirty) {
                        if (!window.confirm(`Discard unsaved changes in ${selectedFile}?`)) return;
                      }
                      setSelectedFile(file);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono text-left transition-all cursor-pointer ${
                      selectedFile === file
                        ? 'bg-[#00f0ff]/20 text-[#00f0ff] font-semibold border border-[#00f0ff]/40'
                        : 'text-[#8b9bb4] hover:text-white hover:bg-[#141a26]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileCode className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{file}</span>
                    </div>
                    {selectedFile === file && isDirty && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" title="Unsaved changes" />
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Total File Counter Footer */}
            <div className="p-3 bg-[#090b0e] border-t border-[#21293a] text-[11px] text-[#8b9bb4] flex justify-between">
              <span>{files.length} Codebase files</span>
              <span>{selectedRunId}</span>
            </div>

          </div>

          {/* Main Monaco Editor Panel */}
          <div className="flex-1 bg-[#090b0e] flex flex-col overflow-hidden relative">
            
            {/* Active File Control Bar */}
            <div className="bg-[#141a26] px-5 py-2 border-b border-[#21293a] flex items-center justify-between text-xs">
              <div className="flex items-center gap-3 text-[#00f0ff]">
                <FileCode className="w-4 h-4" />
                <span className="font-semibold text-white">{selectedFile || 'Select a file'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#21293a] text-[#8b9bb4] uppercase">
                  {language}
                </span>
                <span className="text-[10px] text-[#8b9bb4]">({fileContent.length} bytes)</span>
                {isDirty && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    UNSAVED CHANGES
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                
                {/* Save Button */}
                <button
                  onClick={handleSave}
                  disabled={!isDirty || isSaving}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isDirty
                      ? 'bg-[#10b981] text-black hover:bg-[#10b981]/90 shadow-lg shadow-[#10b981]/20'
                      : 'bg-[#21293a] text-[#8b9bb4] opacity-50 cursor-not-allowed'
                  }`}
                  title="Save File Changes to Disk (Ctrl+S)"
                >
                  {isSaving ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>{isSaving ? 'Saving...' : 'Save File (Ctrl+S)'}</span>
                </button>

                {/* Read-Only Toggle */}
                <button
                  onClick={() => setIsReadOnly(!isReadOnly)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border transition-all cursor-pointer ${
                    isReadOnly
                      ? 'bg-[#ff4d4d]/10 text-[#ff4d4d] border-[#ff4d4d]/30'
                      : 'bg-[#00f0ff]/10 text-[#00f0ff] border-[#00f0ff]/30'
                  }`}
                >
                  {isReadOnly ? <Lock className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                  <span>{isReadOnly ? 'Read Only' : 'Edit Mode'}</span>
                </button>

                {/* Copy Code */}
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs text-[#8b9bb4] hover:text-[#00f0ff] transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#10b981]" />
                      <span className="text-[#10b981]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

              </div>
            </div>

            {/* Save Toast Notification */}
            {saveToast && (
              <div
                className={`absolute top-14 right-5 z-20 px-4 py-2 rounded-lg font-mono text-xs shadow-xl border flex items-center gap-2 animate-fadeIn ${
                  saveToast.type === 'success'
                    ? 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/40'
                    : 'bg-[#ff4d4d]/20 text-[#ff4d4d] border-[#ff4d4d]/40'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>{saveToast.text}</span>
              </div>
            )}

            {/* Monaco Editor Container */}
            <div className="flex-1 min-h-0 bg-[#090b0e]">
              <Editor
                height="100%"
                path={selectedFile}
                language={language}
                value={fileContent}
                onChange={(value) => setFileContent(value || '')}
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
                  fontFamily: "'Fira Code', 'JetBrains Mono', Consolas, monospace",
                }}
              />
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
