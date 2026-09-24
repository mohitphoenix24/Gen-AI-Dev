import Sparkle from "./Sparkle";

const SUGGESTIONS = [
  { label: "Explain this code", prompt: "Explain what this code does:\n\n" },
  { label: "Debug an error", prompt: "Help me debug this error:\n\n" },
  { label: "Learn a concept", prompt: "Explain, simply, how " },
  { label: "Build something", prompt: "Help me build " },
];

export default function EmptyState({ onSuggestion }) {
  return (
    <div className="empty-state">
      <Sparkle className="empty-state-mark" />
      <h1>What can I help you build?</h1>
      <p>Ask a question, explore an idea, or work through a technical problem.</p>

      <div className="suggestion-grid">
        {SUGGESTIONS.map((s) => (
          <button
            type="button"
            key={s.label}
            className="suggestion-chip"
            onClick={() => onSuggestion(s.prompt)}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
