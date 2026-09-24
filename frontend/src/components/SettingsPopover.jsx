import { usePopover } from "../hooks/usePopover";

const TEMPERATURE_MIN = 0;
const TEMPERATURE_MAX = 2;
const TEMPERATURE_STEP = 0.1;
const MAX_TOKENS_MIN = 1;
const MAX_TOKENS_MAX = 8000;

function SlidersIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" {...props} aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        d="M4 7h9M17 7h3M4 17h3M11 17h9M8 4.5v5M20 14.5v5"
      />
    </svg>
  );
}

export default function SettingsPopover({ temperature, onTemperatureChange, maxTokens, onMaxTokensChange, disabled }) {
  const { isOpen, setIsOpen, rootRef } = usePopover();

  return (
    <div className="settings-selector" ref={rootRef}>
      <button
        type="button"
        className="settings-trigger"
        onClick={() => setIsOpen((v) => !v)}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        title="Generation settings"
      >
        <SlidersIcon />
      </button>

      {isOpen && (
        <div className="settings-popover" role="dialog" aria-label="Generation settings">
          <div className="settings-popover-title">Generation settings</div>

          <label className="settings-field">
            <span className="settings-field-label">
              Temperature
              <span className="settings-field-value">{temperature.toFixed(1)}</span>
            </span>
            <input
              type="range"
              min={TEMPERATURE_MIN}
              max={TEMPERATURE_MAX}
              step={TEMPERATURE_STEP}
              value={temperature}
              onChange={(e) => onTemperatureChange(Number(e.target.value))}
            />
            <span className="settings-field-hint">Lower is more focused and deterministic, higher is more varied.</span>
          </label>

          <label className="settings-field">
            <span className="settings-field-label">Max tokens</span>
            <input
              type="number"
              min={MAX_TOKENS_MIN}
              max={MAX_TOKENS_MAX}
              value={maxTokens}
              onChange={(e) => {
                const next = Number(e.target.value);
                if (Number.isFinite(next)) onMaxTokensChange(Math.min(Math.max(next, MAX_TOKENS_MIN), MAX_TOKENS_MAX));
              }}
            />
            <span className="settings-field-hint">Upper limit on how long a single response can get.</span>
          </label>
        </div>
      )}
    </div>
  );
}
