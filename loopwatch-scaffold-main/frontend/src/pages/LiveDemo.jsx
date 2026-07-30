import React, { useState, useEffect } from 'react';
import { Activity, Play, Pause, RotateCcw, FastForward, AlertOctagon, CheckCircle2, ShieldAlert, Cpu, Database, RefreshCw, AlertTriangle, Folder } from 'lucide-react';
import { spinningTraceData, productiveTraceData, haltReasonText } from '../data/traceData';
import { fetchRuns, fetchTrace, API_BASE, POLL_INTERVAL_MS } from '../api';
import TraceViewer from '../components/TraceViewer';
import NoveltyChart from '../components/NoveltyChart';
import HaltBanner from '../components/HaltBanner';
import WorkspaceViewer from '../components/WorkspaceViewer';

export default function LiveDemo() {
  // Available runs from FastAPI backend
  const [apiRuns, setApiRuns] = useState([]);
  const [selectedRunId, setSelectedRunId] = useState('fixture_spinning'); // Default run ID
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  
  // Live API trace state
  const [apiTrace, setApiTrace] = useState(null);
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [backendError, setBackendError] = useState(null);

  // Connection & polling tracking
  const [lastPolledAt, setLastPolledAt] = useState(null);
  const [pollError, setPollError] = useState(null);
  const [now, setNow] = useState(Date.now());

  // Playback simulation state (works for both Backend API runs and Mock runs)
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1); // 1x, 2x, 5x

  const isMockRun = selectedRunId === 'mock_spinning' || selectedRunId === 'mock_productive';

  // Tick timer for stale status evaluation
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, []);

  // 1. Initial & periodic run-list fetching from backend
  useEffect(() => {
    let isMounted = true;

    async function loadRuns() {
      const runs = await fetchRuns();
      if (!isMounted) return;
      if (Array.isArray(runs) && runs.length > 0) {
        setApiRuns(runs);
      }
    }

    loadRuns();
    const runsInterval = setInterval(loadRuns, 3000);
    return () => {
      isMounted = false;
      clearInterval(runsInterval);
    };
  }, []);

  // 2. Poll GET /api/trace/{run_id} using POLL_INTERVAL_MS for live backend runs
  useEffect(() => {
    if (isMockRun || !selectedRunId) return;

    let isMounted = true;

    async function loadTrace() {
      setIsLoadingApi(true);
      try {
        const data = await fetchTrace(selectedRunId);
        if (!isMounted) return;
        setIsLoadingApi(false);
        if (data) {
          setApiTrace(data);
          setBackendError(null);
          setPollError(null);
          setLastPolledAt(Date.now());
        } else {
          const errMsg = `Lost connection to detector service — retrying…`;
          setBackendError(`Could not connect to backend at ${API_BASE}`);
          setPollError(errMsg);
        }
      } catch (err) {
        if (!isMounted) return;
        setIsLoadingApi(false);
        const errMsg = `Lost connection to detector service — retrying…`;
        setBackendError(`Could not connect to backend at ${API_BASE}`);
        setPollError(errMsg);
      }
    }

    loadTrace();
    const traceInterval = setInterval(loadTrace, POLL_INTERVAL_MS);

    return () => {
      isMounted = false;
      clearInterval(traceInterval);
    };
  }, [selectedRunId, isMockRun]);

  const [hasResumed, setHasResumed] = useState(false);

  // Reset step index when changing selected run
  useEffect(() => {
    setCurrentStepIndex(0);
    setIsPlaying(true);
    setHasResumed(false);
  }, [selectedRunId]);

  // Determine full dataset of step objects
  const mockDataset = selectedRunId === 'mock_productive' ? productiveTraceData : spinningTraceData;
  const allSteps = isMockRun ? mockDataset : (apiTrace?.steps || []);

  const verdict = apiTrace?.verdict || {};
  const verdictStep = verdict.halted_at_step !== null && verdict.halted_at_step !== undefined ? verdict.halted_at_step : (isMockRun ? 5 : null);
  const hasHalt = (isMockRun && selectedRunId === 'mock_spinning') || Boolean(verdict.should_halt);

  // 3. Playback timer loop
  useEffect(() => {
    if (!isPlaying || allSteps.length === 0) return;

    const intervalTime = 1200 / speed;
    const timer = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (hasHalt && verdictStep !== null && prev >= verdictStep && !hasResumed) {
          setIsPlaying(false);
          return prev;
        }
        if (prev < allSteps.length - 1) {
          return prev + 1;
        } else {
          setIsPlaying(false);
          return prev;
        }
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isPlaying, speed, allSteps.length, isMockRun, selectedRunId, hasResumed, verdictStep, hasHalt]);

  // Reset handler
  const handleReset = () => {
    setCurrentStepIndex(0);
    setIsPlaying(true);
    setHasResumed(false);
  };

  // Stale calculation (3 * POLL_INTERVAL_MS threshold)
  const isStale = Boolean(lastPolledAt && (now - lastPolledAt) > 3 * POLL_INTERVAL_MS);

  // Derive visible steps and verdict
  let isHalted = false;
  let haltReason = '';
  let haltDetector = '';
  let haltedAtStep = null;

  if (isMockRun) {
    isHalted = selectedRunId === 'mock_spinning' && currentStepIndex >= 5 && !hasResumed;
    haltedAtStep = 5;
    haltReason = haltReasonText;
    haltDetector = 'detector 4';
  } else if (apiTrace) {
    const verdict = apiTrace.verdict || {};
    const verdictStep = verdict.halted_at_step !== null && verdict.halted_at_step !== undefined ? verdict.halted_at_step : 4;
    isHalted = Boolean(verdict.should_halt) && currentStepIndex >= verdictStep && !hasResumed;
    haltReason = verdict.reason || '';
    haltDetector = verdict.detector || '';
    haltedAtStep = verdictStep;
  }

  const maxAllowedStepIndex = (isHalted && !hasResumed && haltedAtStep !== null) ? haltedAtStep : currentStepIndex;
  const visibleSteps = allSteps.slice(0, Math.min(currentStepIndex + 1, maxAllowedStepIndex + 1));
  const totalSpend = visibleSteps.reduce((sum, s) => sum + (s.cost_usd || 0), 0);

  const currentStepData = visibleSteps[visibleSteps.length - 1] || visibleSteps[0] || null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Replay & API Selection Control Bar */}
      <div className="bg-[#0e121a] border border-[#21293a] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono">
        
        {/* Run Selector Dropdown */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-[#8b9bb4]">
            <Database className="w-4 h-4 text-[#00f0ff]" />
            <span>Select Trace Run:</span>
          </div>

          <select
            value={selectedRunId}
            onChange={(e) => setSelectedRunId(e.target.value)}
            className="bg-[#090b0e] text-white text-xs font-mono px-3 py-2 rounded-lg border border-[#21293a] focus:outline-none focus:border-[#00f0ff] transition-all cursor-pointer"
          >
            <optgroup label="Live FastAPI Backend Runs (:8000)">
              {apiRuns.length > 0 ? (
                apiRuns.map((runId) => (
                  <option key={runId} value={runId}>
                    ⚡ {runId} (Live JSONL)
                  </option>
                ))
              ) : (
                <>
                  <option value="fixture_spinning">⚡ fixture_spinning (Backend)</option>
                  <option value="fixture_productive">⚡ fixture_productive (Backend)</option>
                </>
              )}
            </optgroup>

            <optgroup label="Offline Mock Demo Runs">
              <option value="mock_spinning">🎭 Mock Spinning Loop Run (Triggers Halt)</option>
              <option value="mock_productive">🎭 Mock Productive Refactor Run (Healthy)</option>
            </optgroup>
          </select>

          {/* Live / Stale / Error Connection Status Indicator */}
          {!isMockRun && (
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded border font-mono ${
                  pollError
                    ? 'text-[#ff4d4d] bg-[#ff4d4d]/10 border-[#ff4d4d]/30'
                    : isStale
                    ? 'text-[#ff9900] bg-[#ff9900]/10 border-[#ff9900]/30'
                    : 'text-[#10b981] bg-[#10b981]/10 border-[#10b981]/30'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    pollError
                      ? 'bg-[#ff4d4d]'
                      : isStale
                      ? 'bg-[#ff9900]'
                      : 'bg-[#10b981] animate-ping'
                  }`} />
                  <span>live</span>
                </span>

                {lastPolledAt && (
                  <span className="text-[11px] font-mono text-[#8b9bb4]">
                    last polled: {new Date(lastPolledAt).toTimeString().split(' ')[0]}
                  </span>
                )}
              </div>

              {backendError && (
                <span className="text-[10px] font-mono text-[#ff4d4d]">
                  Backend last error: {backendError}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Playback & Reset Controls */}
        <div className="flex items-center gap-3 self-end md:self-auto">
          <button
            onClick={() => setIsWorkspaceOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#00f0ff]/10 text-[#00f0ff] hover:bg-[#00f0ff]/20 border border-[#00f0ff]/30 text-xs font-mono transition-all cursor-pointer"
            title="Open Workspace Codebase Explorer Window"
          >
            <Folder className="w-4 h-4 text-[#00f0ff]" />
            <span>Browse Codebase</span>
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#00f0ff]/20 text-[#00f0ff] hover:bg-[#00f0ff]/30 border border-[#00f0ff]/40 text-xs font-bold transition-all cursor-pointer"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isPlaying ? 'Pause' : 'Play Trace'}</span>
          </button>

          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#141a26] text-[#8b9bb4] hover:text-[#00f0ff] border border-[#21293a] text-xs font-mono transition-all cursor-pointer"
            title="Reset Trace Playback to Step 0"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>

          <div className="flex items-center bg-[#090b0e] p-1 rounded-lg border border-[#21293a] text-xs text-[#8b9bb4]">
            {[1, 2, 5].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2 py-0.5 rounded cursor-pointer ${speed === s ? 'bg-[#21293a] text-white font-bold' : ''}`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Non-blocking Connection Loss Error Banner */}
      {pollError && (
        <div className="p-3.5 rounded-xl bg-[#ff4d4d]/10 border border-[#ff4d4d]/40 text-[#ff4d4d] font-mono text-xs flex items-center gap-3 shadow-lg">
          <AlertOctagon className="w-4 h-4 shrink-0 animate-pulse text-[#ff4d4d]" />
          <span>{pollError}</span>
        </div>
      )}

      {/* Spend & Telemetry Counters Header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
        
        <div className="p-4 rounded-xl bg-[#0e121a] border border-[#21293a]">
          <div className="text-[10px] text-[#8b9bb4] uppercase tracking-wider">Accumulated USD Cost</div>
          <div className={`text-2xl font-bold ${isHalted ? 'text-[#ff4d4d]' : 'text-white'}`}>
            ${totalSpend.toFixed(4)}
          </div>
          <div className="text-[10px] text-[#8b9bb4] mt-0.5">Real-time API token cost</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0e121a] border border-[#21293a]">
          <div className="text-[10px] text-[#8b9bb4] uppercase tracking-wider">Trace Playback</div>
          <div className="text-2xl font-bold text-[#00f0ff]">
            {visibleSteps.length} / {allSteps.length} Steps
          </div>
          <div className="text-[10px] text-[#8b9bb4] mt-0.5">Current step: #{currentStepData ? currentStepData.step : 0}</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0e121a] border border-[#21293a]">
          <div className="text-[10px] text-[#8b9bb4] uppercase tracking-wider">Novelty Signal</div>
          <div className={`text-2xl font-bold ${
            currentStepData && (currentStepData.novel === false || currentStepData.noveltyScore < 0.1) ? 'text-[#ff4d4d]' : 'text-[#10b981]'
          }`}>
            {currentStepData ? (currentStepData.novel === false ? '0% (Flat)' : '100% (Novel)') : 'N/A'}
          </div>
          <div className="text-[10px] text-[#8b9bb4] mt-0.5">Dual-signal calculation</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0e121a] border border-[#21293a]">
          <div className="text-[10px] text-[#8b9bb4] uppercase tracking-wider">Guard Status</div>
          <div className="text-sm font-bold flex items-center gap-1.5 mt-1">
            {isHalted ? (
              <span className="text-[#ff4d4d] flex items-center gap-1">
                <AlertOctagon className="w-4 h-4 animate-pulse" />
                HALTED AT STEP {haltedAtStep !== null && haltedAtStep !== undefined ? haltedAtStep : 4}
              </span>
            ) : (
              <span className="text-[#10b981] flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                PASSING / WATCHING
              </span>
            )}
          </div>
        </div>

      </div>

      {/* Empty State when a live run has 0 steps */}
      {!isMockRun && allSteps.length === 0 && (
        <div className="p-12 rounded-xl bg-[#0e121a] border border-[#21293a] text-center font-mono space-y-3">
          <RefreshCw className="w-8 h-8 text-[#00f0ff] animate-spin mx-auto" />
          <h3 className="text-lg font-bold text-white">Waiting for first step in trace run "{selectedRunId}"...</h3>
          <p className="text-xs text-[#8b9bb4] max-w-md mx-auto">
            Polling <code>/api/trace/{selectedRunId}</code> every {POLL_INTERVAL_MS}ms. Once the agent harness begins executing tool calls, steps will stream here live.
          </p>
        </div>
      )}

      {/* HALT BANNER (Triggers when should_halt is true at current playback step) */}
      <HaltBanner
        isHalted={isHalted}
        frozenSpend={totalSpend}
        reason={haltReason}
        detector={haltDetector}
        haltedAtStep={haltedAtStep}
        onReset={handleReset}
        onResume={() => {
          setHasResumed(true);
          setIsPlaying(true);
        }}
        onKill={() => {
          setIsPlaying(false);
        }}
      />

      {/* Completion Notification when agentic loop finishes */}
      {visibleSteps.length === allSteps.length && !isHalted && allSteps.length > 0 && (
        <div className="p-4 rounded-xl bg-[#10b981]/10 border-2 border-[#10b981]/50 text-[#10b981] font-mono text-xs flex items-center justify-between shadow-xl my-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#10b981]/20 border border-[#10b981]/40 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-[#10b981]" />
            </div>
            <div>
              <div className="font-bold text-sm text-white flex items-center gap-2">
                <span>🎉 AGENTIC LOOP COMPLETED</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40 uppercase font-mono">
                  SUCCESS
                </span>
              </div>
              <div className="text-[#8b9bb4] text-xs mt-0.5">
                All {allSteps.length} execution steps completed cleanly without guard halts. Total spend: ${totalSpend.toFixed(4)} USD.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Novelty Line Graph & Tool-Call Log Stream */}
      {visibleSteps.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Chart Column */}
          <div className="lg:col-span-6 space-y-6">
            <NoveltyChart steps={visibleSteps} activeStepIndex={currentStepData ? currentStepData.step : 0} />
          </div>

          {/* Trace Feed Column */}
          <div className="lg:col-span-6 space-y-6">
            <TraceViewer
              steps={visibleSteps}
              activeStepIndex={currentStepData ? currentStepData.step : 0}
              onStepSelect={(s) => {
                const targetIdx = visibleSteps.findIndex(st => st.step === s);
                if (targetIdx !== -1) setCurrentStepIndex(targetIdx);
              }}
            />
          </div>

        </div>
      )}

      {/* Separate Window: Workspace Codebase Explorer Modal */}
      <WorkspaceViewer
        isOpen={isWorkspaceOpen}
        onClose={() => setIsWorkspaceOpen(false)}
        selectedRunId={selectedRunId}
      />

    </div>
  );
}
