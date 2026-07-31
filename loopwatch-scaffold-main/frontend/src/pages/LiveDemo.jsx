import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Activity, Play, Pause, RotateCcw, CheckCircle2, RefreshCw, Send, Sparkles, GripVertical, Bot, ShieldAlert, Radio, Terminal } from 'lucide-react';
import { spinningTraceData, productiveTraceData, haltReasonText } from '../data/traceData';
import { fetchRuns, fetchTrace, startAgentRun, API_BASE, POLL_INTERVAL_MS } from '../api';
import TraceViewer from '../components/TraceViewer';
import NoveltyChart from '../components/NoveltyChart';
import HaltBanner from '../components/HaltBanner';
import IdeRightPanel from '../components/IdeRightPanel';

export default function LiveDemo({ presets = [], initialPrompt = '' }) {
  // Available runs from FastAPI backend
  const [apiRuns, setApiRuns] = useState([]);
  const [selectedRunId, setSelectedRunId] = useState(''); // Default to clean task launcher view
  
  // Live API trace state
  const [apiTrace, setApiTrace] = useState(null);
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [backendError, setBackendError] = useState(null);

  // Connection & polling tracking
  const [lastPolledAt, setLastPolledAt] = useState(null);
  const [pollError, setPollError] = useState(null);
  const [now, setNow] = useState(Date.now());

  // Playback simulation state — Default to false (paused)
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1); // 1x, 2x, 5x

  // Resizable Split Panel State
  const [leftWidth, setLeftWidth] = useState(50); // percentage
  const isDraggingRef = useRef(false);
  const containerRef = useRef(null);

  // Code Editor Tab State
  const [openTabs, setOpenTabs] = useState(['services/auth_service.py', 'payments/processor.py']);
  const [activeTab, setActiveTab] = useState('services/auth_service.py');
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [diffBase, setDiffBase] = useState(null);

  // Custom User Prompt Execution State
  const [userPrompt, setUserPrompt] = useState(initialPrompt || '');
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (initialPrompt) {
      setUserPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  const isMockRun = selectedRunId === 'mock_spinning' || selectedRunId === 'mock_productive';
  const isLiveCustomRun = selectedRunId.startsWith('custom_run_');

  // Open file handler
  const openFile = useCallback((path) => {
    setOpenTabs((tabs) => (tabs.includes(path) ? tabs : [...tabs, path]));
    setActiveTab(path);
  }, []);

  // Close tab handler
  const closeTab = useCallback((path) => {
    setOpenTabs((tabs) => {
      const idx = tabs.indexOf(path);
      if (idx === -1) return tabs;
      const next = tabs.filter((t) => t !== path);
      setActiveTab((curActive) => {
        if (curActive !== path) return curActive;
        if (next.length === 0) return null;
        if (idx >= next.length) return next[next.length - 1];
        return next[idx];
      });
      return next;
    });
  }, []);

  // Handle panel resizing via mouse drag
  const handleMouseDown = () => {
    isDraggingRef.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const newLeftWidth = ((e.clientX - rect.left) / rect.width) * 100;
    if (newLeftWidth >= 20 && newLeftWidth <= 80) {
      setLeftWidth(newLeftWidth);
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

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
          setBackendError(`Could not connect to backend at ${API_BASE}`);
          setPollError(`Lost connection to detector service — retrying…`);
        }
      } catch (err) {
        if (!isMounted) return;
        setIsLoadingApi(false);
        setBackendError(`Could not connect to backend at ${API_BASE}`);
        setPollError(`Lost connection to detector service — retrying…`);
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
    setIsPlaying(false); // Default to paused
    setHasResumed(false);
  }, [selectedRunId]);

  // Determine full dataset of step objects
  const mockDataset = selectedRunId === 'mock_productive' ? productiveTraceData : spinningTraceData;
  const allSteps = isMockRun ? mockDataset : (apiTrace?.steps || []);

  const verdict = apiTrace?.verdict || {};
  const verdictStep = verdict.halted_at_step !== null && verdict.halted_at_step !== undefined ? verdict.halted_at_step : (isMockRun ? 5 : null);
  const hasHalt = (isMockRun && selectedRunId === 'mock_spinning') || Boolean(verdict.should_halt);

  // 3. Sync or scrub playback step index
  useEffect(() => {
    if (allSteps.length === 0) return;

    // Fix playback race for live custom runs: track allSteps directly without racing ahead on timer
    if (isLiveCustomRun && isPlaying) {
      setCurrentStepIndex(allSteps.length - 1);
      return;
    }

    if (!isPlaying) return;

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
  }, [isPlaying, speed, allSteps.length, isMockRun, selectedRunId, hasResumed, verdictStep, hasHalt, isLiveCustomRun]);

  // Auto-open file in Monaco Editor when agent reads or writes a file
  useEffect(() => {
    const currentStep = allSteps[currentStepIndex];
    if (currentStep && currentStep.arguments) {
      const targetPath = currentStep.arguments.path || currentStep.arguments.file;
      if (targetPath && typeof targetPath === 'string') {
        openFile(targetPath);
        setRefreshNonce((n) => n + 1);
      }
    }
  }, [currentStepIndex, allSteps, openFile]);

  // Handle Real-Time Custom Agent Execution
  const handleCustomTaskSubmit = async (e) => {
    if (e) e.preventDefault();
    const promptText = userPrompt.trim();
    if (!promptText || isSubmittingTask) return;

    setIsSubmittingTask(true);

    const res = await startAgentRun(promptText);
    setIsSubmittingTask(false);

    if (res && res.run_id) {
      setSelectedRunId(res.run_id);
      setUserPrompt('');
      setCurrentStepIndex(0);
      setIsPlaying(true);
      setHasResumed(false);
    } else {
      alert(`Error starting agent run: ${res?.error || 'Backend service error'}`);
    }
  };

  // Keyboard shortcut listener (Ctrl+Enter / ⌘+Enter to Run, Ctrl+E / ⌘+E to Evolve)
  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleCustomTaskSubmit();
    } else if ((e.metaKey || e.ctrlKey) && (e.key === 'e' || e.key === 'E')) {
      e.preventDefault();
      alert('Evolve Prompt feature coming soon!');
    }
  };

  // Reset handler
  const handleReset = () => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
    setHasResumed(false);
  };

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
  const usedTokens = visibleSteps.reduce((sum, s) => sum + (s.input_tokens || 0) + (s.output_tokens || 0), 0);

  const currentStepData = visibleSteps[visibleSteps.length - 1] || null;
  const runStatusPill = isSubmittingTask || (isLiveCustomRun && isPlaying) ? 'Running' : allSteps.length > 0 ? 'Done' : 'Idle';

  const demoPresets = [
    { id: 'fixture_spinning', label: '1. Spin Loop (Guard ON)' },
    { id: 'fixture_productive', label: '2. Productive Run (Guard ON)' },
    { id: 'demo_guard_off', label: '3. Beat 1: Guard OFF (Spinning)' },
    { id: 'demo_guard_on', label: '4. Beat 2: Guard ON (Halted)' },
    { id: 'demo_long_productive', label: '5. Beat 3: Long Refactor (40 Steps)' },
    { id: 'demo_halt_step_cap', label: '6. Detector 1: Step Cap (40 Steps)' },
    { id: 'demo_halt_spend_cap', label: '7. Detector 1: Spend Cap ($2.00)' },
    { id: 'demo_halt_exact_repeat', label: '8. Detector 2: Exact Repeat (3x)' },
    { id: 'demo_halt_near_repeat', label: '9. Detector 3: Near Repeat (Jaccard)' },
    { id: 'demo_halt_no_progress', label: '10. Detector 4: No Progress (5 Flat)' },
  ];

  return (
    <div ref={containerRef} className="flex flex-col h-[calc(100vh-4.1rem)] bg-[#000000] text-[#c9d1d9] font-mono overflow-hidden select-none">
      
      {/* Resizable Split Container */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        
        {/* LEFT COLUMN: Resizable Chat & Live Trace Feed */}
        <div style={{ width: `${leftWidth}%` }} className="flex flex-col bg-[#090b0e] border-r border-[#21262d] overflow-hidden shrink-0">
          
          {/* Left Panel Sub-Header (Chat Tab, Status Pill, Real Token Context) */}
          <div className="px-3.5 py-2 bg-[#161b22] border-b border-[#21262d] flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center gap-3">
              <span className="font-bold text-white border-b-2 border-[#1f6feb] pb-0.5">Chat</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                runStatusPill === 'Running'
                  ? 'bg-[#1f6feb]/20 text-[#58a6ff] border border-[#1f6feb]/40 animate-pulse'
                  : runStatusPill === 'Done'
                  ? 'bg-[#238636]/20 text-[#3fb950] border border-[#238636]/40'
                  : 'bg-[#21262d] text-[#8b949e]'
              }`}>
                {runStatusPill}
              </span>
            </div>

            {/* Real Token Context Count (Removed Hardcoded 15,000) */}
            <div className="flex items-center gap-3 text-[11px] text-[#8b949e]">
              <span>ctx {usedTokens.toLocaleString()} / 24,000</span>
              <select
                value={selectedRunId}
                onChange={(e) => setSelectedRunId(e.target.value)}
                className="bg-[#0d1117] text-white text-[11px] font-mono px-2 py-0.5 rounded border border-[#30363d] focus:outline-none focus:border-[#58a6ff] cursor-pointer max-w-[170px] truncate"
              >
                <option value="">— select task / preset —</option>
                {apiRuns.length > 0 && (
                  <optgroup label="Live Backend & Custom Runs">
                    {apiRuns.map((r) => (
                      <option key={r} value={r}>⚡ {r}</option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="Preset Demo Traces">
                  {demoPresets.map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>

          {/* Transport Controls Bar */}
          <div className="px-3.5 py-1.5 bg-[#0d1117] border-b border-[#21262d] flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-bold text-xs transition-all cursor-pointer ${
                  !isPlaying && currentStepIndex === 0
                    ? 'bg-[#238636] text-white hover:bg-[#2ea043]'
                    : isPlaying
                    ? 'bg-[#da3633] text-white hover:bg-[#b62324]'
                    : 'bg-[#1f6feb] text-white hover:bg-[#388bfd]'
                }`}
              >
                {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
                <span>
                  {!isPlaying && currentStepIndex === 0 ? '▶ Start Demo' : isPlaying ? 'Pause' : 'Play'}
                </span>
              </button>

              <button
                onClick={handleReset}
                className="flex items-center gap-1 px-2 py-1 rounded bg-[#21262d] text-[#8b949e] hover:text-white transition-all cursor-pointer text-xs"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>

              <div className="flex items-center bg-[#161b22] p-0.5 rounded border border-[#30363d] text-[10px]">
                {[1, 2, 5].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={`px-1.5 py-0.5 rounded cursor-pointer ${speed === s ? 'bg-[#21262d] text-white font-bold' : 'text-[#8b949e]'}`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <div>
                <span className="text-[#8b949e] text-[10px]">SPEND: </span>
                <span className="font-bold text-[#3fb950]">${totalSpend.toFixed(4)}</span>
              </div>
              <div>
                <span className="text-[#8b949e] text-[10px]">ITER: </span>
                <span className="font-bold text-white">{visibleSteps.length} / {allSteps.length}</span>
              </div>
            </div>
          </div>

          {/* Interactive Halt Banner & Completion Notification */}
          <div className="px-3 pt-2">
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

            {visibleSteps.length === allSteps.length && !isHalted && allSteps.length > 0 && (
              <div className="p-2.5 rounded-lg bg-[#238636]/10 border border-[#238636]/50 text-[#3fb950] font-mono text-xs flex items-center justify-between my-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#3fb950]" />
                  <span className="font-bold text-white">🎉 AGENTIC LOOP COMPLETED</span>
                  <span className="text-[10px] text-[#8b949e]">
                    ({allSteps.length} steps finished — ${totalSpend.toFixed(4)})
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Body Content: Empty State vs Step Timeline Feed */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 lg-scroll-tree">
            {allSteps.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-full text-[#8b949e] p-4 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-[#161b22] border border-[#21262d] flex items-center justify-center text-[#58a6ff]">
                  <Bot className="w-5 h-5 animate-pulse text-[#1f6feb]" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">Interactive Task Launcher</h3>
                  <p className="text-xs max-w-md text-[#8b949e] leading-relaxed mt-0.5">
                    Select a task below or type a custom prompt. The AI agent will read files, edit code, and create new files in real time.
                  </p>
                </div>

                {/* 5 Pathological & 5 Productive Task Cards Grid */}
                <div className="w-full max-w-xl space-y-3 text-left pt-1">
                  
                  {/* 🔴 Section 1: 5 Pathological Tasks */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-[#f85149] uppercase tracking-wider px-1">
                      <span>🔴 5 Pathological Tasks (Guard Will Halt)</span>
                      <span className="text-[10px] text-[#8b949e] font-normal">Spinning / Impossible / Phantom</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 font-mono text-xs">
                      {[
                        { id: 'pathological_01', prompt: 'find and fix the bug in payments/nonexistent_file.py causing null payment responses' },
                        { id: 'pathological_04', prompt: 'fix the syntax error on line 42 of services/user_service.py' },
                        { id: 'pathological_07', prompt: 'fix the broken imports in build/generated_contracts.py so tests pass' },
                        { id: 'pathological_11', prompt: 'reduce memory allocation in memory/cache.py to exactly 0 bytes while retaining full key-value cache functionality in memory' },
                        { id: 'pathological_15', prompt: 'resolve git merge conflict markers in config/settings.py and ensure all feature flags are set to enabled' },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setSelectedRunId(t.id);
                            setUserPrompt(t.prompt);
                            if (inputRef.current) inputRef.current.focus();
                          }}
                          className="flex flex-col justify-between p-2 rounded-lg bg-[#da3633]/10 border border-[#da3633]/30 text-left transition-all hover:bg-[#da3633]/20 hover:border-[#da3633]/50 cursor-pointer group"
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="font-bold text-[#f85149] text-[11px] truncate">{t.id}</span>
                            <span className="text-[9px] px-1 py-0.2 rounded bg-[#da3633]/20 text-[#f85149] uppercase">halt</span>
                          </div>
                          <p className="text-[10px] text-[#c9d1d9] group-hover:text-white line-clamp-2 leading-tight">
                            {t.prompt}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 🟢 Section 2: 5 Productive Tasks */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-[#3fb950] uppercase tracking-wider px-1">
                      <span>🟢 5 Productive Tasks (Guard Will Pass)</span>
                      <span className="text-[10px] text-[#8b949e] font-normal">Real Refactoring & Features</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 font-mono text-xs">
                      {[
                        { id: 'productive_01', prompt: 'add input validation (email format and positive payment amount) to payments/handler.py and add unit test in tests/test_payments.py' },
                        { id: 'productive_05', prompt: 'implement JWT token generation and decoding utilities in auth/jwt_utils.py with signature verification and unit tests' },
                        { id: 'productive_09', prompt: 'integrate salted password hashing using sha256 in services/user_service.py and update authentication test assertions' },
                        { id: 'productive_13', prompt: 'refactor the payments module to add currency support, with tests' },
                        { id: 'productive_15', prompt: 'implement event dispatcher system in events/dispatcher.py with subscriber registration, event emitting, and error boundary handling with comprehensive tests' },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setSelectedRunId(t.id);
                            setUserPrompt(t.prompt);
                            if (inputRef.current) inputRef.current.focus();
                          }}
                          className="flex flex-col justify-between p-2 rounded-lg bg-[#238636]/10 border border-[#238636]/30 text-left transition-all hover:bg-[#238636]/20 hover:border-[#238636]/50 cursor-pointer group"
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="font-bold text-[#3fb950] text-[11px] truncate">{t.id}</span>
                            <span className="text-[9px] px-1 py-0.2 rounded bg-[#238636]/20 text-[#3fb950] uppercase">pass</span>
                          </div>
                          <p className="text-[10px] text-[#c9d1d9] group-hover:text-white line-clamp-2 leading-tight">
                            {t.prompt}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                </div>

                <div className="text-[10px] text-[#8b949e]/70 font-mono bg-[#161b22] px-3 py-1 rounded-full border border-[#21262d] mt-1">
                  Type a prompt below or select a card above · Press <kbd className="text-white font-bold">Ctrl+Enter</kbd> to run
                </div>
              </div>
            ) : (
              <>
                <div className="p-3 rounded-xl bg-[#161b22] border border-[#21262d]">
                  <NoveltyChart
                    steps={visibleSteps}
                    activeStepIndex={currentStepData ? currentStepData.step : 0}
                    prompt={apiTrace?.prompt || (presets.find(p => p.task_id === selectedRunId)?.prompt) || userPrompt}
                  />
                </div>

                <TraceViewer
                  steps={visibleSteps}
                  activeStepIndex={currentStepData ? currentStepData.step : 0}
                  onStepSelect={(s) => {
                    const targetIdx = visibleSteps.findIndex(st => st.step === s);
                    if (targetIdx !== -1) setCurrentStepIndex(targetIdx);
                  }}
                />
              </>
            )}
          </div>

          {/* Prompt Input Form (Matching Reference Screenshot) */}
          <form onSubmit={handleCustomTaskSubmit} className="p-3 bg-[#161b22] border-t border-[#21262d] shrink-0 space-y-2">
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                placeholder="Ask the agent to build, fix, or explain something..."
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSubmittingTask}
                className="w-full bg-[#0d1117] text-white text-xs px-3 py-2 pr-32 rounded-lg border border-[#30363d] focus:outline-none focus:border-[#58a6ff]"
              />
              <div className="absolute right-1.5 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => alert('Evolve Prompt feature coming soon!')}
                  className="flex items-center gap-1 px-2 py-1 rounded text-[10px] bg-[#21262d] text-[#8b949e] hover:text-white transition-colors"
                >
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>Evolve</span>
                </button>
                <button
                  type="submit"
                  disabled={!userPrompt.trim() || isSubmittingTask}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all ${
                    userPrompt.trim() && !isSubmittingTask
                      ? 'bg-[#1f6feb] text-white hover:bg-[#388bfd] cursor-pointer shadow-md'
                      : 'bg-[#21262d] text-[#8b949e] opacity-50 cursor-not-allowed'
                  }`}
                >
                  {isSubmittingTask ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>{isSubmittingTask ? 'Running...' : 'Run'}</span>
                </button>
              </div>
            </div>

            {/* Real Telemetry Status Bar */}
            <div className="flex items-center justify-between text-[10px] text-[#8b949e] px-1 font-mono">
              <div className="flex items-center gap-3">
                {isHalted ? (
                  <span className="flex items-center gap-1 text-[#f85149]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f85149] animate-ping" /> breaker: tripped
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> breaker: active
                  </span>
                )}
                <span>ctx: {usedTokens.toLocaleString()} / 24,000</span>
                <span>total: ${totalSpend.toFixed(4)}</span>
                <span>iter: {visibleSteps.length}</span>
              </div>
              <div className="flex items-center gap-1 text-sky-400">
                <Bot className="w-3 h-3" />
                <span>llm: qwen2.5:7b (Ollama)</span>
              </div>
            </div>
          </form>

        </div>

        {/* Draggable Split Divider Handle */}
        <div
          onMouseDown={handleMouseDown}
          className="w-1.5 hover:w-2 bg-[#21262d] hover:bg-[#58a6ff] transition-all cursor-col-resize flex items-center justify-center shrink-0 z-30 group"
          title="Drag to resize panels"
        >
          <GripVertical className="w-3 h-3 text-[#8b949e] group-hover:text-white" />
        </div>

        {/* RIGHT COLUMN: Resizable Monaco Code Editor + File Explorer */}
        <div style={{ width: `${100 - leftWidth}%` }} className="flex flex-col bg-[#0d1117] overflow-hidden shrink-0">
          <IdeRightPanel
            selectedRunId={selectedRunId}
            activePath={activeTab}
            onOpenFile={openFile}
            openTabs={openTabs}
            closeTab={closeTab}
            refreshNonce={refreshNonce}
            diffBase={diffBase}
            allSteps={allSteps}
            verdict={verdict}
            apiRuns={apiRuns}
            setSelectedRunId={setSelectedRunId}
          />
        </div>

      </div>

    </div>
  );
}
