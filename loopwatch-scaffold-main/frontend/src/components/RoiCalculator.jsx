import React, { useState } from 'react';
import { DollarSign, Clock, TrendingUp, ShieldCheck, ArrowRight } from 'lucide-react';

export default function RoiCalculator() {
  const [agentCount, setAgentCount] = useState(25);
  const [spinMinutes, setSpinMinutes] = useState(15);
  const [costPerMin, setCostPerMin] = useState(0.25);

  // Calculations
  const dailyWastePerAgent = spinMinutes * costPerMin;
  const totalDailyWaste = dailyWastePerAgent * agentCount;
  const monthlyWaste = totalDailyWaste * 22; // 22 working days
  const hoursReclaimed = Math.round((spinMinutes * agentCount * 22) / 60);

  return (
    <div className="bg-[#0e121a] border border-[#21293a] rounded-xl p-6 shadow-xl font-sans">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#21293a]">
        <div>
          <div className="text-xs font-mono text-[#00f0ff] uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <DollarSign className="w-4 h-4" />
            <span>Interactive Financial ROI Calculator</span>
          </div>
          <h3 className="text-xl font-mono font-bold text-white">
            Calculate Runaway Agent Token Waste Prevented
          </h3>
        </div>

        <div className="bg-[#090b0e] px-4 py-2 rounded-lg border border-[#21293a] text-right font-mono">
          <div className="text-[10px] text-[#8b9bb4] uppercase">Estimated Monthly Savings</div>
          <div className="text-2xl font-bold text-[#10b981]">${monthlyWaste.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
        
        {/* Sliders Input Controls */}
        <div className="space-y-6 font-mono text-xs">
          
          {/* Slider 1: Active Agents */}
          <div className="space-y-2">
            <div className="flex justify-between text-[#8b9bb4]">
              <span>Active Agent Sessions / Day:</span>
              <span className="text-[#00f0ff] font-bold">{agentCount} Sessions</span>
            </div>
            <input
              type="range"
              min="5"
              max="100"
              value={agentCount}
              onChange={(e) => setAgentCount(Number(e.target.value))}
              className="w-full h-2 bg-[#21293a] rounded-lg appearance-none cursor-pointer accent-[#00f0ff]"
            />
          </div>

          {/* Slider 2: Spinning Minutes */}
          <div className="space-y-2">
            <div className="flex justify-between text-[#8b9bb4]">
              <span>Avg. Uncaught Spinning Time / Session:</span>
              <span className="text-[#ff9900] font-bold">{spinMinutes} Minutes</span>
            </div>
            <input
              type="range"
              min="2"
              max="60"
              value={spinMinutes}
              onChange={(e) => setSpinMinutes(Number(e.target.value))}
              className="w-full h-2 bg-[#21293a] rounded-lg appearance-none cursor-pointer accent-[#ff9900]"
            />
          </div>

          {/* Slider 3: Cost per minute */}
          <div className="space-y-2">
            <div className="flex justify-between text-[#8b9bb4]">
              <span>LLM API Cost Rate ($/min):</span>
              <span className="text-[#10b981] font-bold">${costPerMin.toFixed(2)} / min</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="1.00"
              step="0.05"
              value={costPerMin}
              onChange={(e) => setCostPerMin(Number(e.target.value))}
              className="w-full h-2 bg-[#21293a] rounded-lg appearance-none cursor-pointer accent-[#10b981]"
            />
          </div>

        </div>

        {/* Results Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono">
          
          <div className="p-4 rounded-lg bg-[#090b0e] border border-[#21293a] space-y-1">
            <div className="text-[10px] text-[#8b9bb4] uppercase tracking-wider">Daily Token Waste</div>
            <div className="text-xl font-bold text-[#ff4d4d]">${totalDailyWaste.toFixed(2)}</div>
            <div className="text-[10px] text-[#8b9bb4] font-sans">Prevented automatically by Loopwatch</div>
          </div>

          <div className="p-4 rounded-lg bg-[#090b0e] border border-[#21293a] space-y-1">
            <div className="text-[10px] text-[#8b9bb4] uppercase tracking-wider">Dev Time Reclaimed</div>
            <div className="text-xl font-bold text-[#00f0ff]">{hoursReclaimed} Hours</div>
            <div className="text-[10px] text-[#8b9bb4] font-sans">Per month across team</div>
          </div>

          <div className="p-4 rounded-lg bg-[#090b0e] border border-[#10b981]/40 sm:col-span-2 space-y-2">
            <div className="flex items-center gap-2 text-[#10b981] text-xs font-bold uppercase">
              <ShieldCheck className="w-4 h-4" />
              <span>In-Process Guard Impact</span>
            </div>
            <p className="text-xs text-[#8b9bb4] font-sans leading-relaxed">
              Without Loopwatch, unmonitored background agent loops burn tokens continuously until hard timeouts. Loopwatch catches the spin at Step 5, stopping the bill instantly.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
