import { useEffect, useState } from "react";
import "./App.css";
import Header from "./components/Header";
import ModelSelector from "./components/ModelSelector";
import SettingsPopover from "./components/SettingsPopover";
import ChatWindow from "./components/ChatWindow";
import Composer from "./components/Composer";
import { useModels } from "./hooks/useModels";
import { useChat } from "./hooks/useChat";

const DEFAULT_TEMPERATURE = 1.0;
const DEFAULT_MAX_TOKENS = 1024;

export default function App() {
  const { models, status: modelsStatus, error: modelsError } = useModels();
  const [selectedModelId, setSelectedModelId] = useState("");
  const [prefill, setPrefill] = useState(null);
  const [temperature, setTemperature] = useState(DEFAULT_TEMPERATURE);
  const [maxTokens, setMaxTokens] = useState(DEFAULT_MAX_TOKENS);
  const { messages, isStreaming, sendMessage, stopGeneration, regenerate } = useChat();

  // Once the catalog loads, default to the first model that's actually usable.
  useEffect(() => {
    if (selectedModelId || models.length === 0) return;
    const firstAvailable = models.find((m) => m.available);
    if (firstAvailable) setSelectedModelId(firstAvailable.id);
  }, [models, selectedModelId]);

  const selectedModel = models.find((m) => m.id === selectedModelId);

  return (
    <div className="app">
      <Header>
        <div className="header-controls">
          <SettingsPopover
            temperature={temperature}
            onTemperatureChange={setTemperature}
            maxTokens={maxTokens}
            onMaxTokensChange={setMaxTokens}
            disabled={isStreaming}
          />
          <ModelSelector
            models={models}
            status={modelsStatus}
            selectedId={selectedModelId}
            onChange={setSelectedModelId}
            disabled={isStreaming}
          />
        </div>
      </Header>

      {modelsStatus === "error" && <div className="banner banner-error">{modelsError}</div>}
      {selectedModel && !selectedModel.available && (
        <div className="banner banner-warning">
          {selectedModel.unavailableReason}. Choose another model, or fix the backend configuration.
        </div>
      )}

      <ChatWindow
        messages={messages}
        onSuggestion={(text) => setPrefill({ text, key: Date.now() })}
        onRegenerate={regenerate}
      />

      <Composer
        onSend={(question) => sendMessage(question, selectedModel, { temperature, maxTokens })}
        onStop={stopGeneration}
        isStreaming={isStreaming}
        disabled={isStreaming || !selectedModel}
        prefill={prefill}
      />
    </div>
  );
}
