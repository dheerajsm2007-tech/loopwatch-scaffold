import React, { useState } from 'react';
import { BarChart3, CheckCircle2, ShieldAlert, Target, Info, Search, FileText } from 'lucide-react';
import { benchmarkMetrics, benchmarkTasks } from '../data/benchmarkData';

export default function EvalResults() {
  const [filterType, setFilterType] = useState('all');

  const filteredTasks = benchmarkTasks.filter(
    (t) => filterType === 'all' || t.type.toLowerCase() === filterType.toLowerCase()
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16 font-sans">
      
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff]/30 font-mono text-xs text-[#00f0ff]">
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Evaluation Metrics & Benchmark Suite</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-mono font-extrabold text-white tracking-tight">
          Benchmark Results & Safety Evals
        </h1>
        <p className="text-base text-[#8b9bb4] leading-relaxed">
          Why Catch Rate alone is a misleading metric, and how False-Kill Rate measures true guard precision.
        </p>
      </div>

      {/* Headline Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Metric 1: Catch Rate */}
        <div className="p-6 rounded-2xl bg-[#0e121a] border border-[#00f0ff]/40 space-y-3 font-mono">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#00f0ff] uppercase tracking-wider font-semibold">
              {benchmarkMetrics.catchRate.label}
            </span>
            <span className="text-[10px] bg-[#00f0ff]/20 text-[#00f0ff] px-2 py-0.5 rounded border border-[#00f0ff]/40">
              TARGET VALUE
            </span>
          </div>
          <div className="text-5xl font-extrabold text-white">{benchmarkMetrics.catchRate.value}</div>
          <p className="text-xs text-[#8b9bb4] font-sans leading-relaxed">
            {benchmarkMetrics.catchRate.detail}
          </p>
        </div>

        {/* Metric 2: False-Kill Rate (CRITICAL METRIC) */}
        <div className="p-6 rounded-2xl bg-[#0e121a] border-2 border-[#10b981] space-y-3 font-mono glow-teal">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#10b981] uppercase tracking-wider font-semibold">
              {benchmarkMetrics.falseKillRate.label}
            </span>
            <span className="text-[10px] bg-[#10b981]/20 text-[#10b981] px-2 py-0.5 rounded border border-[#10b981]/40">
              CORE SAFETY SIGNAL
            </span>
          </div>
          <div className="text-5xl font-extrabold text-[#10b981]">{benchmarkMetrics.falseKillRate.value}</div>
          <p className="text-xs text-[#8b9bb4] font-sans leading-relaxed">
            {benchmarkMetrics.falseKillRate.detail}
          </p>
        </div>

      </div>

      {/* CRITICAL HONESTY NOTICE: Why Catch Rate Alone is Misleading */}
      <section className="p-6 rounded-2xl bg-[#160c10] border border-[#ff4d4d]/40 space-y-4">
        <div className="flex items-center gap-3 text-[#ff4d4d] font-mono font-bold text-sm uppercase">
          <ShieldAlert className="w-5 h-5" />
          <span>Evaluation Principle: The "Naive Detector" Fallacy</span>
        </div>
        <p className="text-xs text-[#8b9bb4] leading-relaxed font-sans">
          A naive detector that kills <em>every single agent run on step 1</em> achieves an absolute <strong>100% Catch Rate</strong>. Thus, Catch Rate alone is a meaningless metric without measuring <strong>False-Kill Rate</strong>. Loopwatch's primary engineering objective is keeping False-Kill Rate below 1% while maintaining &gt;98% loop detection.
        </p>
      </section>

      {/* Task Benchmark Matrix */}
      <div className="bg-[#0e121a] border border-[#21293a] rounded-xl overflow-hidden shadow-xl font-mono text-xs">
        <div className="bg-[#141a26] px-6 py-4 border-b border-[#21293a] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="font-bold text-white uppercase">
            SWE-Bench & Synthetic Task Evaluation Runs
          </span>

          <div className="flex items-center gap-1 bg-[#090b0e] p-1 rounded-lg border border-[#21293a] text-[11px]">
            {['all', 'spinning', 'productive'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1 rounded capitalize transition-colors ${
                  filterType === type
                    ? 'bg-[#00f0ff]/20 text-[#00f0ff] font-bold'
                    : 'text-[#8b9bb4] hover:text-white'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#21293a] text-[#8b9bb4] text-[11px] uppercase bg-[#090b0e]/60">
                <th className="py-3.5 px-6">Task ID</th>
                <th className="py-3.5 px-6">Title / Scenario</th>
                <th className="py-3.5 px-6">Category</th>
                <th className="py-3.5 px-6">Total Steps</th>
                <th className="py-3.5 px-6">Halted Step</th>
                <th className="py-3.5 px-6">Eval Verdict</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#21293a]">
              {filteredTasks.map((task) => (
                <tr key={task.id} className="hover:bg-[#141a26]/40 text-[#8b9bb4]">
                  <td className="py-4 px-6 text-[#00f0ff] font-bold">{task.id}</td>
                  <td className="py-4 px-6 text-white font-medium">{task.title}</td>
                  <td className="py-4 px-6">{task.category}</td>
                  <td className="py-4 px-6">{task.totalSteps} steps</td>
                  <td className="py-4 px-6">
                    {task.haltedAtStep ? (
                      <span className="text-[#ff4d4d] font-bold">Step {task.haltedAtStep}</span>
                    ) : (
                      <span className="text-[#10b981]">Not Halted</span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                      task.result.includes('Caught')
                        ? 'bg-[#ff4d4d]/10 text-[#ff4d4d] border border-[#ff4d4d]/30'
                        : 'bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/30'
                    }`}>
                      {task.result}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
