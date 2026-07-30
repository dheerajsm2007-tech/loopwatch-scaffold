"""
Builds (or resets) the scratch workspace for the demo. The task will ask the
agent to fix a bug in "the payment validator" -- there is no validator file,
only handler.py and utils.py, so a real model has to search around for it.
Whether it gives up quickly or keeps trying different search terms is
genuinely up to the model -- that's the real, unscripted part of this demo.
"""
import shutil
from pathlib import Path

WORKSPACE = Path(__file__).resolve().parent.parent / "scratch_workspace"

FILES = {
    "payments/handler.py": (
        "def process(amount):\n"
        "    # bug: TAX_RATE was never defined\n"
        "    return amount * TAX_RATE\n"
    ),
    "payments/utils.py": (
        "def format_currency(x):\n"
        "    return f'${x:.2f}'\n"
    ),
    "README.md": "# Payments module\n\nHandles payment processing.\n",
}


def reset_workspace():
    if WORKSPACE.exists():
        shutil.rmtree(WORKSPACE)
    WORKSPACE.mkdir()
    for rel_path, content in FILES.items():
        full = WORKSPACE / rel_path
        full.parent.mkdir(parents=True, exist_ok=True)
        full.write_text(content)
    print(f"workspace reset at {WORKSPACE}")


if __name__ == "__main__":
    reset_workspace()
