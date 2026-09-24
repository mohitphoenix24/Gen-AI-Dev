import os
from typing import Iterator

from google import genai

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

    def stream(self, model: str, question: str) -> Iterator[str]:
        client = genai.Client()  # reads GEMINI_API_KEY / GOOGLE_API_KEY from the environment
        for chunk in client.models.generate_content_stream(model=model, contents=question):
            if chunk.text:
                yield chunk.text
