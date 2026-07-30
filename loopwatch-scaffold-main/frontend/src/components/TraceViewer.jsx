import React, { useState } from 'react';
import { Terminal, Search, FileText, Edit3, Brain, Copy, Check, Hash, Coins, Clock } from 'lucide-react';

export default function TraceViewer({ steps = [], activeStepIndex = 0, onStepSelect }) {
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [filterTool, setFilterTool] = useState('all');

  const getToolBadge = (tool) => {
    switch (tool) {
      case 'search':
        return { label: 'search', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30', icon: Search };
      case 'read_file':
        return { label: 'read_file', color: 'bg-teal-500/10 text-teal-400 border-teal-500/30', icon: FileText };
      case 'write_file':
        return { label: 'write_file', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', icon: Edit3 };
      case 'think':
        return { label: 'think', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30', icon: Brain };
      default:
        return { label: tool, color: 'bg-gray-500/10 text-gray-400 border-gray-500/30', icon: Terminal };
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
    <div className="bg-[#0e121a] border border-[#21293a] rounded-xl overflow-hidden shadow-xl font-mono">
      
      {/* Header bar */}
      <div className="bg-[#141a26] px-4 py-3 border-b border-[#21293a] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-white font-semibold">
          <Terminal className="w-4 h-4 text-[#00f0ff]" />
          <span>LIVE STEP FEED</span>
          <span className="text-[#8b9bb4] text-[11px] font-normal">({steps.length} steps recorded)</span>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1 bg-[#090b0e] p-1 rounded-lg border border-[#21293a] text-[11px]">
          {['all', 'search', 'read_file', 'write_file', 'think'].map((toolName) => (
            <button
              key={toolName}
              onClick={() => setFilterTool(toolName)}
              className={`px-2 py-0.5 rounded capitalize transition-colors ${
                filterTool === toolName
                  ? 'bg-[#00f0ff]/20 text-[#00f0ff] font-bold'
                  : 'text-[#8b9bb4] hover:text-white'
              }`}
            >
              {toolName}
            </button>
          ))}
        </div>
      </div>

      {/* Step Log List */}
      <div className="divide-y divide-[#21293a] max-h-[520px] overflow-y-auto">
        {filteredSteps.map((step, idx) => {
          const badge = getToolBadge(step.tool);
          const Icon = badge.icon;
          const isSelected = activeStepIndex === step.step;
          const isHaltedStep = step.status === 'halted';
          const isWarningStep = step.status === 'warning';

          return (
            <div
              key={step.step}
              onClick={() => onStepSelect && onStepSelect(step.step)}
              className={`p-4 transition-all cursor-pointer ${
                isHaltedStep
                  ? 'bg-[#ff4d4d]/10 border-l-4 border-l-[#ff4d4d]'
                  : isWarningStep
                  ? 'bg-[#ff9900]/10 border-l-4 border-l-[#ff9900]'
                  : isSelected
                  ? 'bg-[#141a26] border-l-4 border-l-[#00f0ff]'
                  : 'hover:bg-[#141a26]/40 border-l-4 border-l-transparent'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                
                {/* Step number & Tool Badge */}
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    isHaltedStep ? 'bg-[#ff4d4d] text-white' : 'bg-[#21293a] text-[#8b9bb4]'
                  }`}>
                    STEP #{step.step}
                  </span>
                  
                  <span className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs border font-medium ${badge.color}`}>
                    <Icon className="w-3.5 h-3.5" />
                    <span>{badge.label}</span>
                  </span>

                  <span className="text-[11px] text-[#8b9bb4] flex items-center gap-1 hidden md:flex">
                    <Clock className="w-3 h-3 text-[#8b9bb4]" />
                    {new Date(step.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                {/* Tokens & Cost */}
                <div className="flex items-center gap-3 text-[11px] text-[#8b9bb4]">
                  <span className="flex items-center gap-1">
                    <Coins className="w-3 h-3 text-[#ff9900]" />
                    <span>${step.cost_usd.toFixed(4)}</span>
                  </span>
                  <span>in:{step.input_tokens} / out:{step.output_tokens}</span>
                  <span className="flex items-center gap-1 text-[10px] bg-[#090b0e] px-2 py-0.5 rounded border border-[#21293a]">
                    <Hash className="w-3 h-3 text-[#00f0ff]" />
                    <span className="truncate max-w-[80px]">{step.workspace_hash.substring(0, 8)}</span>
                  </span>
                </div>

              </div>

              {/* Arguments JSON */}
              <div className="text-xs text-white mb-2 pl-2 border-l border-[#21293a] py-1 bg-[#090b0e]/60 rounded">
                <span className="text-[#8b9bb4] text-[11px]">args: </span>
                <span className="text-[#00f0ff]">{JSON.stringify(step.arguments)}</span>
              </div>

              {/* Observation Snippet */}
              <div className="text-xs text-[#8b9bb4] pl-2 leading-relaxed font-sans bg-[#090b0e]/30 p-2 rounded border border-[#21293a]/50">
                <div className="font-mono text-[10px] uppercase tracking-wider text-[#8b9bb4] mb-0.5">Observation:</div>
                <div className="font-mono text-[11px] text-[#f1f5f9] truncate">{step.observation}</div>
              </div>

              {/* Step Copy Bar */}
              <div className="mt-2 flex items-center justify-between text-[10px] text-[#8b9bb4] pt-1">
                <span>Run ID: {step.run_id}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    copyStepJson(step, idx);
                  }}
                  className="flex items-center gap-1 text-[#8b9bb4] hover:text-[#00f0ff] transition-colors"
                >
                  {copiedIndex === idx ? (
                    <>
                      <Check className="w-3 h-3 text-[#10b981]" />
                      <span className="text-[#10b981]">Copied JSON</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Step JSON</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
