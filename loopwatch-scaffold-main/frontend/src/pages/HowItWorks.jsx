import React from 'react';
import { Layers, Shield, Zap, Hash, Cpu, ArrowDown, GitCommit, CheckCircle, AlertTriangle } from 'lucide-react';
import DetectorPipeline from '../components/DetectorPipeline';

export default function HowItWorks() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      
      {/* Page Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff]/30 font-mono text-xs text-[#00f0ff]">
          <Layers className="w-3.5 h-3.5" />
          <span>Escalating 4-Stage Detection Architecture</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-mono font-extrabold text-white tracking-tight">
          How Loopwatch Catches Stuck Agents
        </h1>
        <p className="text-base text-[#8b9bb4] leading-relaxed font-sans">
          An escalating pipeline ordered strictly from cheap static checks to sophisticated dual-signal information gain analysis.
        </p>
      </div>

      {/* Escalating Pipeline Component */}
      <DetectorPipeline />

      {/* Deep Dive into Detector 4 */}
      <section className="p-8 rounded-2xl bg-[#0e121a] border-2 border-[#00f0ff] space-y-8 shadow-2xl glow-cyan">
        
        <div className="border-b border-[#21293a] pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="font-mono text-xs text-[#00f0ff] uppercase tracking-widest font-bold">
              THE CORE CONTRIBUTION
            </span>
            <h2 className="text-2xl font-mono font-bold text-white mt-1">
              Detector 4: Information Gain & Workspace Hash Novelty
            </h2>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/40 font-mono text-xs font-semibold self-start md:self-auto">
            NO_PROGRESS_WINDOW = 5 Steps
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Dual Signals Explanation */}
          <div className="space-y-4 font-mono text-xs">
            <h3 className="text-white text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#00f0ff]" />
              <span>The Two Novelty Signals (Both Must Fail to Trigger)</span>
            </h3>

            <div className="p-4 rounded-xl bg-[#090b0e] border border-[#21293a] space-y-2">
              <div className="text-[#00f0ff] font-bold">1. Observation Text SHA-256 Digest</div>
              <p className="text-[#8b9bb4] text-[11px] font-sans leading-relaxed">
                Hashes the raw output string returned by tools (e.g. search results, terminal outputs, or read file buffers). If observation text changes, information gain is recorded and the streak resets to 0.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#090b0e] border border-[#21293a] space-y-2">
              <div className="text-[#10b981] font-bold">2. Workspace State Hash (<code className="text-[#10b981]">workspace_hash</code>)</div>
              <p className="text-[#8b9bb4] text-[11px] font-sans leading-relaxed">
                Hashes scratch directory file state (`git rev-parse HEAD` or file inventory). Catches progress a text-hash alone would miss (e.g. same search executed, but a file was edited).
              </p>
            </div>
          </div>

          {/* Key Design Choice Box */}
          <div className="p-5 rounded-xl bg-[#090b0e] border border-[#313d54] space-y-4 font-sans text-xs">
            <div className="flex items-center gap-2 text-[#ff9900] font-mono font-bold uppercase text-xs">
              <AlertTriangle className="w-4 h-4" />
              <span>Critical Architectural Design Choice</span>
            </div>
            
            <p className="text-[#f1f5f9] font-mono text-xs leading-relaxed font-bold">
              Comparison is evaluated against the IMMEDIATELY PREVIOUS step, not the full historical set of all seen hashes.
            </p>

            <p className="text-[#8b9bb4] text-[11px] leading-relaxed">
              <strong>Why this matters:</strong> A slow build/test cycle re-reads the same log file 5+ times — observation text repeats. With a naive "set of all seen hashes", that would trigger a false positive.
            </p>

            <p className="text-[#8b9bb4] text-[11px] leading-relaxed">
              With <strong>previous-step diffing</strong>, the workspace hash changes every time the build touches a file, resetting the streak and letting the agent finish its work.
            </p>
          </div>

        </div>

      </section>

    </div>
  );
}
