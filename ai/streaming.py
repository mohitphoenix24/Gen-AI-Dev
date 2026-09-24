"""
Turns any provider's output into the one SSE event format the frontend
understands: start -> delta* -> done, or start -> error.

This is the only place that knows both "providers yield plain text chunks"
and "the wire format is SSE". Providers don't know SSE exists; the frontend
doesn't know providers exist.
"""

import json

from llm.base import LLMProvider


def sse(event_type: str, **data) -> str:
    """Format one Server-Sent Events message."""
    return f"data: {json.dumps({'type': event_type, **data})}\n\n"


def stream_response(provider: LLMProvider, model: str, question: str):
    yield sse("start")
    try:
        for text in provider.stream(model, question):
            yield sse("delta", text=text)
        yield sse("done")
    except Exception as e:
        # Whatever went wrong -- a bad API key, a network timeout, a provider
        # bug -- the frontend only ever sees a normalized error event.
        yield sse("error", message=str(e))
