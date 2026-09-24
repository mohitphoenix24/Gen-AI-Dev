/**
 * All HTTP/SSE communication with the LLM gateway lives here. Nothing in
 * React (components or hooks) makes a fetch() call or parses SSE directly -
 * they only see the plain JS results/callbacks this module produces.
 */

export const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

/** GET /api/models -> the list of models every registered provider currently offers. */
export async function getModels() {
  const res = await fetch(`${API_BASE}/api/models`);
  if (!res.ok) {
    throw new Error(`Failed to load models (${res.status})`);
  }
  const data = await res.json();
  return data.models;
}

/**
 * Streams one answer from POST /api/ask/stream and reports it through
 * callbacks as it arrives. Understands the backend's SSE event protocol
 * (start/delta/done/error) so nothing above this function has to.
 *
 * `messages` is the whole conversation so far (oldest first, last entry is
 * the newest question) - that's what gives the model actual memory of
 * earlier turns instead of answering each message in isolation.
 *
 * Pass `signal` from an AbortController to make the request cancellable -
 * aborting calls `onAbort` instead of `onError`, since it was requested,
 * not a failure.
 */
export async function streamChat({
  messages,
  model,
  temperature,
  maxTokens,
  onStart,
  onDelta,
  onDone,
  onError,
  onAbort,
  signal,
}) {
  let response;
  try {
    response = await fetch(`${API_BASE}/api/ask/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, model, temperature, max_tokens: maxTokens }),
      signal,
    });
  } catch (err) {
    if (err.name === "AbortError") return onAbort?.();
    return onError?.("Could not reach the backend. Is server.py running?");
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    return onError?.(body.error || `Request failed (${response.status})`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finished = false; // did a "done" or "error" event actually arrive?

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      // A network chunk can contain several SSE messages, or only part of
      // one - split on the SSE message separator and keep whatever's left
      // over (an incomplete final message) in the buffer for the next read.
      buffer += decoder.decode(value, { stream: true });
      const frames = buffer.split("\n\n");
      buffer = frames.pop();

      for (const frame of frames) {
        const line = frame.trim();
        if (!line.startsWith("data:")) continue; // ignore blank lines / SSE comments

        let payload;
        try {
          payload = JSON.parse(line.slice(5).trim());
        } catch {
          console.warn("Skipping malformed SSE message:", line);
          continue;
        }

        if (payload.type === "start") onStart?.();
        else if (payload.type === "delta") onDelta?.(payload.text);
        else if (payload.type === "done") {
          finished = true;
          onDone?.();
        } else if (payload.type === "error") {
          finished = true;
          onError?.(payload.message);
        }
        // Unknown event types are ignored rather than treated as fatal, so
        // the backend can grow new event types (e.g. tool_start, thinking)
        // later without breaking clients that don't understand them yet.
      }
    }
  } catch (err) {
    if (err.name === "AbortError") return onAbort?.();
    return onError?.(`Connection lost: ${err.message}`);
  }

  if (!finished) {
    onError?.("Connection closed unexpectedly before the response finished.");
  }
}
