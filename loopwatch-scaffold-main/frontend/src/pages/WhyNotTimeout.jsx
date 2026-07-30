import React from 'react';
import { ShieldAlert, CheckCircle2, XCircle, ArrowRight, Zap, HelpCircle, Activity } from 'lucide-react';
import { detectorComparisonMatrix } from '../data/benchmarkData';
import RoiCalculator from '../components/RoiCalculator';

export default function WhyNotTimeout() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff]/30 font-mono text-xs text-[#00f0ff]">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Architectural Comparison & ROI</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-mono font-extrabold text-white tracking-tight">
          Why Not Just a Timeout or APM Tool?
        </h1>
        <p className="text-base text-[#8b9bb4] leading-relaxed font-sans">
          Naive timeouts kill productive agents. Post-hoc dashboards alert after the bill arrives. Loopwatch halts in-process the moment progress flatlines.
        </p>
      </div>

      {/* Comparison Matrix Table */}
      <div className="bg-[#0e121a] border border-[#21293a] rounded-xl overflow-hidden shadow-2xl font-mono text-xs">
        
        <div className="bg-[#141a26] px-6 py-4 border-b border-[#21293a] flex items-center justify-between">
          <span className="font-bold text-white uppercase tracking-wider text-sm">
            Guard Architecture & Signal Comparison
          </span>
          <span className="text-[11px] text-[#00f0ff]">SWE-BENCH BENCHMARK EVAL</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#21293a] text-[#8b9bb4] text-[11px] uppercase bg-[#090b0e]/60">
                <th className="py-3.5 px-6">Approach</th>
                <th className="py-3.5 px-6">Target Catch Rate</th>
                <th className="py-3.5 px-6">False-Kill Rate</th>
                <th className="py-3.5 px-6">Mechanism</th>
                <th className="py-3.5 px-6">Verdict</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#21293a]">
              {detectorComparisonMatrix.map((row, idx) => {
                const isLoopwatch = row.approach.includes('Loopwatch');
                return (
                  <tr
                    key={idx}
                    className={`transition-colors ${
                      isLoopwatch
                        ? 'bg-[#00f0ff]/10 font-semibold text-white'
                        : 'hover:bg-[#141a26]/40 text-[#8b9bb4]'
                    }`}
                  >
                    <td className="py-4 px-6 flex items-center gap-2">
                      {isLoopwatch && <Activity className="w-4 h-4 text-[#00f0ff]" />}
                      <span className={isLoopwatch ? 'text-[#00f0ff] font-bold' : 'text-white'}>
                        {row.approach}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-bold">{row.catchRate}</td>
                    <td className="py-4 px-6 font-bold text-[#10b981]">{row.falseKillRate}</td>
                    <td className="py-4 px-6 text-[11px] max-w-xs">{row.mechanism}</td>
                    <td className="py-4 px-6 text-[11px]">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        isLoopwatch
                          ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40'
                          : 'bg-[#ff4d4d]/10 text-[#ff4d4d] border border-[#ff4d4d]/30'
                      }`}>
                        {row.verdict}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

      {/* APM Comparison: Isn't this LangSmith/Langfuse/Datadog? */}
      <section className="p-8 rounded-2xl bg-[#0e121a] border border-[#21293a] space-y-6">
        
        <div className="flex items-center gap-3 border-b border-[#21293a] pb-4">
          <div className="w-10 h-10 rounded-lg bg-[#00f0ff]/20 border border-[#00f0ff]/40 flex items-center justify-center">
            <HelpCircle className="w-6 h-6 text-[#00f0ff]" />
          </div>
          <div>
            <span className="text-xs font-mono text-[#00f0ff] uppercase tracking-wider">
              Positioning & Interception Point
            </span>
            <h3 className="text-xl font-mono font-bold text-white">
              "Isn't this LangSmith, Langfuse, or Datadog?"
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-sans text-xs">
          
          <div className="p-5 rounded-xl bg-[#090b0e] border border-[#21293a] space-y-3">
            <h4 className="text-sm font-mono font-bold text-white uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#ff9900]" />
              Post-Hoc APM Telemetry (LangSmith / Datadog)
            </h4>
            <p className="text-[#8b9bb4] leading-relaxed">
              LangSmith and Langfuse provide exceptional visual trace logging, metrics, and cost tracking. However, they function <strong>after the fact</strong> — logging telemetry asynchronously to a cloud dashboard.
            </p>
            <div className="p-3 rounded bg-[#141a26] font-mono text-[11px] text-[#ff9900]">
              ⚠️ Result: You receive a Slack alert or view a dashboard chart *after* the agent has burned $45 in background loops.
            </div>
          </div>

          <div className="p-5 rounded-xl bg-[#090b0e] border-2 border-[#00f0ff] space-y-3">
            <h4 className="text-sm font-mono font-bold text-[#00f0ff] uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-ping" />
              In-Process Autonomous Guard (Loopwatch)
            </h4>
            <p className="text-[#8b9bb4] leading-relaxed">
              Loopwatch operates <strong>synchronously inside the agent tool execution loop</strong>. The moment Detector 4 identifies 5 consecutive steps of zero information gain, it raises a Python exception / halts execution immediately.
            </p>
            <div className="p-3 rounded bg-[#00f0ff]/10 border border-[#00f0ff]/30 font-mono text-[11px] text-[#00f0ff]">
              ✅ Result: The run is frozen at Step 5. Zero additional tokens are billed. Spend is capped instantly.
            </div>
          </div>

        </div>

      </section>

      {/* Financial ROI Calculator */}
      <RoiCalculator />

    </div>
  );
}
