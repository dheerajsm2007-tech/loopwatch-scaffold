// Trace Data adhering strictly to TRACE_SCHEMA.md:
// { run_id, step, timestamp, tool, arguments, observation, input_tokens, output_tokens, cost_usd, workspace_hash }

export const spinningTraceData = [
  {
    run_id: "run_2026-07-30_spinning_001",
    step: 0,
    timestamp: "2026-07-30T14:00:01Z",
    tool: "search",
    arguments: { query: "find database connection pool configuration in src/" },
    observation: "Found 0 matching patterns for 'database connection pool' in /src",
    input_tokens: 1250,
    output_tokens: 180,
    cost_usd: 0.0042,
    workspace_hash: "a1b2c3d4e5f67890123456789abcdef0",
    noveltyScore: 1.0,
    status: "normal"
  },
  {
    run_id: "run_2026-07-30_spinning_001",
    step: 1,
    timestamp: "2026-07-30T14:00:15Z",
    tool: "read_file",
    arguments: { path: "src/config/database.ts" },
    observation: "Error: ENOENT file not found src/config/database.ts",
    input_tokens: 1320,
    output_tokens: 145,
    cost_usd: 0.0084,
    workspace_hash: "a1b2c3d4e5f67890123456789abcdef0",
    noveltyScore: 0.85,
    status: "normal"
  },
  {
    run_id: "run_2026-07-30_spinning_001",
    step: 2,
    timestamp: "2026-07-30T14:00:28Z",
    tool: "search",
    arguments: { query: "database config" },
    observation: "Found 0 matching patterns for 'database config' in /src",
    input_tokens: 1410,
    output_tokens: 190,
    cost_usd: 0.0131,
    workspace_hash: "a1b2c3d4e5f67890123456789abcdef0",
    noveltyScore: 0.70,
    status: "normal"
  },
  {
    run_id: "run_2026-07-30_spinning_001",
    step: 3,
    timestamp: "2026-07-30T14:00:42Z",
    tool: "search",
    arguments: { query: "find database connection pool configuration in src/" },
    observation: "Found 0 matching patterns for 'database connection pool' in /src",
    input_tokens: 1530,
    output_tokens: 210,
    cost_usd: 0.0182,
    workspace_hash: "a1b2c3d4e5f67890123456789abcdef0",
    noveltyScore: 0.15,
    status: "warning"
  },
  {
    run_id: "run_2026-07-30_spinning_001",
    step: 4,
    timestamp: "2026-07-30T14:00:55Z",
    tool: "search",
    arguments: { query: "find database connection pool configuration in src/" },
    observation: "Found 0 matching patterns for 'database connection pool' in /src",
    input_tokens: 1640,
    output_tokens: 220,
    cost_usd: 0.0238,
    workspace_hash: "a1b2c3d4e5f67890123456789abcdef0",
    noveltyScore: 0.02,
    status: "warning"
  },
  {
    run_id: "run_2026-07-30_spinning_001",
    step: 5,
    timestamp: "2026-07-30T14:01:10Z",
    tool: "search",
    arguments: { query: "find database connection pool configuration in src/" },
    observation: "Found 0 matching patterns for 'database connection pool' in /src",
    input_tokens: 1750,
    output_tokens: 230,
    cost_usd: 0.0298,
    workspace_hash: "a1b2c3d4e5f67890123456789abcdef0",
    noveltyScore: 0.00,
    status: "halted"
  },
  {
    run_id: "run_2026-07-30_spinning_001",
    step: 6,
    timestamp: "2026-07-30T14:01:25Z",
    tool: "search",
    arguments: { query: "find database connection pool configuration in src/" },
    observation: "Found 0 matching patterns for 'database connection pool' in /src",
    input_tokens: 1860,
    output_tokens: 240,
    cost_usd: 0.0361,
    workspace_hash: "a1b2c3d4e5f67890123456789abcdef0",
    noveltyScore: 0.00,
    status: "halted"
  },
  {
    run_id: "run_2026-07-30_spinning_001",
    step: 7,
    timestamp: "2026-07-30T14:01:40Z",
    tool: "search",
    arguments: { query: "find database connection pool configuration in src/" },
    observation: "Found 0 matching patterns for 'database connection pool' in /src",
    input_tokens: 1970,
    output_tokens: 250,
    cost_usd: 0.0428,
    workspace_hash: "a1b2c3d4e5f67890123456789abcdef0",
    noveltyScore: 0.00,
    status: "halted"
  }
];

export const productiveTraceData = [
  {
    run_id: "run_2026-07-30_productive_002",
    step: 0,
    timestamp: "2026-07-30T10:15:00Z",
    tool: "search",
    arguments: { query: "auth middleware tokens" },
    observation: "Matches found in server/auth/jwt.py, server/routes/user.py",
    input_tokens: 940,
    output_tokens: 110,
    cost_usd: 0.0031,
    workspace_hash: "e9f8a7b6c5d4e3f2a1b09876543210fe",
    noveltyScore: 1.0,
    status: "normal"
  },
  {
    run_id: "run_2026-07-30_productive_002",
    step: 1,
    timestamp: "2026-07-30T10:15:12Z",
    tool: "read_file",
    arguments: { path: "server/auth/jwt.py" },
    observation: "def verify_token(header):\n  token = header.split(' ')[1]\n  return jwt.decode(token, SECRET)",
    input_tokens: 1420,
    output_tokens: 230,
    cost_usd: 0.0078,
    workspace_hash: "e9f8a7b6c5d4e3f2a1b09876543210fe",
    noveltyScore: 0.95,
    status: "normal"
  },
  {
    run_id: "run_2026-07-30_productive_002",
    step: 2,
    timestamp: "2026-07-30T10:15:30Z",
    tool: "write_file",
    arguments: { path: "server/auth/jwt.py", content: "# Added bearer token validation fallback" },
    observation: "File updated: 14 lines added, 2 lines modified",
    input_tokens: 1890,
    output_tokens: 380,
    cost_usd: 0.0145,
    workspace_hash: "77aa88bb99cc00dd11ee22ff33aa44bb",
    noveltyScore: 0.98,
    status: "normal"
  },
  {
    run_id: "run_2026-07-30_productive_002",
    step: 3,
    timestamp: "2026-07-30T10:15:48Z",
    tool: "think",
    arguments: { thought: "Now running pytest to check auth module verification tests" },
    observation: "Planning test suite execution...",
    input_tokens: 2100,
    output_tokens: 120,
    cost_usd: 0.0210,
    workspace_hash: "77aa88bb99cc00dd11ee22ff33aa44bb",
    noveltyScore: 0.88,
    status: "normal"
  },
  {
    run_id: "run_2026-07-30_productive_002",
    step: 4,
    timestamp: "2026-07-30T10:16:05Z",
    tool: "read_file",
    arguments: { path: "tests/test_auth.py" },
    observation: "pytest server/tests/test_auth.py -> 12 passed in 0.42s",
    input_tokens: 2450,
    output_tokens: 180,
    cost_usd: 0.0285,
    workspace_hash: "77aa88bb99cc00dd11ee22ff33aa44bb",
    noveltyScore: 0.92,
    status: "normal"
  }
];

export const haltReasonText = `no new information in the last 5 steps: 4 of those steps repeated the prior observation text and 4 saw no workspace change. Progress requires either a new observation the agent has not read before, or the workspace actually changing (workspace_hash differing from the previous step).`;
