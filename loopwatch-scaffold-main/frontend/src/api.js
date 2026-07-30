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
  if (!runId) return [];
  try {
    const res = await fetch(`${API_BASE}/api/workspace/${encodeURIComponent(runId)}/files`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`Failed to fetch workspace files for ${runId}:`, err);
    return [];
  }
}

export async function fetchWorkspaceFile(runId, filePath) {
  if (!runId || !filePath) return null;
  try {
    const res = await fetch(`${API_BASE}/api/workspace/${encodeURIComponent(runId)}/file?path=${encodeURIComponent(filePath)}`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`Failed to fetch file ${filePath} for ${runId}:`, err);
    return null;
  }
}
