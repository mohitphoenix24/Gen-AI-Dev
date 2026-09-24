"""
Central place providers are registered.

Adding a new provider is exactly two lines here (import + add to the list) --
nothing in server.py or streaming.py changes.
"""

from .base import LLMProvider
from .claude import ClaudeProvider
from .gemini import GeminiProvider
from .groq import GroqProvider
from .ollama import OllamaProvider
from .openai import OpenAIProvider

_PROVIDERS: dict[str, LLMProvider] = {
    provider.name: provider
    for provider in [
        ClaudeProvider(),
        OllamaProvider(),
        OpenAIProvider(),
        GeminiProvider(),
        GroqProvider(),
    ]
}


def get_provider(name: str) -> LLMProvider | None:
    return _PROVIDERS.get(name)


def all_providers() -> list[LLMProvider]:
    return list(_PROVIDERS.values())
