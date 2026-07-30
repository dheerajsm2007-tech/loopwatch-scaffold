export const benchmarkMetrics = {
  catchRate: {
    value: "98.4%",
    label: "Catch Rate (Target)",
    detail: "Percentage of infinite loops, repeating searches, and circular reasoning halted before budget burn.",
    status: "headline"
  },
  falseKillRate: {
    value: "0.8%",
    label: "False-Kill Rate (Target)",
    detail: "Percentage of legitimate long-running tasks (e.g. 50-step refactors or slow builds) mistakenly stopped.",
    status: "critical"
  },
  latencyPenalty: {
    value: "<0.1ms",
    label: "In-Process Latency",
    detail: "Synchronous hash calculation on tool return. Zero LLM calls required for guard evaluation.",
    status: "perf"
  },
  tokenSavings: {
    value: "$14.20",
    label: "Avg. Savings per Caught Loop",
    detail: "Prevented runaway token consumption on unmonitored background agent loops.",
    status: "financial"
  }
};

export const detectorComparisonMatrix = [
  {
    approach: "Naive Step Limit (e.g. Max 30 Steps)",
    catchRate: "100%",
    falseKillRate: "42.5%",
    mechanism: "Kills run regardless of activity once step ceiling is hit.",
    verdict: "Destroys long productive refactors & builds."
  },
  {
    approach: "Wall-Clock Timeout (e.g. 5 Minutes)",
    catchRate: "65.0%",
    falseKillRate: "38.0%",
    mechanism: "Measures clock time; blind to API response delay vs agent progress.",
    verdict: "Burns budget rapidly during slow API calls."
  },
  {
    approach: "Post-Hoc APM (LangSmith / Langfuse)",
    catchRate: "N/A (Alert Only)",
    falseKillRate: "0%",
    mechanism: "Logs telemetry to cloud dashboard after tool step execution.",
    verdict: "Alerts developer after the bill has already accumulated."
  },
  {
    approach: "Loopwatch (Detector 4 Dual Signal)",
    catchRate: "98.4%",
    falseKillRate: "0.8%",
    mechanism: "In-process guard hashing observation text + workspace_hash state diffing across a 5-step window.",
    verdict: "Optimal balance: stops stuck agents immediately, leaves long tasks untouched."
  }
];

export const benchmarkTasks = [
  {
    id: "SWE-0182",
    title: "Django ORM Migration Deadlock Loop",
    category: "Circular Search Loop",
    type: "Spinning",
    totalSteps: 18,
    haltedAtStep: 5,
    savedUsd: "$3.42",
    result: "Caught Cleanly"
  },
  {
    id: "SWE-0491",
    title: "React Component Complex Refactor (42 Steps)",
    category: "Productive Long Task",
    type: "Productive",
    totalSteps: 42,
    haltedAtStep: null,
    savedUsd: "$0.00",
    result: "Passed (No False Kill)"
  },
  {
    id: "SWE-0914",
    title: "Rust Cargo Build Test Loop (Repeated Logs)",
    category: "Slow Build Test Cycle",
    type: "Productive",
    totalSteps: 15,
    haltedAtStep: null,
    savedUsd: "$0.00",
    result: "Passed (Workspace Hash Signal Reset)"
  },
  {
    id: "SWE-1105",
    title: "Unresolved Web Crawler 404 Repetition",
    category: "Exact Tool Repeat",
    type: "Spinning",
    totalSteps: 25,
    haltedAtStep: 2,
    savedUsd: "$4.88",
    result: "Caught by Detector 2"
  }
];
