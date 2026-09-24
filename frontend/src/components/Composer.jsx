import { useEffect, useRef, useState } from "react";

const MAX_HEIGHT_PX = 200;

function SendIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...props} aria-hidden="true">
      <path fill="currentColor" d="M3 11l18-8-8 18-2-8-8-2z" />
    </svg>
  );
}

function StopIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" {...props} aria-hidden="true">
      <rect x="5" y="5" width="14" height="14" rx="2" fill="currentColor" />
    </svg>
  );
}

// `prefill` is {text, key} - a suggestion chip click bumps `key` so this
// effect re-fires even if the same suggestion is clicked twice in a row.
export default function Composer({ onSend, onStop, isStreaming, disabled, prefill }) {
  const [value, setValue] = useState("");
  const textareaRef = useRef(null);

  function resize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto"; // shrink first, so it can shrink back down too
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT_PX)}px`;
  }

  useEffect(() => {
    if (!prefill) return;
    setValue(prefill.text);
    requestAnimationFrame(() => {
      resize();
      textareaRef.current?.focus();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill?.key]);

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || isStreaming || disabled) return; // guards accidental double-submits

    onSend(trimmed);
    setValue("");
    // Reset the height after React clears the value and re-renders.
    requestAnimationFrame(() => {
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    });
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <form className="composer" onSubmit={handleSubmit}>
      <div className="composer-surface">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            resize();
          }}
          onKeyDown={handleKeyDown}
          placeholder={disabled && !isStreaming ? "Loading models..." : "Ask anything..."}
          disabled={disabled}
          rows={1}
        />

        <div className="composer-row">
          <span className="composer-hint">Enter to send · Shift + Enter for newline</span>

          {isStreaming ? (
            <button type="button" className="stop-button" onClick={onStop} title="Stop generating">
              <StopIcon />
            </button>
          ) : (
            <button type="submit" disabled={disabled || !value.trim()} title="Send">
              <SendIcon />
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
