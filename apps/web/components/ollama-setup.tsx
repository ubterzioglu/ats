"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { createOllamaProvider, listOllamaModels, OLLAMA_DEFAULT_MODEL } from "@/lib/ai/providers/ollama";
import type { ProviderHealth } from "@/lib/ai/providers/types";
import { cx } from "@/lib/ui";

interface OllamaSetupProps {
  readonly onReady?: () => void;
}

export function OllamaSetup({ onReady }: OllamaSetupProps) {
  const t = useTranslations("ollamaSetup");
  const [origin, setOrigin] = useState<string>("http://localhost:3000");
  const [testing, setTesting] = useState(false);
  const [health, setHealth] = useState<ProviderHealth | null>(null);
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState(OLLAMA_DEFAULT_MODEL);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  async function testConnection() {
    setTesting(true);
    setHealth(null);
    try {
      const availableModels = await listOllamaModels();
      setModels(availableModels);

      const provider = createOllamaProvider(selectedModel);
      const result = await provider.health();
      setHealth(result);
      
      if (result.ok) {
        onReady?.();
      }
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="space-y-6 text-sm">
      <div className="space-y-2">
        <h3 className="font-normal">{t("heading")}</h3>
        <p className="text-muted leading-relaxed">
          {t("intro")}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="font-normal text-xs uppercase condensed text-muted mb-2">macOS / Linux</h4>
          <code className="block border-b border-line py-2 font-mono text-xs">
            OLLAMA_ORIGINS=&quot;{origin}&quot; ollama serve
          </code>
        </div>
        
        <div>
          <h4 className="font-normal text-xs uppercase condensed text-muted mb-2">Windows (Command Prompt)</h4>
          <code className="block border-b border-line py-2 font-mono text-xs">
            set OLLAMA_ORIGINS={origin}<br/>
            ollama serve
          </code>
        </div>
        
        <div>
          <h4 className="font-normal text-xs uppercase condensed text-muted mb-2">Windows (PowerShell)</h4>
          <code className="block border-b border-line py-2 font-mono text-xs">
            $env:OLLAMA_ORIGINS=&quot;{origin}&quot;<br/>
            ollama serve
          </code>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <label className="flex-1 w-full relative">
            <span className="sr-only">{t("modelLabel")}</span>
            <input 
              type="text" 
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="field"
              placeholder={OLLAMA_DEFAULT_MODEL}
              list="ollama-models"
            />
            {models.length > 0 && (
              <datalist id="ollama-models">
                {models.map(m => <option key={m} value={m} />)}
              </datalist>
            )}
          </label>
          <button 
            type="button"
            onClick={testConnection}
            disabled={testing || !selectedModel}
            className="btn-quiet"
          >
            {testing ? t("testing") : t("testConnection")}
          </button>
        </div>
        
        {health && (
          <div className={cx(
            "p-3 rounded-control text-sm border",
            health.ok ? "border-good text-good" : "border-caution text-caution"
          )}>
            {health.detail}
          </div>
        )}
      </div>
    </div>
  );
}
