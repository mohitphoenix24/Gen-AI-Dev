import { useCallback, useRef, useState } from "react";
import { streamChat } from "../api/llm";
import { nextId } from "../utils/id";

/**
 * Owns chat state and behavior: the message list, whether a request is in
 * flight, sending a question, and cancelling it. Components only ever read
 * `messages`/`isStreaming` and call `sendMessage`/`stopGeneration` - they
 * never touch streamChat() or SSE directly.
 */
export function useChat() {
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef(null);

  // Update one message by id, either with a partial object or an updater
  // function - used for streaming deltas, which need the previous content.
  const patchMessage = useCallback((id, patch) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, ...(typeof patch === "function" ? patch(m) : patch) } : m
      )
    );
  }, []);

  const sendMessage = useCallback(
    async (question, selectedModel) => {
      const trimmed = question.trim();
      if (!trimmed || isStreaming || !selectedModel) return;

      const userMessage = { id: nextId(), role: "user", content: trimmed, status: "complete" };
      const assistantId = nextId();
      const assistantMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        model: selectedModel.id,
        modelLabel: selectedModel.label,
        provider: selectedModel.provider,
        status: "streaming",
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setIsStreaming(true);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      await streamChat({
        question: trimmed,
        model: selectedModel.id,
        signal: controller.signal,
        onDelta: (text) => patchMessage(assistantId, (m) => ({ content: m.content + text })),
        onDone: () => patchMessage(assistantId, { status: "complete" }),
        onError: (message) => patchMessage(assistantId, { status: "error", content: message }),
        // Stopped by the user, not a failure - keep whatever text streamed in so far.
        onAbort: () => patchMessage(assistantId, { status: "complete" }),
      });

      abortControllerRef.current = null;
      setIsStreaming(false);
    },
    [isStreaming, patchMessage]
  );

  // Re-runs the question behind one assistant message, replacing that
  // message's content in place rather than appending a new pair - so
  // "regenerate" doesn't duplicate the user's question in the transcript.
  const regenerate = useCallback(
    async (assistantId) => {
      if (isStreaming) return;

      const index = messages.findIndex((m) => m.id === assistantId);
      const userMessage = messages[index - 1];
      const target = messages[index];
      if (!userMessage || userMessage.role !== "user" || !target) return;

      patchMessage(assistantId, { content: "", status: "streaming" });
      setIsStreaming(true);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      await streamChat({
        question: userMessage.content,
        model: target.model,
        signal: controller.signal,
        onDelta: (text) => patchMessage(assistantId, (m) => ({ content: m.content + text })),
        onDone: () => patchMessage(assistantId, { status: "complete" }),
        onError: (message) => patchMessage(assistantId, { status: "error", content: message }),
        onAbort: () => patchMessage(assistantId, { status: "complete" }),
      });

      abortControllerRef.current = null;
      setIsStreaming(false);
    },
    [isStreaming, messages, patchMessage]
  );

  const stopGeneration = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  return { messages, isStreaming, sendMessage, stopGeneration, regenerate };
}
