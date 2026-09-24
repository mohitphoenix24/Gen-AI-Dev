"""
The contract every LLM provider implements.

server.py never checks "if provider == claude" anywhere -- it only ever
calls these four methods. That's what makes adding a new provider (OpenAI,
Gemini, ...) a matter of writing one new file, not editing the gateway.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Iterator, Optional


@dataclass
class ModelInfo:
    id: str  # "<provider>:<model>", e.g. "claude:claude-opus-5" -- what the frontend sends back
    label: str  # human-readable name shown in the model picker
    provider: str
    available: bool
    unavailable_reason: Optional[str] = None
    # "cloud" or "local" -- lets the UI group/label models (e.g. "Cloud" vs
    # "Local" sections) without hardcoding provider names to guess at it.
    kind: str = "cloud"


class LLMProvider(ABC):
    name: str  # short id used as the "<name>:" prefix in model ids, e.g. "claude"

    @abstractmethod
    def is_available(self) -> bool:
        """Whether this provider is configured and reachable right now."""

    def unavailable_reason(self) -> Optional[str]:
        """Human-readable explanation for why is_available() is False. Override to customize."""
        return None if self.is_available() else f"{self.name} is not available"

    @abstractmethod
    def list_models(self) -> list[ModelInfo]:
        """Models this provider can currently serve."""

    @abstractmethod
    def stream(
        self,
        model: str,
        messages: list[dict],
        *,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> Iterator[str]:
        """
        Answer `messages` with `model`, yielding response text as it arrives.

        `messages` is the whole conversation so far, oldest first, each one
        `{"role": "user" | "assistant", "content": str}` - the last entry is
        the newest question. This is what gives Step 1 actual conversational
        memory: every provider already accepts a message history natively
        (Gemini's SDK is the one exception that needs translating into its
        own shape - see llm/gemini.py), so passing the whole thing through
        instead of a single string costs nothing.

        `temperature` and `max_tokens` are optional generation controls from
        the UI. A provider that doesn't support one should just ignore it
        rather than raise.

        Provider-specific errors (a bad API key, a network timeout, ...) should
        simply be allowed to raise -- the gateway (streaming.py) turns any
        exception into a normalized SSE error event, so providers never need
        to know that SSE exists.
        """
