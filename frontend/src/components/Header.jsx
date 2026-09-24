import Sparkle from "./Sparkle";

export default function Header({ children }) {
  return (
    <header className="topbar">
      <div className="brand">
        <Sparkle className="brand-mark" />
        <div className="brand-text">
          <span className="brand-word">Lumen</span>
          <span className="brand-sub">Step 1 · Basic LLM Call</span>
        </div>
      </div>
      {children}
    </header>
  );
}
