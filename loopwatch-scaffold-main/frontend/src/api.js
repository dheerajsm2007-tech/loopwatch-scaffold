export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';
export const POLL_INTERVAL_MS = Number(import.meta.env.VITE_POLL_INTERVAL_MS) || 1000;

export async function fetchRuns() {
  try {
    const res = await fetch(`${API_BASE}/api/runs`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Failed to fetch runs from backend:', err);
    return [];
  }
}

export async function fetchTrace(runId) {
  if (!runId) return null;
  try {
    const res = await fetch(`${API_BASE}/api/trace/${encodeURIComponent(runId)}`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`Failed to fetch trace for ${runId}:`, err);
    return null;
  }
}

export async function fetchWorkspaceFiles(runId) {
  const targetRunId = runId || 'default';
  try {
    const res = await fetch(`${API_BASE}/api/workspace/${encodeURIComponent(targetRunId)}/files`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`Failed to fetch workspace files for ${targetRunId}:`, err);
    return [];
  }
}

export async function fetchWorkspaceFile(runId, filePath) {
  if (!filePath) return null;
  const targetRunId = runId || 'default';
  try {
    const res = await fetch(`${API_BASE}/api/workspace/${encodeURIComponent(targetRunId)}/file?path=${encodeURIComponent(filePath)}`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`Failed to fetch file ${filePath} for ${targetRunId}:`, err);
    return null;
  }
}

export async function saveWorkspaceFile(runId, filePath, content) {
  if (!filePath) return { success: false, error: 'Missing filePath' };
  const targetRunId = runId || 'default';
  try {
    const res = await fetch(`${API_BASE}/api/workspace/${encodeURIComponent(targetRunId)}/file?path=${encodeURIComponent(filePath)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`Failed to save file ${filePath} for ${targetRunId}:`, err);
    return { success: false, error: err.message };
  }
}

export async function startAgentRun(prompt) {
  if (!prompt) return { error: 'Prompt is required' };
  try {
    const res = await fetch(`${API_BASE}/api/agent/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Failed to start agent run:', err);
    return { error: err.message };
  }
}

export async function fetchPresets() {
  try {
    const res = await fetch(`${API_BASE}/api/presets`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Failed to fetch presets:', err);
    return [];
  }
}
