import React, { useState, useEffect } from 'react';
import { X, Folder, FileText, Code2, Copy, Check, Search, Terminal, HardDrive } from 'lucide-react';
import { fetchWorkspaceFiles, fetchWorkspaceFile } from '../api';

export default function WorkspaceViewer({ isOpen, onClose, selectedRunId }) {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

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
      const data = await fetchWorkspaceFile(selectedRunId, selectedFile);
      setFileContent(data?.content || '');
    }

    loadFile();
  }, [isOpen, selectedRunId, selectedFile]);

  if (!isOpen) return null;

  const filteredFiles = files.filter((f) => f.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleCopy = () => {
    navigator.clipboard.writeText(fileContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md font-mono animate-fadeIn">
      
      <div className="w-full max-w-6xl h-[85vh] bg-[#090b0e] border-2 border-[#21293a] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Modal Window Header */}
        <div className="bg-[#141a26] px-6 py-4 border-b border-[#21293a] flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#00f0ff]/10 border border-[#00f0ff]/30 flex items-center justify-center text-[#00f0ff]">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">WORKSPACE CODEBASE EXPLORER</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/30 uppercase font-mono">
                  {selectedRunId}
                </span>
              </div>
              <p className="text-xs text-[#8b9bb4]">
                Target workspace codebase files & snapshot artifacts
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
              {isLoading ? (
                <div className="p-4 text-xs text-[#8b9bb4] text-center">Loading files...</div>
              ) : filteredFiles.length === 0 ? (
                <div className="p-4 text-xs text-[#8b9bb4] text-center">No files found</div>
              ) : (
                filteredFiles.map((file) => (
                  <button
                    key={file}
                    onClick={() => setSelectedFile(file)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-mono text-left transition-all cursor-pointer ${
                      selectedFile === file
                        ? 'bg-[#00f0ff]/20 text-[#00f0ff] font-semibold border border-[#00f0ff]/40'
                        : 'text-[#8b9bb4] hover:text-white hover:bg-[#141a26]'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{file}</span>
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

          {/* Main Code Editor Panel */}
          <div className="flex-1 bg-[#090b0e] flex flex-col overflow-hidden">
            
            {/* Active File Bar */}
            <div className="bg-[#141a26] px-5 py-2.5 border-b border-[#21293a] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-[#00f0ff]">
                <Code2 className="w-4 h-4" />
                <span className="font-semibold text-white">{selectedFile || 'Select a file'}</span>
                <span className="text-[10px] text-[#8b9bb4]">({fileContent.length} bytes)</span>
              </div>

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
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>

            {/* Code Content Container */}
            <div className="flex-1 overflow-auto p-5 font-mono text-xs leading-relaxed text-[#f1f5f9] selection:bg-[#00f0ff]/30">
              <pre className="whitespace-pre font-mono">
                {fileContent.split('\n').map((line, idx) => (
                  <div key={idx} className="table-row hover:bg-[#141a26]/50">
                    <span className="table-cell text-[#8b9bb4]/40 select-none pr-4 text-right w-10 border-r border-[#21293a] mr-4">
                      {idx + 1}
                    </span>
                    <span className="table-cell pl-4">{line}</span>
                  </div>
                ))}
              </pre>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
