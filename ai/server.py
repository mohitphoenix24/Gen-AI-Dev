"""
The LLM gateway. This is the only file the React frontend talks to.

It does not know how Claude or Ollama work -- it resolves "provider:model"
to a registered provider (llm/registry.py) and delegates. Adding a new
provider never touches this file; see llm/registry.py.

    React app --POST /api/ask/stream--> gateway --> provider registry --> ClaudeProvider / OllamaProvider / ...
"""

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel

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


class AskRequest(BaseModel):
    # Defaults (not required fields) so a missing field is just an empty
    # string, handled by the same manual checks below - not a framework 422.
    question: str = ""
    model: str = ""


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
    question = body.question.strip()
    model_id = body.model.strip()

    if not question:
        return JSONResponse(status_code=400, content={"error": "question is required"})
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
        stream_response(provider, model_name, question),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=5001)
