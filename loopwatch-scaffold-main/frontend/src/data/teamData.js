export const hackathonContext = {
  event: "FRONTIER 2026",
  organizer: "AWS Student Builder Groups",
  track: "Track 05 — AI Safety & Observability",
  project: "Loopwatch",
  tagline: "Autonomous step-by-step loop prevention guardrail for agentic software engineering."
};

export const teamMembers = [
  {
    name: "Person 1",
    role: "Harness & In-Process Guard Lead",
    avatar: "P1",
    responsibilities: [
      "Designed core agent harness execution loop & guard hook",
      "Built Trace Schema JSONL writer and real-time step streaming",
      "Implemented Detector 1 (Hard Caps) & Detector 2/3 (Repeat Filters)"
    ]
  },
  {
    name: "Person 2",
    role: "Progress Detection & Dashboard Lead",
    avatar: "P2",
    responsibilities: [
      "Engineered Detector 4 Information Gain & SHA-256 Observation Hashing",
      "Integrated workspace_hash Git state diffing to prevent false positives",
      "Developed live telemetry dashboard & interactive web application"
    ]
  },
  {
    name: "Person 3",
    role: "Evaluation & Benchmarking Lead",
    avatar: "P3",
    responsibilities: [
      "Created synthetic & SWE-bench evaluation corpus",
      "Established Catch Rate vs. False-Kill Rate evaluation framework",
      "Executed stress tests against slow build & high-turn refactoring agent runs"
    ]
  }
];

export const projectMilestones = [
  { hour: "Hour 2", title: "TRACE_SCHEMA.md Frozen", desc: "Strict JSONL contract established for all detectors, harness, and telemetry dashboard." },
  { hour: "Hour 6", title: "Detectors 1-3 & Fixture Replay", desc: "Hard caps and exact repeat detection smoke tests passing against synthetic trace fixtures." },
  { hour: "Hour 12", title: "First End-to-End Integration", desc: "Real agent harness feeding real traces into Detector 4 with live workspace hash diffing." },
  { hour: "Hour 16", title: "Demo Rehearsal", desc: "Scripted live-demo runs verified with real-time halt banner triggering." },
  { hour: "Hour 20", title: "Feature Freeze", desc: "Full code lockdown, benchmark validation, and documentation polishing." }
];
