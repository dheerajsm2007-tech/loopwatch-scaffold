"""
Owner: joint — Person 1 wires this once harness + guard work, Person 2 wires
the dashboard connection, rehearsed together with Person 3 from hour 16.

Two scripted runs for the live pitch:
  1. Impossible task, guard OFF  -> counter climbs until manually killed
  2. Impossible task, guard ON   -> halts around step 9, reports spend + reason
  3. (extra beat) a legitimately long task the guard correctly lets finish

Run the dashboard (`uvicorn dashboard.server:app --port 8000`) in another
terminal before running this, and keep it open on screen during the demo.
"""
from harness.agent_loop import run_agent

IMPOSSIBLE_TASK = "find and fix the bug in payments/does_not_exist.py"
LONG_PRODUCTIVE_TASK = "refactor the payments module to add currency support, with tests"


def demo_guard_off():
    print("=== DEMO 1: guard disabled — watch the dashboard climb ===")
    run_agent(
        task=IMPOSSIBLE_TASK,
        workspace="./demo_workspace_1",
        run_id="demo_guard_off",
        halting_enabled=False,
        max_steps=20,  # bounded so the live demo doesn't run forever, unbounded by the guard itself
    )


def demo_guard_on():
    print("=== DEMO 2: guard enabled — should halt around step 9 ===")
    run_agent(task=IMPOSSIBLE_TASK, workspace="./demo_workspace_2", run_id="demo_guard_on")


def demo_long_but_productive():
    print("=== DEMO 3: legitimately long task — guard should let it finish ===")
    run_agent(task=LONG_PRODUCTIVE_TASK, workspace="./demo_workspace_3", run_id="demo_long_productive")


if __name__ == "__main__":
    demo_guard_off()
    demo_guard_on()
    demo_long_but_productive()
