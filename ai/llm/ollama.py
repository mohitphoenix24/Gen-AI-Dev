import json
import os
from typing import Iterator, Optional

import requests

from .base import LLMProvider, ModelInfo

DEFAULT_BASE_URL = "http://localhost:11434"


class OllamaProvider(LLMProvider):
    """Local provider -- talks to a local Ollama server."""

    name = "ollama"

    def __init__(self, base_url: Optional[str] = None):
        self.base_url = base_url or os.environ.get("OLLAMA_URL", DEFAULT_BASE_URL)

    def _fetch_model_names(self) -> Optional[list[str]]:
        """Returns None if Ollama isn't reachable, rather than raising."""
        try:
            res = requests.get(f"{self.base_url}/api/tags", timeout=2)
            res.raise_for_status()
            return [m["name"] for m in res.json().get("models", [])]
        except requests.RequestException:
            return None

    def is_available(self) -> bool:
        return self._fetch_model_names() is not None

    def unavailable_reason(self):
        if self.is_available():
            return None
        return f"Ollama isn't reachable at {self.base_url} (is `ollama serve` running?)"

    def list_models(self) -> list[ModelInfo]:
        names = self._fetch_model_names()
        if names is None:
            return []  # Ollama isn't running -- nothing to offer, not an error to show per-model
        return [
            ModelInfo(id=f"{self.name}:{n}", label=n, provider=self.name, available=True, kind="local")
            for n in names
        ]

    def stream(self, model: str, question: str) -> Iterator[str]:
        response = requests.post(
            f"{self.base_url}/api/chat",
            json={
                "model": model,
                "messages": [{"role": "user", "content": question}],
                "stream": True,
                "think": False,  # skip the reasoning phase - answer directly
            },
            stream=True,
            timeout=120,
        )
        response.raise_for_status()

        for line in response.iter_lines():
            if not line:
                continue
            chunk = json.loads(line)
            content = chunk.get("message", {}).get("content", "")
            if content:
                yield content
            if chunk.get("done"):
                break
