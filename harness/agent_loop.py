"""
Owner: Person 1

Minimal think -> call a tool -> read result loop. Deliberately hand-rolled,
not a framework, so the "agent-agnostic" story in the deck stays honest and
so there's no framework setup eating hour 0-2.

Three tools only: search, read_file, write_file, all scoped to a scratch
directory so demo runs are safe to blow away and reset.

call_llm() talks to a local Ollama model via its OpenAI-compatible endpoint
(no API key, no cloud cost).
"""
import json
import logging
import os
import time
import uuid
from pathlib import Path

from openai import OpenAI

from harness.guard import Guard

OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434/v1")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "qwen2.5:7b")
MAX_CALL_RETRIES = 2  # retries on malformed tool-call output, not on connection errors
OLLAMA_TIMEOUT_SECONDS = 60  # so a hung local model can't hang the guard indefinitely

MAX_WRITE_FILE_BYTES = 1_000_000  # circuit breaker against a runaway single write
MAX_SEARCH_FILE_BYTES = 200_000  # skip huge/binary files instead of reading them whole

_client = OpenAI(base_url=OLLAMA_BASE_URL, api_key="ollama")

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search",
            "description": "Naive text search over files in the workspace.",
            "parameters": {
                "type": "object",
                "properties": {"query": {"type": "string"}},
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "read_file",
            "description": "Read a file relative to the workspace root.",
            "parameters": {
                "type": "object",
                "properties": {"path": {"type": "string"}},
                "required": ["path"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "write_file",
            "description": "Write a file relative to the workspace root.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string"},
                    "content": {"type": "string"},
                },
                "required": ["path", "content"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "think",
            "description": "Reason out loud without taking an action, e.g. to plan the next step.",
            "parameters": {
                "type": "object",
                "properties": {"reasoning": {"type": "string"}},
                "required": ["reasoning"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "done",
            "description": "Call this once the task is complete. Stops the loop.",
            "parameters": {"type": "object", "properties": {}},
        },
    },
]


class LLMResponseError(Exception):
    """The model's response couldn't be parsed into a valid tool call."""


def _resolve_within_workspace(workspace: str, relative_path: str) -> Path:
    base = Path(workspace).resolve()
    target = (base / relative_path).resolve()
    if target != base and base not in target.parents:
        raise ValueError(f"path escapes workspace: {relative_path}")
    return target


def search(workspace: str, query: str) -> str:
    """Naive filename/content substring search over every file in workspace."""
    base = Path(workspace).resolve()
    if not base.exists():
        return "no matches found in /workspace"

    needle = query.lower()
    matches = []
    for path in sorted(base.rglob("*")):
        if not path.is_file():
            continue
        if needle in path.name.lower():
            matches.append(str(path.relative_to(base)))
            continue
        try:
            if path.stat().st_size > MAX_SEARCH_FILE_BYTES:
                continue
            text = path.read_text(encoding="utf-8", errors="replace")
        except OSError:
            continue
        if needle in text.lower():
            matches.append(str(path.relative_to(base)))

    if not matches:
        return "no matches found in /workspace"
    return ", ".join(matches)


def read_file(workspace: str, path: str) -> str:
    """Read a file relative to workspace; raises ValueError if path escapes it."""
    target = _resolve_within_workspace(workspace, path)
    if not target.exists():
        return f"file not found: {path}"
    return target.read_text(encoding="utf-8", errors="replace")


def write_file(workspace: str, path: str, content: str) -> str:
    """Write a file relative to workspace; raises ValueError if path escapes
    it or content exceeds MAX_WRITE_FILE_BYTES."""
    if len(content.encode("utf-8")) > MAX_WRITE_FILE_BYTES:
        raise ValueError(f"content exceeds {MAX_WRITE_FILE_BYTES}-byte write cap")
    target = _resolve_within_workspace(workspace, path)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding="utf-8")
    return "file written"


def _parse_tool_call(response) -> dict:
    message = response.choices[0].message
    tool_calls = getattr(message, "tool_calls", None)
    if not tool_calls:
        raise LLMResponseError(f"model did not call a tool: {message.content!r}")

    call = tool_calls[0]
    try:
        arguments = json.loads(call.function.arguments or "{}")
    except json.JSONDecodeError as exc:
        raise LLMResponseError(f"malformed tool arguments from model: {exc}") from exc

    usage = getattr(response, "usage", None)
    return {
        "tool": call.function.name,
        "arguments": arguments,
        "tool_call_id": call.id,
        "input_tokens": usage.prompt_tokens if usage else 0,
        "output_tokens": usage.completion_tokens if usage else 0,
        "cost_usd": 0.0,  # local model — no billed cost, not an estimate
    }


