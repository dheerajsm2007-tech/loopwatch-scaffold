import React, { useState } from 'react';
import { Shield, Zap, Hash, Database, GitBranch, ArrowRight, CheckCircle2, Cpu, Info } from 'lucide-react';

export default function DetectorPipeline() {
  const [activeDetector, setActiveDetector] = useState(4);

  const detectors = [
    {
      id: 1,
      name: "Detector 1: Hard Caps",
      type: "Static Thresholds",
      complexity: "O(1) Check",
      desc: "Emergency safety floor: stops runs that exceed hard step count ceilings (e.g. 50 steps) or max dollar spend ($5.00 USD).",
      icon: Shield,
      color: "border-blue-500/40 text-blue-400 bg-blue-500/10",
      accent: "#3b82f6",
      details: [
        "Checks cumulative step count vs configured max limit",
        "Calculates exact API billing cost from input/output tokens",
        "Prevents catastrophic overnight runaway billing"
      ]
    },
    {
      id: 2,
      name: "Detector 2: Exact Repeat",
      type: "Hash Matching",
      complexity: "O(1) Hash Lookup",
      desc: "Catches naive loops where the agent calls the exact same tool with 100% identical arguments.",
      icon: Hash,
      color: "border-teal-500/40 text-teal-400 bg-teal-500/10",
      accent: "#14b8a6",
      details: [
        "SHA-256 digest of tool name + serialized JSON arguments",
        "Instant trigger on 2+ consecutive identical calls",
        "Zero latency overhead"
      ]
    },
    {
      id: 3,
      name: "Detector 3: Near-Repeat Similarity",
      type: "Fuzzy Matching",
      complexity: "O(N) String Distance",
      desc: "Detects near-identical tool queries with slight variation (e.g. minor typos or changing search term casing).",
      icon: Zap,
      color: "border-purple-500/40 text-purple-400 bg-purple-500/10",
      accent: "#a855f7",
      details: [
        "Levenshtein edit distance & N-gram token overlap",
        "Identifies circular re-phrased queries",
        "Catches minor parameter jittering"
      ]
    },
    {
      id: 4,
      name: "Detector 4: Information Gain & Workspace State",
      type: "Dual-Signal Progress Monitor",
      complexity: "O(1) Rolling Window",
      desc: "THE CORE CONTRIBUTION — Measures information gain (new facts read + workspace state changes) over a rolling 5-step window. Differentiates stuck agents from long productive refactors.",
      icon: Cpu,
      isCore: true,
      color: "border-[#00f0ff] text-[#00f0ff] bg-[#00f0ff]/10 glow-cyan",
      accent: "#00f0ff",
      details: [
        "Signal 1: SHA-256 hash of observation text returned by tool",
        "Signal 2: workspace_hash tracking workspace file state & Git rev-parse",
        "Rolling window: NO_PROGRESS_WINDOW = 5 consecutive steps",
        "Previous-step comparison prevents false positives during slow build/test loops"
      ]
    }
  ];

  return (
    <div className="w-full space-y-8">
      
      {/* Escalating Pipeline Flowchart */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
        {detectors.map((det, index) => {
          const Icon = det.icon;
          const isSelected = activeDetector === det.id;

          return (
            <div
              key={det.id}
              onClick={() => setActiveDetector(det.id)}
              className={`p-5 rounded-xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                det.isCore
                  ? 'md:col-span-1 border-2 border-[#00f0ff] bg-[#0e121a] shadow-xl hover:shadow-[#00f0ff]/20'
                  : 'bg-[#0e121a]/80 border-[#21293a] hover:border-[#313d54]'
              } ${isSelected ? 'ring-2 ring-[#00f0ff]' : ''}`}
            >
              {/* Step Stage Badge */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#8b9bb4]">
                  STAGE 0{det.id}
                </span>
                {det.isCore && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/40">
                    CORE INNOVATION
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${det.color}`}>
                  <Icon className="w-5 h-5" />
                </div>

                <h3 className={`font-mono font-bold text-sm ${det.isCore ? 'text-[#00f0ff]' : 'text-white'}`}>
                  {det.name}
                </h3>

                <p className="text-xs text-[#8b9bb4] line-clamp-3 leading-relaxed">
                  {det.desc}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#21293a] flex items-center justify-between text-[11px] font-mono text-[#8b9bb4]">
                <span>{det.complexity}</span>
                <span className="text-[#00f0ff] font-semibold">View Spec →</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deep Inspection Panel for Selected Detector */}
      {activeDetector && (
        <div className="p-6 rounded-xl bg-[#0e121a] border-2 border-[#00f0ff] shadow-2xl relative overflow-hidden">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#21293a]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#00f0ff]/20 border border-[#00f0ff]/50 flex items-center justify-center">
                <Cpu className="w-6 h-6 text-[#00f0ff]" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-[#00f0ff] uppercase tracking-wider">
                  DETECTOR SPECS & ALGORITHM DETAILS
                </span>
                <h3 className="text-lg font-mono font-bold text-white">
                  {detectors.find(d => d.id === activeDetector)?.name}
                </h3>
              </div>
            </div>

            <div className="font-mono text-xs text-[#8b9bb4] bg-[#090b0e] px-3 py-1.5 rounded-lg border border-[#21293a]">
              Type: <span className="text-[#00f0ff]">{detectors.find(d => d.id === activeDetector)?.type}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            
            {/* Key Mechanics */}
            <div className="space-y-3 font-mono text-xs">
              <h4 className="text-[#00f0ff] uppercase tracking-wider text-[11px] font-bold">
                Technical Execution Specifications
              </h4>
              <ul className="space-y-2">
                {detectors.find(d => d.id === activeDetector)?.details.map((detail, i) => (
                  <li key={i} className="flex items-start gap-2 text-[#8b9bb4]">
                    <CheckCircle2 className="w-4 h-4 text-[#10b981] shrink-0 mt-0.5" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Python Code Snippet */}
            <div className="bg-[#090b0e] p-4 rounded-lg border border-[#21293a] font-mono text-[11px] text-[#f1f5f9] space-y-2">
              <div className="flex items-center justify-between text-[#8b9bb4] border-b border-[#21293a] pb-2 text-[10px]">
                <span>detectors/detector4_progress.py</span>
                <span className="text-[#10b981]">FROZEN INTERFACE</span>
              </div>
              <pre className="text-xs text-[#00f0ff] overflow-x-auto leading-relaxed">
{`NO_PROGRESS_WINDOW = 5

def check(steps: list[dict]) -> Result:
    if len(steps) < NO_PROGRESS_WINDOW:
        return Result(triggered=False)
    
    # Check last 5 steps for repeated observation & workspace state
    recent = steps[-NO_PROGRESS_WINDOW:]
    obs_unchanged = all(s["observation"] == recent[0]["observation"] for s in recent)
    ws_unchanged = all(s.get("workspace_hash") == recent[0].get("workspace_hash") for s in recent)

    if obs_unchanged and ws_unchanged:
        return Result(triggered=True, reason=haltReasonText)
    return Result(triggered=False)`}
              </pre>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
