import React from 'react';
import { Activity, Github, ShieldCheck, Terminal, Layers } from 'lucide-react';
import { hackathonContext } from '../data/teamData';

export default function Footer({ setActiveTab }) {
  return (
    <footer className="bg-[#090b0e] border-t border-[#21293a] text-[#8b9bb4] font-sans text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-[#21293a] grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#00f0ff]/10 border border-[#00f0ff]/30 flex items-center justify-center">
                <Activity className="w-4 h-4 text-[#00f0ff]" />
              </div>
              <span className="font-mono font-bold text-white tracking-wider text-base">LOOPWATCH</span>
            </div>
            <p className="text-[#8b9bb4] max-w-md text-xs leading-relaxed font-mono">
              In-process step-by-step telemetry monitor for autonomous AI coding agents. Halts spinning execution loops via observation text hashing and workspace git hash diffing.
            </p>
            <div className="flex items-center gap-3 text-xs font-mono text-[#00f0ff]">
              <ShieldCheck className="w-4 h-4" />
              <span>{hackathonContext.event} — {hackathonContext.track}</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-white">Pages & Views</h4>
            <ul className="space-y-2 text-xs font-mono">
              <li>
                <button onClick={() => setActiveTab('home')} className="hover:text-[#00f0ff] transition-colors">
                  01. Home & Overview
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('how-it-works')} className="hover:text-[#00f0ff] transition-colors">
                  02. Detector Pipeline
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('demo')} className="hover:text-[#00f0ff] transition-colors">
                  03. Live Dashboard Demo
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('why-not-timeout')} className="hover:text-[#00f0ff] transition-colors">
                  04. Why Not Timeout?
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('eval')} className="hover:text-[#00f0ff] transition-colors">
                  05. Eval & Benchmarks
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('about')} className="hover:text-[#00f0ff] transition-colors">
                  06. About & Team
                </button>
              </li>
            </ul>
          </div>

          {/* Technical Contract */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-white">Schema & Specs</h4>
            <div className="p-3 rounded-lg bg-[#0e121a] border border-[#21293a] space-y-2 font-mono text-[11px]">
              <div className="flex items-center justify-between text-[#00f0ff]">
                <span>TRACE_SCHEMA.md</span>
                <span className="text-[10px] text-[#8b9bb4]">FROZEN</span>
              </div>
              <p className="text-[#8b9bb4] text-[10px] leading-tight">
                Standard JSONL format: run_id, step, timestamp, tool, arguments, observation, tokens, cost_usd, workspace_hash.
              </p>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[#21293a] flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-[#8b9bb4]">
          <p>© 2026 Loopwatch Team. Built for {hackathonContext.event} ({hackathonContext.organizer}).</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-[#10b981]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
              In-Process Guard: Operational
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}
