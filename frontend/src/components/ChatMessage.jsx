import ModelIcon from "./ModelIcon";
import MarkdownRenderer from "./MarkdownRenderer";
import { useCopyFeedback } from "../hooks/useCopyFeedback";

function CopyIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" {...props} aria-hidden="true">
      <rect x="8" y="8" width="12" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 16V5a1 1 0 0 1 1-1h11" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function RegenerateIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" {...props} aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4"
      />
    </svg>
  );
}

export default function ChatMessage({ message, onRegenerate }) {
  const { id, role, content, modelLabel, provider, status } = message;
  const [copied, copy] = useCopyFeedback();
  // Errors are short plain strings ("ANTHROPIC_API_KEY is not set...") -
  // rendering them as Markdown would be pointless, so only real assistant
  // answers get the full renderer. User messages stay plain text too.
  const renderAsMarkdown = role === "assistant" && status !== "error";
  const showActions = role === "assistant" && status === "complete";

  return (
    <div className={`message ${role} ${status === "error" ? "error" : ""}`}>
      {role === "assistant" && modelLabel && (
        <div className="message-meta">
          <ModelIcon provider={provider} />
          {modelLabel}
          {status === "streaming" && (
            <span className="generating">
              <span className="generating-dot" />
              Generating
            </span>
          )}
        </div>
      )}
      <div className="bubble">
        {renderAsMarkdown ? <MarkdownRenderer content={content} /> : content}
        {status === "streaming" && <span className="cursor" />}
      </div>

      {showActions && (
        <div className="message-actions">
          <button type="button" onClick={() => copy(content)}>
            <CopyIcon />
            {copied ? "Copied" : "Copy"}
          </button>
          <button type="button" onClick={() => onRegenerate?.(id)}>
            <RegenerateIcon />
            Regenerate
          </button>
        </div>
      )}
    </div>
  );
}
