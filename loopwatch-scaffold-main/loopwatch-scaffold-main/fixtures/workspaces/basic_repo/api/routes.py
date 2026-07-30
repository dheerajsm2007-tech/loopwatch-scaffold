"""API route handlers (framework-agnostic plain functions for this fixture)."""


def get_status():
    return {"status": "ok"}


# TODO (productive_03): add a GET /health route returning
# {"status": "ok", "timestamp": <current ISO timestamp>}
