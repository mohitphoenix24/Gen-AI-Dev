import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import CodeBlock from "./CodeBlock";

// react-markdown gives every fenced AND inline `code` span the same `code`
// element - the only distinguishing signal is the `language-xxx` class GFM
// attaches to fenced blocks. Inline spans never get a className, so we treat
// anything without one (that also isn't multi-line) as inline.
function CodeRenderer({ className, children }) {
  const match = /language-(\w+)/.exec(className || "");
  const codeString = String(children).replace(/\n$/, "");
  const isBlock = Boolean(match) || codeString.includes("\n");

  if (isBlock) {
    return <CodeBlock language={match?.[1]} code={codeString} />;
  }
  return <code className="inline-code">{children}</code>;
}

function LinkRenderer({ href, children }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

// Wrap tables in a scrollable container so a wide table scrolls horizontally
// instead of blowing out the chat width.
function TableRenderer({ children }) {
  return (
    <div className="table-wrap">
      <table>{children}</table>
    </div>
  );
}

const components = {
  code: CodeRenderer,
  a: LinkRenderer,
  table: TableRenderer,
};

/**
 * Renders one message's Markdown content. Re-parses `content` on every call,
 * which is deliberate: streaming appends text to `content` and this
 * component re-renders on every delta, but remark/rehype are simple,
 * stateless, non-throwing parsers - they never fail on the malformed
 * mid-token Markdown a partial stream produces (an unterminated ``` or `),
 * they just render it as best they can until the closing token arrives.
 */
export default function MarkdownRenderer({ content }) {
  return (
    <div className="markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        // KaTeX throws a hard ParseError on invalid LaTeX by default - and
        // "invalid LaTeX" includes ordinary prose that happens to contain
        // two bare $ signs (e.g. "costs $5 and $10"). throwOnError renders
        // an inline error instead of throwing, so one bad expression can't
        // take down the whole message.
        rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false }]]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
