import os
from typing import Iterator, Optional

from openai import OpenAI

from .base import LLMProvider, ModelInfo

# Model catalogs drift fast across every cloud provider - rather than hardcode
# a snapshot that goes stale, this reads an override env var and falls back
# to a sane default. Set OPENAI_MODEL to pin a specific model.
DEFAULT_MODEL = "gpt-4o-mini"


class OpenAIProvider(LLMProvider):
    """Cloud provider -- talks to the OpenAI API."""

    name = "openai"

    def _model_id(self) -> str:
        return os.environ.get("OPENAI_MODEL", DEFAULT_MODEL)

    def is_available(self) -> bool:
        return bool(os.environ.get("OPENAI_API_KEY"))

    def unavailable_reason(self):
        return None if self.is_available() else "OPENAI_API_KEY is not set on the server"

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
        client = OpenAI()  # reads OPENAI_API_KEY from the environment
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
