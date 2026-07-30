import React from 'react';
import { TrendingDown, Activity, AlertCircle } from 'lucide-react';

export default function NoveltyChart({ steps = [], activeStepIndex = 0 }) {
  if (!steps || steps.length === 0) return null;

  const width = 600;
  const height = 180;
  const padding = 35;

  const points = steps.map((s, index) => {
    const x = padding + (index / Math.max(1, steps.length - 1)) * (width - padding * 2);
    const score = s.noveltyScore !== undefined ? s.noveltyScore : (s.novel ? 1.0 : (index === 0 ? 1.0 : 0.0));
    const y = height - padding - score * (height - padding * 2);
    return { x, y, score, step: s.step, status: s.status };
  });

  const pathD = points.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  // Fill area under path
  const areaD = points.length > 0 
    ? `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
    : '';

  return (
    <div className="bg-[#0e121a] border border-[#21293a] rounded-xl p-4 shadow-xl font-mono">
      
      <div className="flex items-center justify-between mb-3 text-xs">
        <div className="flex items-center gap-2 text-white font-semibold">
          <Activity className="w-4 h-4 text-[#00f0ff]" />
          <span>INFORMATION GAIN & NOVELTY CURVE</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-[#8b9bb4]">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00f0ff]" />
            Novelty Score
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff4d4d]" />
            Halt Threshold (5 Flat Steps)
          </span>
        </div>
      </div>

      {/* SVG Line Chart */}
      <div className="relative w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
          {/* Grid lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#21293a" strokeDasharray="4 4" />
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#21293a" strokeDasharray="4 4" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#21293a" />

          {/* Halt Danger Threshold Zone */}
          <rect
            x={padding}
            y={height - padding - 15}
            width={width - padding * 2}
            height={15}
            fill="rgba(255, 77, 77, 0.08)"
          />

          {/* Area Fill */}
          <path d={areaD} fill="url(#cyanGradient)" opacity="0.3" />

          {/* Gradient Definition */}
          <defs>
            <linearGradient id="cyanGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ff4d4d" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Main Novelty Curve Path */}
          <path d={pathD} fill="none" stroke="#00f0ff" strokeWidth="2.5" strokeLinecap="round" />

          {/* Data Points */}
          {points.map((pt) => {
            const isHalted = pt.status === 'halted';
            const isWarning = pt.status === 'warning';
            const isCurrent = activeStepIndex === pt.step;

            return (
              <g key={pt.step}>
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isCurrent ? 6 : isHalted ? 5 : 4}
                  fill={isHalted ? '#ff4d4d' : isWarning ? '#ff9900' : '#00f0ff'}
                  stroke="#090b0e"
                  strokeWidth="2"
                  className="transition-all"
                />
                {isCurrent && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="10"
                    fill="none"
                    stroke="#00f0ff"
                    strokeWidth="1.5"
                    className="animate-ping"
                  />
                )}
                {/* Step label on X-axis */}
                <text
                  x={pt.x}
                  y={height - 10}
                  fill="#8b9bb4"
                  fontSize="10"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  S{pt.step}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-2 text-[11px] text-[#8b9bb4] flex items-center justify-between border-t border-[#21293a] pt-2">
        <span className="flex items-center gap-1 text-[#ff4d4d]">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Flatline detected at Step 5 (Observation SHA256 & workspace_hash unchanged)</span>
        </span>
        <span>Window Size: 5 Steps</span>
      </div>

    </div>
  );
}
