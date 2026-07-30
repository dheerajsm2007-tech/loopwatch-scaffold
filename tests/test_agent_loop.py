"""
Tests for harness/agent_loop.py — tools scoped to a workspace, and call_llm()
against the local Ollama OpenAI-compatible endpoint.
"""
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

from harness import agent_loop


def test_write_file_then_read_file_roundtrip(tmp_path):
    agent_loop.write_file(str(tmp_path), "notes.txt", "hello")
    assert agent_loop.read_file(str(tmp_path), "notes.txt") == "hello"


def test_write_file_creates_parent_dirs(tmp_path):
    agent_loop.write_file(str(tmp_path), "sub/dir/notes.txt", "hi")
    assert (tmp_path / "sub" / "dir" / "notes.txt").read_text() == "hi"


def test_read_file_missing_returns_message_not_exception(tmp_path):
    result = agent_loop.read_file(str(tmp_path), "missing.txt")
    assert "not found" in result.lower()


def test_read_file_rejects_path_escaping_workspace(tmp_path):
    with pytest.raises(ValueError):
        agent_loop.read_file(str(tmp_path), "../outside.txt")


def test_write_file_rejects_path_escaping_workspace(tmp_path):
    with pytest.raises(ValueError):
        agent_loop.write_file(str(tmp_path), "../outside.txt", "x")


def test_write_file_rejects_absolute_path_escape(tmp_path):
    with pytest.raises(ValueError):
        agent_loop.write_file(str(tmp_path), "/etc/passwd", "x")


def test_search_finds_matching_filename(tmp_path):
    (tmp_path / "config.json").write_text("{}")
    (tmp_path / "other.txt").write_text("nothing relevant")
    result = agent_loop.search(str(tmp_path), "config")
    assert "config.json" in result


def test_search_finds_matching_content(tmp_path):
    (tmp_path / "handler.py").write_text("TAX_RATE = 0.08")
    result = agent_loop.search(str(tmp_path), "TAX_RATE")
    assert "handler.py" in result


def test_search_no_matches(tmp_path):
    result = agent_loop.search(str(tmp_path), "nonexistent_query_xyz")
    assert result == "no matches found in /workspace"


def _fake_response(tool, arguments_json, prompt_tokens=42, completion_tokens=7, call_id="call_123"):
    message = SimpleNamespace(
        tool_calls=[
            SimpleNamespace(
                id=call_id,
                function=SimpleNamespace(name=tool, arguments=arguments_json),
            )
        ],
        content=None,
    )
    usage = SimpleNamespace(prompt_tokens=prompt_tokens, completion_tokens=completion_tokens)
    return SimpleNamespace(choices=[SimpleNamespace(message=message)], usage=usage)


def test_call_llm_parses_tool_call_and_usage(monkeypatch):
    mock_client = MagicMock()
    mock_client.chat.completions.create.return_value = _fake_response(
        "search", '{"query": "config"}'
    )
    monkeypatch.setattr(agent_loop, "_client", mock_client)

    result = agent_loop.call_llm([{"role": "user", "content": "hi"}])

    assert result == {
        "tool": "search",
        "arguments": {"query": "config"},
        "tool_call_id": "call_123",
        "input_tokens": 42,
        "output_tokens": 7,
        "cost_usd": 0.0,
    }


def test_call_llm_retries_on_malformed_arguments_then_succeeds(monkeypatch):
    mock_client = MagicMock()
    mock_client.chat.completions.create.side_effect = [
        _fake_response("search", "{not valid json"),
        _fake_response("done", "{}"),
    ]
    monkeypatch.setattr(agent_loop, "_client", mock_client)

    result = agent_loop.call_llm([{"role": "user", "content": "hi"}])

    assert result["tool"] == "done"
    assert mock_client.chat.completions.create.call_count == 2


def test_call_llm_raises_after_exhausting_retries(monkeypatch):
    no_tool_message = SimpleNamespace(tool_calls=None, content="I'm just chatting")
    no_tool_response = SimpleNamespace(
        choices=[SimpleNamespace(message=no_tool_message)], usage=None
    )
    mock_client = MagicMock()
    mock_client.chat.completions.create.return_value = no_tool_response
    monkeypatch.setattr(agent_loop, "_client", mock_client)

    with pytest.raises(agent_loop.LLMResponseError):
        agent_loop.call_llm([{"role": "user", "content": "hi"}])

    assert mock_client.chat.completions.create.call_count == agent_loop.MAX_CALL_RETRIES + 1


def test_call_llm_handles_missing_usage_gracefully(monkeypatch):
    mock_client = MagicMock()
    response = _fake_response("done", "{}")
    response.usage = None
    mock_client.chat.completions.create.return_value = response
    monkeypatch.setattr(agent_loop, "_client", mock_client)

    result = agent_loop.call_llm([{"role": "user", "content": "hi"}])

    assert result["input_tokens"] == 0
    assert result["output_tokens"] == 0
    assert result["cost_usd"] == 0.0


def _fake_call_response(tool, arguments, tool_call_id):
    return {
        "tool": tool,
        "arguments": arguments,
        "tool_call_id": tool_call_id,
        "input_tokens": 1,
        "output_tokens": 1,
        "cost_usd": 0.0,
    }


def test_run_agent_builds_valid_openai_tool_message_sequence(tmp_path, monkeypatch):
    """Regression test: the assistant's tool_calls message must precede the
    matching tool-role message, or a real multi-step Ollama run breaks."""
    monkeypatch.setattr("harness.guard.TRACES_DIR", tmp_path / "traces")
    captured = []
    responses = iter([
        _fake_call_response("search", {"query": "x"}, "call_1"),
        _fake_call_response("done", {}, "call_2"),
    ])

    def fake_call_llm(messages):
        captured.append(list(messages))
        return next(responses)

    monkeypatch.setattr(agent_loop, "call_llm", fake_call_llm)
    monkeypatch.setattr(agent_loop, "search", lambda workspace, query: "obs")

    agent_loop.run_agent(task="do something", workspace=str(tmp_path), run_id="msgflow_run")

    second_call_messages = captured[1]
    assistant_msg, tool_msg = second_call_messages[-2], second_call_messages[-1]
    assert assistant_msg["role"] == "assistant"
    assert assistant_msg["tool_calls"][0]["id"] == "call_1"
    assert tool_msg == {"role": "tool", "tool_call_id": "call_1", "content": "obs"}


def test_run_agent_recovers_from_tool_argument_mismatch_instead_of_crashing(tmp_path, monkeypatch):
    monkeypatch.setattr("harness.guard.TRACES_DIR", tmp_path / "traces")
    responses = iter([
        _fake_call_response("search", {"wrong_kwarg": "x"}, "call_1"),
        _fake_call_response("done", {}, "call_2"),
    ])
    monkeypatch.setattr(agent_loop, "call_llm", lambda messages: next(responses))

    run_id = agent_loop.run_agent(task="do something", workspace=str(tmp_path), run_id="typeerr_run")

    assert run_id == "typeerr_run"
