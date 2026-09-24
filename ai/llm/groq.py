import os
from typing import Iterator, Optional

from groq import Groq

from .base import LLMProvider, ModelInfo

# Groq's client is intentionally OpenAI-compatible (same request/response
# shape) - it's a fast-inference host for open-weight models, not its own
# model family. Set GROQ_MODEL to switch which hosted model gets used.
DEFAULT_MODEL = "openai/gpt-oss-20b"


class GroqProvider(LLMProvider):
    """Cloud provider -- talks to the Groq API (fast inference for open-weight models)."""

    name = "groq"

    def _model_id(self) -> str:
        return os.environ.get("GROQ_MODEL", DEFAULT_MODEL)

    def is_available(self) -> bool:
        return bool(os.environ.get("GROQ_API_KEY"))

    def unavailable_reason(self):
        return None if self.is_available() else "GROQ_API_KEY is not set on the server"

    def list_models(self) -> list[ModelInfo]:
        model_id = self._model_id()
        return [
            ModelInfo(
                id=f"{self.name}:{model_id}",
                label=model_id,
                provider=self.name,
                available=self.is_available(),
                unavailable_reason=self.unavailable_reason(),
            )
        ]

    def stream(
        self,
        model: str,
        messages: list[dict],
        *,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> Iterator[str]:
        client = Groq()  # reads GROQ_API_KEY from the environment
        kwargs = {"model": model, "messages": messages, "stream": True}
        if temperature is not None:
            kwargs["temperature"] = temperature
        if max_tokens is not None:
            kwargs["max_tokens"] = max_tokens
        stream = client.chat.completions.create(**kwargs)
        for chunk in stream:
            delta = chunk.choices[0].delta.content
            if delta:
                yield delta
