import React, { useState } from 'react';
import { Terminal, Search, FileText, Edit3, Brain, Copy, Check, Hash, Coins, Clock, ChevronDown, ChevronRight, CheckCircle2 } from 'lucide-react';

function getStepOneLiner(step) {
  const tool = step.tool;
  const args = step.arguments || {};

  if (tool === 'read_file') {
    return `Read ${args.path || args.file || 'file'}`;
  }
  if (tool === 'write_file') {
    return `Wrote ${args.path || args.file || 'file'}`;
  }
  if (tool === 'search') {
    return `Searched "${args.query || 'workspace'}"`;
  }
  if (tool === 'think') {
    return `Thinking… ${args.reasoning ? `(${args.reasoning})` : ''}`;
  }
  if (tool === 'done') {
    return 'Task Completed';
  }
  return `${tool} invoked`;
}

export default function TraceViewer({ steps = [], activeStepIndex = 0, onStepSelect }) {
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [filterTool, setFilterTool] = useState('all');
  const [expandedSteps, setExpandedSteps] = useState(new Set());

  const toggleExpand = (stepIndex) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepIndex)) next.delete(stepIndex);
      else next.add(stepIndex);
      return next;
    });
  };

  const getToolBadge = (tool) => {
    switch (tool) {
      case 'search':
        return { label: 'search', color: 'bg-[#1f6feb]/20 text-[#58a6ff] border-[#1f6feb]/40', icon: Search };
      case 'read_file':
        return { label: 'read_file', color: 'bg-teal-500/20 text-teal-400 border-teal-500/40', icon: FileText };
      case 'write_file':
        return { label: 'write_file', color: 'bg-[#238636]/20 text-[#3fb950] border-[#238636]/40', icon: Edit3 };
      case 'think':
        return { label: 'think', color: 'bg-purple-500/20 text-purple-400 border-purple-500/40', icon: Brain };
      default:
        return { label: tool, color: 'bg-gray-500/20 text-gray-400 border-gray-500/40', icon: Terminal };
    }
  };

  const filteredSteps = steps.filter(
    (step) => filterTool === 'all' || step.tool === filterTool
  );

  const copyStepJson = (step, idx) => {
    navigator.clipboard.writeText(JSON.stringify(step, null, 2));
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="bg-[#161b22] border border-[#21262d] rounded-xl overflow-hidden shadow-xl font-mono text-xs">
      
      {/* Header bar */}
      <div className="bg-[#0d1117] px-4 py-2.5 border-b border-[#21262d] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-white font-semibold">
          <Terminal className="w-4 h-4 text-[#58a6ff]" />
          <span>CHAT STEP TRANSCRIPT</span>
          <span className="text-[#8b949e] text-[11px] font-normal">({steps.length} steps)</span>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1 bg-[#161b22] p-1 rounded border border-[#21262d] text-[11px]">
          {['all', 'search', 'read_file', 'write_file', 'think'].map((toolName) => (
            <button
              key={toolName}
              onClick={() => setFilterTool(toolName)}
              className={`px-2 py-0.5 rounded capitalize transition-colors ${
                filterTool === toolName
                  ? 'bg-[#21262d] text-white font-bold'
                  : 'text-[#8b949e] hover:text-[#c9d1d9]'
              }`}
            >
              {toolName}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Transcript List */}
      <div className="divide-y divide-[#21262d]/60 max-h-[520px] overflow-y-auto lg-scroll-tree">
        {filteredSteps.map((step, idx) => {
          const badge = getToolBadge(step.tool);
          const Icon = badge.icon;
          const isSelected = activeStepIndex === step.step;
          const isHaltedStep = step.status === 'halted';
          const isExpanded = expandedSteps.has(step.step);
          const oneLiner = getStepOneLiner(step);

          return (
            <div
              key={step.step}
              onClick={() => {
                if (onStepSelect) onStepSelect(step.step);
                toggleExpand(step.step);
              }}
              className={`p-3 transition-all cursor-pointer ${
                isHaltedStep
                  ? 'bg-[#da3633]/10 border-l-4 border-l-[#f85149]'
                  : isSelected
                  ? 'bg-[#1f6feb]/10 border-l-4 border-l-[#58a6ff]'
                  : 'hover:bg-[#21262d]/40 border-l-4 border-l-transparent'
              }`}
            >
              {/* Chat Message Row Header */}
              <div className="flex items-center justify-between gap-2">
                
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-[#8b949e] shrink-0" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-[#8b949e] shrink-0" />
                  )}

                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    isHaltedStep ? 'bg-[#da3633] text-white' : 'bg-[#21262d] text-[#8b949e]'
                  }`}>
                    #{step.step}
                  </span>

                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] border shrink-0 ${badge.color}`}>
                    <Icon className="w-3 h-3" />
                    <span>{badge.label}</span>
                  </span>

                  {/* Plain English Action One-Liner */}
                  <span className="font-semibold text-white truncate text-xs">
                    {oneLiner}
                  </span>
                </div>

                {/* Right Metadata */}
                <div className="flex items-center gap-3 text-[11px] text-[#8b949e] shrink-0">
                  <span>${(step.cost_usd || 0).toFixed(4)}</span>
                  <span className="hidden sm:inline">in:{step.input_tokens || 0} / out:{step.output_tokens || 0}</span>
                </div>

              </div>

              {/* Expanded Detail View */}
              {isExpanded && (
                <div className="mt-2.5 pt-2 border-t border-[#21262d] space-y-2 text-xs">
                  
                  {/* Arguments JSON */}
                  <div className="p-2 rounded bg-[#0d1117] border border-[#21262d]">
                    <span className="text-[#8b949e] text-[10px] block mb-0.5">ARGUMENTS:</span>
                    <pre className="text-[#58a6ff] whitespace-pre-wrap break-all font-mono text-[11px]">
                      {JSON.stringify(step.arguments, null, 2)}
                    </pre>
                  </div>

                  {/* Observation Snippet */}
                  <div className="p-2 rounded bg-[#0d1117] border border-[#21262d]">
                    <span className="text-[#8b949e] text-[10px] block mb-0.5">OBSERVATION:</span>
                    <div className="text-[#c9d1d9] font-mono text-[11px] whitespace-pre-wrap break-all">
                      {step.observation}
                    </div>
                  </div>

                  {/* Step Footer Bar */}
                  <div className="flex items-center justify-between text-[10px] text-[#8b949e] pt-1">
                    <span className="flex items-center gap-1 font-mono">
                      <Hash className="w-3 h-3 text-[#58a6ff]" />
                      <span>{step.workspace_hash ? step.workspace_hash.substring(0, 10) : 'hash'}</span>
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyStepJson(step, idx);
                      }}
                      className="flex items-center gap-1 text-[#8b949e] hover:text-[#58a6ff] transition-colors"
                    >
                      {copiedIndex === idx ? (
                        <>
                          <Check className="w-3 h-3 text-[#3fb950]" />
                          <span className="text-[#3fb950]">Copied JSON</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy JSON</span>
                        </>
                      )}
                    </button>
                  </div>

                </div>
              )}

            </div>
          );
        })}
      </div>

    </div>
  );
}
