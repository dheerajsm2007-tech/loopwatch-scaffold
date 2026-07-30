"""
Calls a local model served by Ollama, via its OpenAI-compatible endpoint,
using standard tool/function-calling.

Before running: `ollama pull <model>` for whatever you set MODEL to below,
and make sure `ollama serve` is running (it usually auto-starts).
Check what you have with: ollama list
"""
import json

import requests

BASE_URL = "http://localhost:11434/v1"
MODEL = "llama3.2"  # <-- change to whatever you've pulled, e.g. "llama3.1", "qwen2.5", "mistral"
COST_PER_CALL_USD = 0.003  # local inference is free -- this is a nominal number so
                            # the dashboard still has something to plot; tune freely

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search",
            "description": "Search for files in the workspace whose name or path matches a query string",
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
            "description": "Read the contents of a file in the workspace",
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
            "description": "Write content to a file in the workspace, creating or overwriting it",
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
            "name": "done",
            "description": "Call this only when the task is complete, or you are certain it cannot be completed",
            "parameters": {
                "type": "object",
                "properties": {"summary": {"type": "string"}},
            },
        },
    },
]

SYSTEM_PROMPT = (
    "You are an autonomous coding agent working inside a sandboxed workspace. "
    "You have three tools: search, read_file, write_file. Use them to find and "
    "fix the bug described in the task. Be persistent: if a search doesn't find "
    "what you expect, try different, related search terms before concluding "
    "something doesn't exist. Only call `done` once you are confident the task "
    "is finished, or you have genuinely exhausted reasonable search strategies."
)


def call_llm(messages: list) -> dict:
    """messages is the running conversation, WITHOUT the system prompt --
    this function adds it. Returns a dict the agent loop can dispatch on."""
    full_messages = [{"role": "system", "content": SYSTEM_PROMPT}] + messages

    resp = requests.post(
        f"{BASE_URL}/chat/completions",
        json={
            "model": MODEL,
            "messages": full_messages,
            "tools": TOOLS,
            "temperature": 0.7,
        },
        timeout=120,
    )
    resp.raise_for_status()
    data = resp.json()

    choice = data["choices"][0]["message"]
    tool_calls = choice.get("tool_calls") or []
    usage = data.get("usage", {})

    if not tool_calls:
        return {
            "tool": "think",
            "arguments": {"text": choice.get("content", "")},
            "input_tokens": usage.get("prompt_tokens", 0),
            "output_tokens": usage.get("completion_tokens", 0),
            "cost_usd": COST_PER_CALL_USD,
            "assistant_message": choice,
        }

    call = tool_calls[0]
    try:
        args = json.loads(call["function"]["arguments"])
    except (json.JSONDecodeError, KeyError, TypeError):
        args = {}

    return {
        "tool": call["function"]["name"],
        "arguments": args,
        "input_tokens": usage.get("prompt_tokens", 0),
        "output_tokens": usage.get("completion_tokens", 0),
        "cost_usd": COST_PER_CALL_USD,
        "assistant_message": choice,
    }
