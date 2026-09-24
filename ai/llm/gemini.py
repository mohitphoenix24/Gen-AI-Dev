import os
from typing import Iterator, Optional

from google import genai
from google.genai import types

from .base import LLMProvider, ModelInfo

# "-latest" is a Google-maintained alias that always points at the current
# flash model, which sidesteps having to track exact dated snapshot names
# here. Set GEMINI_MODEL to pin a specific one instead.
DEFAULT_MODEL = "gemini-flash-latest"


class GeminiProvider(LLMProvider):
    """Cloud provider -- talks to the Google Gemini API."""

    name = "gemini"

    def _model_id(self) -> str:
        return os.environ.get("GEMINI_MODEL", DEFAULT_MODEL)

    def is_available(self) -> bool:
        return bool(os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY"))

    def unavailable_reason(self):
        return None if self.is_available() else "GEMINI_API_KEY is not set on the server"

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
        client = genai.Client()  # reads GEMINI_API_KEY / GOOGLE_API_KEY from the environment

        # Gemini is the one provider whose SDK doesn't take {"role": "user"/
        # "assistant", "content": str} directly - it wants "model" instead of
        # "assistant", and text nested under "parts". This is exactly the
        # translation the provider interface exists for: everyone upstream
        # still speaks the one generic message shape.
        contents = [
            {"role": "model" if m["role"] == "assistant" else "user", "parts": [{"text": m["content"]}]}
            for m in messages
        ]

        config = None
        if temperature is not None or max_tokens is not None:
            config = types.GenerateContentConfig(temperature=temperature, max_output_tokens=max_tokens)

        for chunk in client.models.generate_content_stream(model=model, contents=contents, config=config):
            if chunk.text:
                yield chunk.text
