import ModelIcon from "./ModelIcon";
import { usePopover } from "../hooks/usePopover";

// "cloud"/"local" are the only kind values the backend currently sends
// (providers/base.py). This just controls display order for those two -
// any provider within either bucket is still discovered entirely from data.
const KIND_ORDER = ["cloud", "local"];

function groupByKind(models) {
  const groups = new Map();
  for (const m of models) {
    if (!groups.has(m.kind)) groups.set(m.kind, []);
    groups.get(m.kind).push(m);
  }
  const ordered = new Map();
  for (const kind of KIND_ORDER) if (groups.has(kind)) ordered.set(kind, groups.get(kind));
  for (const [kind, group] of groups) if (!ordered.has(kind)) ordered.set(kind, group);
  return ordered;
}

function titleCase(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function ChevronIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" {...props} aria-hidden="true">
      <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
    </svg>
  );
}

export default function ModelSelector({ models, status, selectedId, onChange, disabled }) {
  const { isOpen, setIsOpen, rootRef } = usePopover();

  if (status === "loading") {
    return <div className="model-trigger model-trigger-pending">Loading models…</div>;
  }
  if (status === "error") {
    return <div className="model-trigger model-trigger-pending">Backend unavailable</div>;
  }
  if (models.length === 0) {
    return <div className="model-trigger model-trigger-pending">No models available</div>;
  }

  const selected = models.find((m) => m.id === selectedId);
  const groups = groupByKind(models);

  function select(model) {
    if (!model.available) return;
    onChange(model.id);
    setIsOpen(false);
  }

  return (
    <div className="model-selector" ref={rootRef}>
      <button
        type="button"
        className="model-trigger"
        onClick={() => setIsOpen((v) => !v)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {selected && <ModelIcon provider={selected.provider} className="model-trigger-icon" />}
        <span className="model-trigger-text">
          <span className="model-trigger-label">{selected ? selected.label : "Select a model"}</span>
          {selected && <span className="model-trigger-caption">{titleCase(selected.kind)}</span>}
        </span>
        {selected && <span className={`status-dot ${selected.available ? "ok" : "bad"}`} />}
        <ChevronIcon className={`model-trigger-chevron ${isOpen ? "is-open" : ""}`} />
      </button>

      {isOpen && (
        <div className="model-popover" role="listbox">
          <div className="model-popover-title">Models</div>
          {[...groups.entries()].map(([kind, group]) => (
            <div className="model-popover-group" key={kind}>
              <div className="model-popover-group-label">{titleCase(kind)}</div>
              {group.map((m) => (
                <button
                  type="button"
                  key={m.id}
                  role="option"
                  aria-selected={m.id === selectedId}
                  className={`model-option ${m.id === selectedId ? "is-selected" : ""}`}
                  disabled={!m.available}
                  onClick={() => select(m)}
                >
                  <ModelIcon provider={m.provider} className="model-option-icon" />
                  <span className="model-option-text">
                    <span className="model-option-label">{m.label}</span>
                    <span className="model-option-caption">
                      {m.available ? titleCase(m.provider) : m.unavailableReason || "Unavailable"}
                    </span>
                  </span>
                  <span className="model-option-status">
                    <span className={`status-dot ${m.available ? "ok" : "bad"}`} />
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
