import os
from typing import Iterator, Optional

import anthropic

from .base import LLMProvider, ModelInfo

MODEL_ID = "claude-opus-5"
MODEL_LABEL = "Claude Opus 5"


class ClaudeProvider(LLMProvider):
    """Cloud provider -- talks to the Anthropic API."""

    name = "claude"

    def is_available(self) -> bool:
        return bool(os.environ.get("ANTHROPIC_API_KEY"))

    def unavailable_reason(self):
        return None if self.is_available() else "ANTHROPIC_API_KEY is not set on the server"

    def list_models(self) -> list[ModelInfo]:
        return [
            ModelInfo(
                id=f"{self.name}:{MODEL_ID}",
                label=MODEL_LABEL,
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
        client = anthropic.Anthropic()  # reads ANTHROPIC_API_KEY from the environment
        kwargs = {"model": model, "max_tokens": max_tokens or 1024, "messages": messages}
        if temperature is not None:
            kwargs["temperature"] = temperature
        with client.messages.stream(**kwargs) as stream:
            yield from stream.text_stream