def call_llm(messages: list) -> dict:
    """
    Calls the local Ollama model (OpenAI-compatible chat.completions, tool
    calling) and normalizes the response into the shape run_agent() expects.
    Retries a couple of times on malformed tool-call output before giving up
    — small local models occasionally skip the tool call or emit invalid
    JSON arguments.
    """
    last_error = None
    for _ in range(MAX_CALL_RETRIES + 1):
        response = _client.chat.completions.create(
            model=OLLAMA_MODEL,
            messages=messages,
            tools=TOOLS,
            tool_choice="required",
            timeout=OLLAMA_TIMEOUT_SECONDS,
        )
        try:
            return _parse_tool_call(response)
        except LLMResponseError as exc:
            last_error = exc
            logging.warning("call_llm: retrying after malformed tool call: %s", exc)
    raise last_error


def _execute_tool(tool: str, args: dict, workspace: str) -> str:
    """Dispatch to the named tool and return its observation text.

    Raises ValueError for an unrecognized tool name. TypeError/ValueError/
    OSError raised by the tool itself are the caller's responsibility to
    catch — they're recoverable (fed back to the model as an observation),
    not process-fatal.
    """
    if tool == "search":
        return search(workspace, **args)
    elif tool == "read_file":
        return read_file(workspace, **args)
    elif tool == "write_file":
        return write_file(workspace, **args)
    elif tool == "think":
        return args.get("reasoning", "")
    else:
        raise ValueError(f"unknown tool: {tool}")


def run_agent(task: str, workspace: str, run_id: str | None = None,
              halting_enabled: bool = True, max_steps: int | None = None) -> str:
    """Runs the loop until the agent stops itself, the guard halts it, or
    max_steps is reached (if set).

    halting_enabled=False and max_steps let a caller (e.g. the "guard off"
    demo beat) run without the guard's halt logic while still capping how
    long a live demo run goes on for — every step is still traced normally
    either way, only the halt decision itself is suppressed.
    """
    run_id = run_id or f"run_{uuid.uuid4().hex[:8]}"
    guard = Guard(run_id=run_id, halting_enabled=halting_enabled)

    messages = [{"role": "user", "content": task}]
    step = 0

    while True:
        try:
            response = call_llm(messages)
        except LLMResponseError as exc:
            # The model never produced a valid tool call even after
            # call_llm()'s internal retries (e.g. it drifted into plain-text
            # narration instead of calling a tool or "done"). Stop cleanly
            # instead of letting this crash the process — everything traced
            # up to this point is still valid, so the run/dashboard aren't
            # left in a broken state.
            print(f"[run_agent] model failed to produce a valid tool call: {exc}")
            print(f"[run_agent] stopping at step {step} (see trace for prior steps)")
            break

        tool = response["tool"]
        args = response["arguments"]
        tool_call_id = response["tool_call_id"]

        # The OpenAI tool-calling protocol requires the assistant's tool_calls
        # message to precede any "tool" role message referencing it by id —
        # without this, a real multi-step Ollama run rejects or loses context
        # from step 2 onward.
        messages.append({
            "role": "assistant",
            "content": None,
            "tool_calls": [{
                "id": tool_call_id,
                "type": "function",
                "function": {"name": tool, "arguments": json.dumps(args)},
            }],
        })

        if tool == "done":
            break

        try:
            observation = _execute_tool(tool, args, workspace)
        except (TypeError, ValueError, OSError) as exc:
            # Covers: wrong argument names from a small local model (TypeError),
            # a workspace-escape attempt or write-size-cap trip (ValueError),
            # and filesystem errors like reading a directory (OSError). Feeding
            # this back as an observation — instead of crashing the process —
            # means an escape *attempt* is traced and can inform a halt
            # decision, which is the whole point of this guard.
            observation = f"tool call failed: {exc}"

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

        messages.append({"role": "tool", "tool_call_id": tool_call_id, "content": observation})
        step += 1

        if max_steps is not None and step >= max_steps:
            print(f"[run_agent] reached max_steps={max_steps}, stopping")
            break

        time.sleep(0)  # placeholder for rate limiting if needed

    return run_id


if __name__ == "__main__":
    # quick manual smoke test once the TODOs above are filled in
    run_agent(task="find and fix the bug in payments/handler.py", workspace="./scratch")
