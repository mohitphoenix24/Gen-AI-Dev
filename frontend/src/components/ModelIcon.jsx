function ClaudeGlyph(props) {
  return (
    <svg viewBox="0 0 24 24" {...props} aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2 2 7v10l10 5 10-5V7L12 2Zm0 2.24 7.5 3.76L12 11.76 4.5 8 12 4.24ZM4 9.62l7 3.5v6.9l-7-3.5v-6.9Zm9 10.4v-6.9l7-3.5v6.9l-7 3.5Z"
      />
    </svg>
  );
}

function OllamaGlyph(props) {
  return (
    <svg viewBox="0 0 24 24" {...props} aria-hidden="true">
      <path
        fill="currentColor"
        d="M4 4h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1h-6l-3 3v-3H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm2.5 4.5v2h2v-2h-2Zm5 0v2h2v-2h-2Z"
      />
    </svg>
  );
}

function OpenAIGlyph(props) {
  return (
    <svg viewBox="0 0 24 24" {...props} aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2a4 4 0 0 0-3.87 3 4 4 0 0 0-2.4 5.9A4 4 0 0 0 8 18a4 4 0 0 0 3.87-3 4 4 0 0 0 2.4-5.9A4 4 0 0 0 12 2Zm0 2a2 2 0 0 1 1.94 1.5l.16.62.6.24A2 2 0 0 1 15.8 9.2l-.4.5.24.6A2 2 0 0 1 14 13a2 2 0 0 1-1 .27V9.5a1 1 0 0 0-.5-.87l-3-1.73A2 2 0 0 1 12 4Zm-4.7 2.8.5.4.6-.24a2 2 0 0 1 1-.1v3.9l-3-1.73a1 1 0 0 0-1 0L2.9 10.3A2 2 0 0 1 5 7.8a2 2 0 0 1 2.3-1Z"
      />
    </svg>
  );
}

function GeminiGlyph(props) {
  return (
    <svg viewBox="0 0 24 24" {...props} aria-hidden="true">
      <path fill="currentColor" d="M12 2c0 5.5 4.5 10 10 10-5.5 0-10 4.5-10 10 0-5.5-4.5-10-10-10 5.5 0 10-4.5 10-10Z" />
    </svg>
  );
}

function GroqGlyph(props) {
  return (
    <svg viewBox="0 0 24 24" {...props} aria-hidden="true">
      <path fill="currentColor" d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
    </svg>
  );
}

/** A plain chip icon for any provider we don't have a specific glyph for yet. */
function GenericGlyph(props) {
  return (
    <svg viewBox="0 0 24 24" {...props} aria-hidden="true">
      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" />
    </svg>
  );
}

// Adding a new provider (e.g. a future "mistral") is a one-line addition
// here. Any provider not listed falls back to GenericGlyph automatically -
// it never silently inherits another provider's icon.
const PROVIDER_ICONS = {
  claude: ClaudeGlyph,
  ollama: OllamaGlyph,
  openai: OpenAIGlyph,
  gemini: GeminiGlyph,
  groq: GroqGlyph,
};

export default function ModelIcon({ provider, ...props }) {
  const Glyph = PROVIDER_ICONS[provider] || GenericGlyph;
  return <Glyph width="14" height="14" {...props} />;
}
