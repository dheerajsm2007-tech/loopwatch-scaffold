import React, { useState, useEffect } from 'react';
import { AlertTriangle, OctagonAlert, Play, Square, DollarSign, CheckCircle2, RotateCcw } from 'lucide-react';
import { haltReasonText } from '../data/traceData';

export default function HaltBanner({ frozenSpend = 0.0361, onReset, onResume, onKill, isHalted = true, reason, detector, haltedAtStep }) {
  const [actionTaken, setActionTaken] = useState(null);
  const [isKilled, setIsKilled] = useState(false);

  // Reset internal action toast whenever changing trace runs or reason props
  useEffect(() => {
    setActionTaken(null);
    setIsKilled(false);
  }, [reason, detector, haltedAtStep, isHalted]);

  if (!isHalted && !actionTaken) return null;

  const displayReason = reason || haltReasonText;
  const displayDetector = detector ? detector.toUpperCase() : 'DETECTOR 4';
  const displayStep = haltedAtStep !== undefined && haltedAtStep !== null ? haltedAtStep : 5;

  return (
    <div className="w-full bg-[#160c10] border-2 border-[#ff4d4d] rounded-xl p-5 sm:p-6 shadow-2xl glow-crimson relative overflow-hidden my-6">
      
      {/* Background Accent Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#ff4d4d]/10 rounded-full filter blur-3xl pointer-events-none" />

      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#ff4d4d]/30 relative z-10">
        
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#ff4d4d]/20 border border-[#ff4d4d]/50 flex items-center justify-center shrink-0 animate-bounce">
            <OctagonAlert className="w-6 h-6 text-[#ff4d4d]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-lg tracking-wider text-[#ff4d4d] uppercase">
                [AGENT RUN HALTED]
              </span>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#ff4d4d]/20 text-[#ff4d4d] border border-[#ff4d4d]/40 uppercase">
                {displayDetector} TRIGGERED
              </span>
            </div>
            <p className="text-xs text-[#8b9bb4] font-mono mt-0.5">
              Autonomous safety stop activated at Step {displayStep}. No token budget consumed since trigger.
            </p>
          </div>
        </div>

        {/* Frozen Spend Badge */}
        <div className="flex items-center gap-4 bg-[#090b0e]/80 px-4 py-2 rounded-lg border border-[#ff4d4d]/40 self-start md:self-auto">
          <div>
            <div className="text-[10px] font-mono text-[#8b9bb4] uppercase tracking-wider">Spend Frozen At</div>
            <div className="font-mono text-xl font-bold text-white flex items-center gap-1">
              <span className="text-[#ff4d4d]">$</span>
              <span>{frozenSpend.toFixed(4)}</span>
              <span className="text-xs font-normal text-[#8b9bb4] font-sans">USD</span>
            </div>
          </div>
          <div className="h-8 w-[1px] bg-[#ff4d4d]/30" />
          <div className="text-right">
            <div className="text-[10px] font-mono text-[#10b981] uppercase tracking-wider">Unnecessary Spend Saved</div>
            <div className="font-mono text-sm font-semibold text-[#10b981]">~$14.20</div>
          </div>
        </div>

      </div>

      {/* Diagnostic Explanation Box */}
      <div className="mt-4 p-4 rounded-lg bg-[#090b0e]/90 border border-[#ff4d4d]/30 font-mono text-xs text-[#f1f5f9] leading-relaxed relative z-10">
        <div className="flex items-center gap-2 text-[#ff4d4d] font-semibold uppercase text-[11px] mb-1.5 tracking-wider">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Trigger Reason & Signal Analysis</span>
        </div>
        <p className="text-[#8b9bb4]">{displayReason}</p>
      </div>

      {/* Action Notification Toast */}
      {actionTaken && (
        <div className={`mt-4 p-3 rounded-lg border font-mono text-xs flex items-center gap-2 ${
          isKilled
            ? 'bg-[#ff4d4d]/20 border-[#ff4d4d]/50 text-[#ff4d4d]'
            : 'bg-[#10b981]/20 border-[#10b981]/50 text-[#10b981]'
        }`}>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Action executed: <strong>{actionTaken}</strong>.</span>
        </div>
      )}

      {/* Interactive Action Buttons */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 relative z-10 pt-2">
        <div className="flex flex-wrap items-center gap-2">
          
          <button
            disabled={isKilled}
            onClick={() => {
              if (isKilled) return;
              setActionTaken('Resume Run (Override Signal)');
              if (onResume) onResume();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs font-semibold border transition-all ${
              isKilled
                ? 'bg-gray-800/40 text-gray-500 border-gray-700/40 cursor-not-allowed opacity-50'
                : 'bg-[#141a26] text-white hover:bg-[#21293a] border-[#313d54] hover:border-[#00f0ff] cursor-pointer'
            }`}
          >
            <Play className="w-3.5 h-3.5 text-[#00f0ff]" />
            <span>{isKilled ? 'Process Terminated' : 'Resume Run'}</span>
          </button>

          <button
            disabled={isKilled}
            onClick={() => {
              setIsKilled(true);
              setActionTaken('Process Killed (SIGTERM) — Resume disabled');
              if (onKill) onKill();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs font-semibold border transition-all ${
              isKilled
                ? 'bg-[#ff4d4d]/40 text-white border-[#ff4d4d] cursor-not-allowed'
                : 'bg-[#ff4d4d]/20 text-[#ff4d4d] hover:bg-[#ff4d4d]/30 border-[#ff4d4d]/50 cursor-pointer'
            }`}
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>{isKilled ? 'Process Killed' : 'Kill Process'}</span>
          </button>

          <button
            disabled={isKilled}
            onClick={() => {
              if (isKilled) return;
              setActionTaken('Budget Raised (+$5.00) — Budget cap increased, resuming task');
              if (onResume) onResume();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs font-semibold border transition-all ${
              isKilled
                ? 'bg-gray-800/40 text-gray-500 border-gray-700/40 cursor-not-allowed opacity-50'
                : 'bg-[#ff9900]/20 text-[#ff9900] hover:bg-[#ff9900]/30 border-[#ff9900]/50 cursor-pointer'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Raise Budget (+$5.00)</span>
          </button>

        </div>

        {onReset && (
          <button
            onClick={() => {
              setActionTaken(null);
              setIsKilled(false);
              onReset();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono text-[#8b9bb4] hover:text-[#00f0ff] hover:bg-[#141a26] border border-[#21293a] transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Trace</span>
          </button>
        )}
      </div>

    </div>
  );
}
