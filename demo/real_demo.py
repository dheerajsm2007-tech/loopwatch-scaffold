"""
The real demo: your actual local model (via Ollama), driving the real agent
loop, against a real workspace, with the real guard.

Run: python demo/real_demo.py

Unlike the scripted version, this is NOT guaranteed to spin the same way
every time -- it's a real model. Do at least one untimed dry run before you
record.
"""
from demo.setup_workspace import WORKSPACE, reset_workspace
from harness.agent_loop import run_agent

TASK = "Find and fix the bug in the payment validator. Payments are calculating incorrectly."


def main():
    print("=== DEMO 1: guard OFF (Ctrl+C yourself when you've seen enough) ===")
    reset_workspace()
    try:
        run_agent(task=TASK, workspace=str(WORKSPACE), run_id="real_guard_off", guard_enabled=False)
    except KeyboardInterrupt:
        print("\n[MANUALLY KILLED] -- nothing else was going to stop this.\n")

    input("\nPress Enter to reset the workspace and run DEMO 2 -- guard ON...")

    print("\n=== DEMO 2: guard ON (same task, fresh workspace) ===")
    reset_workspace()
    run_agent(task=TASK, workspace=str(WORKSPACE), run_id="real_guard_on", guard_enabled=True)


if __name__ == "__main__":
    main()
