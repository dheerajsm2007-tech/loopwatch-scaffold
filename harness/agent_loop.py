"""
Owner: Person 1

Real think -> call a tool -> read result loop, driven by a local model via
Ollama (harness/local_llm.py) with real filesystem tools (harness/tools.py),
guarded by harness/guard.py.

An outer MAX_HARD_STEPS cap exists purely as a safety net independent of the
detectors being demoed -- with guard.enabled=False you're relying on
yourself to Ctrl+C, and this is just insurance against forgetting to.
"""
import json
import uuid

from harness.guard import Guard
from harness.local_llm import call_llm
from harness.tools import read_file, search, write_file

MAX_HARD_STEPS = 60  # outer safety net, separate from any detector


def run_agent(task: str, workspace: str, run_id: str | None = None,
              guard_enabled: bool = True) -> str:
    run_id = run_id or f"run_{uuid.uuid4().hex[:8]}"
    guard = Guard(run_id=run_id, enabled=guard_enabled)

    messages = [{"role": "user", "content": task}]
    step = 0

    while step < MAX_HARD_STEPS:
        response = call_llm(messages)
        tool = response["tool"]
        args = response["arguments"]

        if tool == "search":
            observation = search(workspace, **args)
        elif tool == "read_file":
            observation = read_file(workspace, **args)
        elif tool == "write_file":
            observation = write_file(workspace, **args)
        elif tool == "think":
            observation = f"(no tool called) {args.get('text', '')[:200]}"
        elif tool == "done":
            print(f"[agent] called done: {args.get('summary', '')}")
            break
        else:
            observation = f"error: unknown tool {tool}"

        verdict = guard.record_step(
            step=step,
            tool=tool,
            arguments=args,
            observation=observation,
            input_tokens=response["input_tokens"],
            output_tokens=response["output_tokens"],
            cost_usd=response["cost_usd"],
            workspace=workspace,
        )

        print(f"step {step:2d} | {tool:10s} {json.dumps(args)[:50]:50s} | "
              f"spend so far: ${verdict.spend_so_far:.4f}")

        if verdict.halt:
            print(f"\n[GUARD] halted at step {step}")
            print(f"[GUARD] detector: {verdict.detector}")
            print(f"[GUARD] reason: {verdict.reason}")
            print(f"[GUARD] spend so far: ${verdict.spend_so_far:.4f}")
            print(f"[GUARD] options: resume / kill / raise budget\n")
            return run_id

        assistant_msg = response.get("assistant_message", {"role": "assistant", "content": ""})
        messages.append(assistant_msg)
        if response.get("assistant_message", {}).get("tool_calls"):
            call_id = assistant_msg["tool_calls"][0]["id"]
            messages.append({"role": "tool", "tool_call_id": call_id, "content": observation})
        else:
            messages.append({"role": "user", "content": f"Result: {observation}"})

        step += 1

    else:
        print(f"\n[SAFETY NET] hit outer hard cap of {MAX_HARD_STEPS} steps "
              f"(this is a hackathon safety net, not one of the four detectors)\n")

    return run_id


if __name__ == "__main__":
    run_agent(task="find and fix the bug in the payment validator", workspace="./scratch_workspace")
