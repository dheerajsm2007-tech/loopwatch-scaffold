import React from 'react';
import { Activity, ShieldAlert, Cpu, ArrowRight, CheckCircle2, Zap, Terminal, Lock, Flame, Sparkles } from 'lucide-react';
import HeroCanvasVideo from '../components/HeroCanvasVideo';

export default function Home({ setActiveTab }) {
  return (
    <div className="relative min-h-screen space-y-16 pb-20">
      
      {/* HERO SECTION WITH BACKGROUND VIDEO CANVAS */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-16 pb-20 overflow-hidden border-b border-[#21293a]">
        
        {/* Background Video Frame-Sequence Canvas */}
        <HeroCanvasVideo totalFrames={180} fps={24} />

        {/* Hero Foreground Content */}
        <div className="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          
          {/* Top Live Status Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#090b0e]/90 border border-[#00f0ff]/40 shadow-lg backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-ping" />
            <span className="font-mono text-xs text-white">FRONTIER 2026 — Track 05: AI Safety & Observability</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.15]">
            Loopwatch watches every step an AI coding agent takes and{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#ff4d4d] via-[#ff9900] to-[#ff4d4d] underline decoration-[#ff4d4d]/50 decoration-wavy">
              halts the run the moment it starts spinning
            </span>{' '}
            — before the bug becomes the bill.
          </h1>

          {/* Sub-line explaining core insight */}
          <p className="text-lg sm:text-xl text-[#8b9bb4] max-w-3xl mx-auto font-sans leading-relaxed">
            Unlike naive step limits or post-hoc APM dashboards, Loopwatch measures{' '}
            <strong className="text-[#00f0ff] font-mono">information gain</strong> — tracking new files read, new facts learned, and workspace state changes — so it never kills a long productive refactor, but stops a stuck loop on Step 5.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => setActiveTab('demo')}
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-mono text-sm font-bold uppercase tracking-wider bg-gradient-to-r from-[#00f0ff] to-[#06b6d4] text-[#090b0e] hover:brightness-110 shadow-2xl shadow-[#00f0ff]/30 transition-all flex items-center justify-center gap-3 focus:ring-4 focus:ring-[#00f0ff]/40"
            >
              <Zap className="w-5 h-5 fill-current" />
              <span>See It Catch a Stuck Agent</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveTab('how-it-works')}
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-mono text-sm font-semibold text-white bg-[#0e121a]/90 hover:bg-[#141a26] border border-[#313d54] transition-all flex items-center justify-center gap-2"
            >
              <Terminal className="w-4 h-4 text-[#00f0ff]" />
              <span>Explore Detector Pipeline</span>
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto font-mono">
            
            <div className="p-4 rounded-xl bg-[#0e121a]/90 border border-[#21293a] backdrop-blur-md">
              <div className="text-2xl font-bold text-[#00f0ff]">98.4%</div>
              <div className="text-[11px] text-[#8b9bb4]">Target Catch Rate</div>
            </div>

            <div className="p-4 rounded-xl bg-[#0e121a]/90 border border-[#10b981]/40 backdrop-blur-md">
              <div className="text-2xl font-bold text-[#10b981]">0.8%</div>
              <div className="text-[11px] text-[#8b9bb4]">False-Kill Ceiling</div>
            </div>

            <div className="p-4 rounded-xl bg-[#0e121a]/90 border border-[#21293a] backdrop-blur-md">
              <div className="text-2xl font-bold text-white">&lt;0.1ms</div>
              <div className="text-[11px] text-[#8b9bb4]">In-Process Overhead</div>
            </div>

            <div className="p-4 rounded-xl bg-[#0e121a]/90 border border-[#ff4d4d]/40 backdrop-blur-md">
              <div className="text-2xl font-bold text-[#ff4d4d]">Step 5</div>
              <div className="text-[11px] text-[#8b9bb4]">Avg. Halt Trigger</div>
            </div>

          </div>

        </div>
      </section>

      {/* CORE DIFFERENCE SECTION: Information Gain vs Step Count */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="text-xs font-mono text-[#00f0ff] uppercase tracking-wider flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            <span>The Fundamental Paradigm Shift</span>
          </div>
          <h2 className="text-3xl font-mono font-bold text-white">
            Information Gain vs. Naive Step Counting
          </h2>
          <p className="text-sm text-[#8b9bb4]">
            Why standard timeouts fail agentic workflows, and how dual-signal verification preserves long productive runs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Card 1: Naive Timeout */}
          <div className="p-6 rounded-2xl bg-[#0e121a] border border-[#ff4d4d]/30 space-y-4">
            <div className="flex items-center justify-between border-b border-[#21293a] pb-3">
              <div className="flex items-center gap-2 text-[#ff4d4d] font-mono font-bold text-sm">
                <ShieldAlert className="w-5 h-5" />
                <span>NAIVE STEP LIMITS / TIMEOUTS</span>
              </div>
              <span className="text-[10px] font-mono bg-[#ff4d4d]/10 text-[#ff4d4d] px-2 py-0.5 rounded border border-[#ff4d4d]/30">
                BLIND CUTOFF
              </span>
            </div>

            <p className="text-xs text-[#8b9bb4] leading-relaxed font-sans">
              Measures wall-clock time or total tool count. When a complex agent performs a legitimate 50-step refactor, a step limit kills it mid-execution, wasting all prior progress.
            </p>

            <div className="p-3 rounded bg-[#090b0e] border border-[#21293a] font-mono text-[11px] space-y-1 text-[#ff4d4d]">
              <div>❌ Kills long productive tasks prematurely</div>
              <div>❌ Lets 4-step loops burn tokens continuously until limit</div>
              <div>❌ Zero awareness of workspace changes</div>
            </div>
          </div>

          {/* Card 2: Loopwatch Information Gain */}
          <div className="p-6 rounded-2xl bg-[#0e121a] border-2 border-[#00f0ff] space-y-4 glow-cyan">
            <div className="flex items-center justify-between border-b border-[#21293a] pb-3">
              <div className="flex items-center gap-2 text-[#00f0ff] font-mono font-bold text-sm">
                <Cpu className="w-5 h-5" />
                <span>LOOPWATCH DUAL-SIGNAL SIGNAL</span>
              </div>
              <span className="text-[10px] font-mono bg-[#00f0ff]/20 text-[#00f0ff] px-2 py-0.5 rounded border border-[#00f0ff]/40">
                NOVELTY DETECTOR
              </span>
            </div>

            <p className="text-xs text-[#8b9bb4] leading-relaxed font-sans">
              Monitors Observation Text SHA-256 digests and <code className="text-[#00f0ff] font-mono">workspace_hash</code> Git state diffs across a 5-step rolling window. If either signal shows novelty, execution continues safely.
            </p>

            <div className="p-3 rounded bg-[#090b0e] border border-[#21293a] font-mono text-[11px] space-y-1 text-[#10b981]">
              <div>✅ Allows 100+ step productive refactors uninterrupted</div>
              <div>✅ Stops repeating searches & 404 loops at Step 5</div>
              <div>✅ Previous-step diffing handles slow build/test loops</div>
            </div>
          </div>

        </div>

      </section>

      {/* QUICK INTEGRATION CODE SNIPPET */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 rounded-2xl bg-[#0e121a] border border-[#21293a] space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#21293a] pb-4">
            <div>
              <span className="text-xs font-mono text-[#00f0ff] uppercase tracking-wider">3-Line Python Harness Guard Integration</span>
              <h3 className="text-xl font-mono font-bold text-white mt-1">Drop Loopwatch directly into your agent execution loop</h3>
            </div>
            <button
              onClick={() => setActiveTab('how-it-works')}
              className="font-mono text-xs text-[#00f0ff] hover:underline self-start md:self-auto"
            >
              View Full Guard Specs →
            </button>
          </div>

          <pre className="p-5 rounded-xl bg-[#090b0e] border border-[#21293a] font-mono text-xs text-[#00f0ff] overflow-x-auto leading-relaxed">
{`from detectors.detector4_progress import check

# Inside your agent tool-call execution loop:
step_telemetry = harness.execute_tool(step_input)
result = check(harness.history_steps)

if result.triggered:
    harness.halt_execution(reason=result.reason)`}
          </pre>
        </div>
      </section>

    </div>
  );
}
