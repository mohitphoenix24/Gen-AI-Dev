import { useEffect, useRef } from "react";
import ChatMessage from "./ChatMessage";
import EmptyState from "./EmptyState";

const BOTTOM_THRESHOLD_PX = 80;

/**
 * Auto-scrolls to the newest content, but only while the user is already
 * near the bottom. Once they scroll up to read something earlier, streaming
 * tokens stop yanking them back down. Uses a direct scrollTop jump instead
 * of scrollIntoView({behavior: "smooth"}) - during token-by-token streaming
 * that would otherwise queue up a new smooth-scroll animation per token.
 */
export default function ChatWindow({ messages, onSuggestion, onRegenerate }) {
  const containerRef = useRef(null);
  const pinnedToBottomRef = useRef(true);

  function handleScroll() {
    const el = containerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    pinnedToBottomRef.current = distanceFromBottom < BOTTOM_THRESHOLD_PX;
  }

  useEffect(() => {
    const el = containerRef.current;
    if (el && pinnedToBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  return (
    <main className="chat" ref={containerRef} onScroll={handleScroll}>
      {messages.length === 0 ? (
        <EmptyState onSuggestion={onSuggestion} />
      ) : (
        messages.map((msg) => <ChatMessage key={msg.id} message={msg} onRegenerate={onRegenerate} />)
      )}
    </main>
  );
}
