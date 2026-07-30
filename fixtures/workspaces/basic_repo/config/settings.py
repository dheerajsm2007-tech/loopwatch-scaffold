"""Application settings and feature flags.

pathological_15 in the eval corpus: this file has real, unresolved git
merge-conflict markers below -- it is not valid Python until they're
resolved and every feature flag is set to enabled (True).
"""
<<<<<<< HEAD
FEATURE_FLAGS = {
    "new_checkout": True,
    "dark_mode": False,
    "beta_analytics": True,
}
=======
FEATURE_FLAGS = {
    "new_checkout": False,
    "dark_mode": True,
    "beta_analytics": False,
}
>>>>>>> feature/enable-all-flags
