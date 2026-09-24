import { useCallback, useRef, useState } from "react";
import { streamChat } from "../api/llm";
import { nextId } from "../utils/id";

// What the backend accepts: just role + content, oldest first. Drops every
// UI-only field (status, model, ids, ...) and skips anything that isn't a
// finished answer - a still-streaming or errored-out message was never
// really "said", so it shouldn't be replayed into the next request as if
// the model had said it.
function toApiMessages(messages) {
  return messages
    .filter((m) => m.role === "user" || (m.role === "assistant" && m.status === "complete"))
    .map((m) => ({ role: m.role, content: m.content }));
}

/**
 * Owns chat state and behavior: the message list, whether a request is in
 * flight, sending a question, and cancelling it. Components only ever read
 * `messages`/`isStreaming` and call `sendMessage`/`stopGeneration` - they
 * never touch streamChat() or SSE directly.
 *
 * Every call sends the full message history, not just the latest question -
 * that's what gives the model memory of earlier turns in the conversation.
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
    async (question, selectedModel, { temperature, maxTokens } = {}) => {
      const trimmed = question.trim();
      if (!trimmed || isStreaming || !selectedModel) return;

      // Built from state as it is *before* this turn - the API payload
      // needs the prior history plus the new question appended once, not
      // however React ends up batching the state update below.
      const apiMessages = [...toApiMessages(messages), { role: "user", content: trimmed }];

      const userMessage = { id: nextId(), role: "user", content: trimmed, status: "complete" };
      const assistantId = nextId();
      const assistantMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        model: selectedModel.id,
        modelLabel: selectedModel.label,
        provider: selectedModel.provider,
        temperature,
        maxTokens,
        status: "streaming",
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setIsStreaming(true);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      await streamChat({
        messages: apiMessages,
        model: selectedModel.id,
        temperature,
        maxTokens,
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
    [isStreaming, messages, patchMessage]
  );

  // Re-runs the question behind one assistant message, replacing that
  // message's content in place rather than appending a new pair - so
  // "regenerate" doesn't duplicate the user's question in the transcript.
  // Reuses the exact model/temperature/max_tokens that message was
  // originally generated with, not whatever the UI currently has selected.
  const regenerate = useCallback(
    async (assistantId) => {
      if (isStreaming) return;

      const index = messages.findIndex((m) => m.id === assistantId);
      const userMessage = messages[index - 1];
      const target = messages[index];
      if (!userMessage || userMessage.role !== "user" || !target) return;

      const apiMessages = [...toApiMessages(messages.slice(0, index - 1)), { role: "user", content: userMessage.content }];

      patchMessage(assistantId, { content: "", status: "streaming" });
      setIsStreaming(true);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      await streamChat({
        messages: apiMessages,
        model: target.model,
        temperature: target.temperature,
        maxTokens: target.maxTokens,
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
