"""
The LLM gateway. This is the only file the React frontend talks to.

It does not know how Claude or Ollama work -- it resolves "provider:model"
to a registered provider (llm/registry.py) and delegates. Adding a new
provider never touches this file; see llm/registry.py.

    React app --POST /api/ask/stream--> gateway --> provider registry --> ClaudeProvider / OllamaProvider / ...
"""

from typing import Optional

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field

from llm.registry import all_providers, get_provider
from streaming import stream_response

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# FastAPI's own validation-error shape ({"detail": [...]}) would otherwise
# leak through for unparseable JSON bodies - keep the same {"error": "..."}
# contract the frontend already expects for every failure mode.
@app.exception_handler(RequestValidationError)
async def invalid_body(request: Request, exc: RequestValidationError):
    return JSONResponse(status_code=400, content={"error": "invalid request body"})


class ChatMessage(BaseModel):
    role: str
    content: str


class AskRequest(BaseModel):
    # Defaults (not required fields) so a missing field just fails the manual
    # checks below - not a framework 422 with FastAPI's own error shape.
    messages: list[ChatMessage] = []
    model: str = ""
    # Generation controls from the UI. None means "let the provider use its
    # own default" rather than forcing one - a provider that doesn't support
    # a field just ignores it (see llm/base.py).
    temperature: Optional[float] = Field(default=None, ge=0, le=2)
    max_tokens: Optional[int] = Field(default=None, gt=0)


@app.get("/api/models")
def models():
    """Ask every registered provider for its models and merge into one catalog."""
    catalog = [
        {
            "id": m.id,
            "label": m.label,
            "provider": m.provider,
            "available": m.available,
            "unavailableReason": m.unavailable_reason,
            "kind": m.kind,
        }
        for provider in all_providers()
        for m in provider.list_models()
    ]
    return {"models": catalog}


@app.post("/api/ask/stream")
def ask_stream(body: AskRequest):
    messages = [m.model_dump() for m in body.messages]
    model_id = body.model.strip()

    if not messages:
        return JSONResponse(status_code=400, content={"error": "messages is required"})
    if ":" not in model_id:
        return JSONResponse(status_code=400, content={"error": "model is required"})

    provider_name, model_name = model_id.split(":", 1)
    provider = get_provider(provider_name)

    if provider is None:
        return JSONResponse(status_code=400, content={"error": f"unknown provider '{provider_name}'"})
    if not provider.is_available():
        return JSONResponse(status_code=400, content={"error": provider.unavailable_reason()})

    # stream_response() is a plain sync generator - Starlette runs it in a
    # threadpool automatically, which is exactly right here since the
    # providers themselves make blocking sync HTTP calls (requests, the
    # Anthropic SDK's sync client), not async ones.
    return StreamingResponse(
        stream_response(provider, model_name, messages, temperature=body.temperature, max_tokens=body.max_tokens),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=5001)
