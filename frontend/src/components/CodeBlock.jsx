import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useCopyFeedback } from "../hooks/useCopyFeedback";

import bash from "react-syntax-highlighter/dist/esm/languages/prism/bash";
import cpp from "react-syntax-highlighter/dist/esm/languages/prism/cpp";
import css from "react-syntax-highlighter/dist/esm/languages/prism/css";
import go from "react-syntax-highlighter/dist/esm/languages/prism/go";
import java from "react-syntax-highlighter/dist/esm/languages/prism/java";
import javascript from "react-syntax-highlighter/dist/esm/languages/prism/javascript";
import json from "react-syntax-highlighter/dist/esm/languages/prism/json";
import jsx from "react-syntax-highlighter/dist/esm/languages/prism/jsx";
import markdown from "react-syntax-highlighter/dist/esm/languages/prism/markdown";
import markup from "react-syntax-highlighter/dist/esm/languages/prism/markup"; // HTML/XML
import python from "react-syntax-highlighter/dist/esm/languages/prism/python";
import rust from "react-syntax-highlighter/dist/esm/languages/prism/rust";
import sql from "react-syntax-highlighter/dist/esm/languages/prism/sql";
import tsx from "react-syntax-highlighter/dist/esm/languages/prism/tsx";
import typescript from "react-syntax-highlighter/dist/esm/languages/prism/typescript";
import yaml from "react-syntax-highlighter/dist/esm/languages/prism/yaml";

// Registering only the languages we actually want keeps the bundle small -
// the full Prism build ships ~250 grammars we'll never use. Each language is
// registered under every alias a model is likely to put after ``` (```js,
// ```py, ...).
const LANGUAGES = {
  javascript,
  js: javascript,
  jsx,
  typescript,
  ts: typescript,
  tsx,
  python,
  py: python,
  bash,
  sh: bash,
  shell: bash,
  json,
  html: markup,
  xml: markup,
  css,
  sql,
  yaml,
  yml: yaml,
  markdown,
  md: markdown,
  java,
  cpp,
  "c++": cpp,
  c: cpp,
  go,
  rust,
  rs: rust,
};

for (const [alias, grammar] of Object.entries(LANGUAGES)) {
  SyntaxHighlighter.registerLanguage(alias, grammar);
}

export default function CodeBlock({ language, code }) {
  const [copied, copy] = useCopyFeedback();
  const normalized = (language || "").toLowerCase();
  const highlightable = normalized in LANGUAGES;

  return (
    <div className="code-block">
      <div className="code-block-header">
        <span className="code-block-lang">{language || "text"}</span>
        <button
          type="button"
          className={`code-block-copy ${copied ? "copied" : ""}`}
          onClick={() => copy(code)}
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>

      {highlightable ? (
        <SyntaxHighlighter
          language={normalized}
          style={oneDark}
          // Default PreTag ("pre") so the .code-block pre rules in App.css
          // actually govern padding/overflow, instead of relying on
          // whatever the theme object happens to set inline.
          customStyle={{ margin: 0, padding: "12px 14px", background: "transparent" }}
        >
          {code}
        </SyntaxHighlighter>
      ) : (
        <pre className="code-block-plain">
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}
