"""
Owner: Person 1

Minimal think -> call a tool -> read result loop. Deliberately hand-rolled,
not a framework, so the "agent-agnostic" story in the deck stays honest and
so there's no framework setup eating hour 0-2.

Three tools only: search, read_file, write_file, all scoped to a scratch
directory so demo runs are safe to blow away and reset.
"""
import time
import uuid

from harness.guard import Guard


def search(workspace: str, query: str) -> str:
    # TODO: naive text search over files in `workspace`
    raise NotImplementedError


def read_file(workspace: str, path: str) -> str:
    # TODO: read a file relative to `workspace`
    raise NotImplementedError


def write_file(workspace: str, path: str, content: str) -> str:
    # TODO: write a file relative to `workspace`
    raise NotImplementedError


def call_llm(messages: list) -> dict:
    """
    TODO: call the LLM API here (Bedrock Converse or Anthropic API directly —
    see the open decision in the deck). Must return a dict with at least:
      { "tool": str, "arguments": dict, "input_tokens": int,
        "output_tokens": int, "cost_usd": float }
    Token counts and cost MUST come from the API response, not be estimated —
    that's what makes the cost number in the deck real.
    """
    raise NotImplementedError


def run_agent(task: str, workspace: str, run_id: str | None = None) -> str:
    """Runs the loop until the agent stops itself, or the guard halts it."""
    run_id = run_id or f"run_{uuid.uuid4().hex[:8]}"
    guard = Guard(run_id=run_id)

    messages = [{"role": "user", "content": task}]
    step = 0

    while True:
        response = call_llm(messages)

        tool = response["tool"]
        args = response["arguments"]

        if tool == "search":
            observation = search(workspace, **args)
        elif tool == "read_file":
            observation = read_file(workspace, **args)
        elif tool == "write_file":
            observation = write_file(workspace, **args)
        elif tool == "done":
            break
        else:
            raise ValueError(f"unknown tool: {tool}")

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

        if verdict.halt:
            print(f"[guard] halted at step {step}: {verdict.reason}")
            print(f"[guard] spend so far: ${verdict.spend_so_far:.4f}")
            break

        messages.append({"role": "tool", "content": observation})
        step += 1
        time.sleep(0)  # placeholder for rate limiting if needed

    return run_id


if __name__ == "__main__":
    # quick manual smoke test once the TODOs above are filled in
    run_agent(task="find and fix the bug in payments/handler.py", workspace="./scratch")
