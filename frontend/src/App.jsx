import { useEffect, useState } from "react";
import "./App.css";
import Header from "./components/Header";
import ModelSelector from "./components/ModelSelector";
import ChatWindow from "./components/ChatWindow";
import Composer from "./components/Composer";
import { useModels } from "./hooks/useModels";
import { useChat } from "./hooks/useChat";

export default function App() {
  const { models, status: modelsStatus, error: modelsError } = useModels();
  const [selectedModelId, setSelectedModelId] = useState("");
  const [prefill, setPrefill] = useState(null);
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
        <ModelSelector
          models={models}
          status={modelsStatus}
          selectedId={selectedModelId}
          onChange={setSelectedModelId}
          disabled={isStreaming}
        />
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
        onSend={(question) => sendMessage(question, selectedModel)}
        onStop={stopGeneration}
        isStreaming={isStreaming}
        disabled={isStreaming || !selectedModel}
        prefill={prefill}
      />
    </div>
  );
}
