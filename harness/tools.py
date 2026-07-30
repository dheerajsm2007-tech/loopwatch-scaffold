"""
Real tool implementations, scoped to a workspace directory so a spinning or
misbehaving agent can never touch anything outside its scratch folder.
"""
import hashlib
import os


def _safe_path(workspace: str, path: str) -> str:
    full = os.path.normpath(os.path.join(workspace, path))
    full_abs = os.path.abspath(full)
    workspace_abs = os.path.normpath(os.path.abspath(workspace))
    # A plain str.startswith(workspace_abs) check is bypassable by a sibling
    # directory whose name happens to start with the same prefix (e.g.
    # "scratch_workspace_backup" starts with "scratch_workspace"). Comparing
    # against workspace_abs + a path separator closes that gap while still
    # allowing the workspace root itself.
    if full_abs != workspace_abs and not full_abs.startswith(workspace_abs + os.sep):
        raise ValueError(f"path escapes workspace: {path}")
    return full


def search(workspace: str, query: str) -> str:
    matches = []
    query_lower = query.lower()
    for root, dirs, files in os.walk(workspace):
        for fname in files:
            rel = os.path.relpath(os.path.join(root, fname), workspace)
            if query_lower in fname.lower() or query_lower in rel.lower():
                matches.append(rel)
    if matches:
        return f"found: {', '.join(sorted(matches))}"
    return "no matches found in /workspace"


def read_file(workspace: str, path: str) -> str:
    try:
        full = _safe_path(workspace, path)
    except ValueError as e:
        return f"error: {e}"
    if not os.path.exists(full):
        return f"error: {path} does not exist"
    with open(full) as f:
        return f.read()[:2000]  # cap so one huge file can't blow the context


def write_file(workspace: str, path: str, content: str) -> str:
    try:
        full = _safe_path(workspace, path)
    except ValueError as e:
        return f"error: {e}"
    os.makedirs(os.path.dirname(full) or workspace, exist_ok=True)
    with open(full, "w") as f:
        f.write(content)
    return "file written"


def hash_workspace(workspace: str) -> str:
    """Detector 4 depends on this changing whenever the agent actually edits
    something -- hashes the file listing + sizes, not full contents (fast)."""
    h = hashlib.sha256()
    for root, dirs, files in sorted(os.walk(workspace)):
        for fname in sorted(files):
            path = os.path.join(root, fname)
            h.update(path.encode())
            h.update(str(os.path.getsize(path)).encode())
    return h.hexdigest()
