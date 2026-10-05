"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { getByokConfig, setByokConfig } from "@/lib/ai/providers/byok";

interface ByokSetupProps {
  readonly onReady?: () => void;
}

export function ByokSetup({ onReady }: ByokSetupProps) {
  const t = useTranslations("byokSetup");
  const [endpoint, setEndpoint] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");

  useEffect(() => {
    const config = getByokConfig();
    setEndpoint(config.endpoint);
    setApiKey(config.apiKey);
    setModel(config.model);
  }, []);

  function handleSave() {
    setByokConfig({ endpoint, apiKey, model });
    onReady?.();
  }

  return (
    <div className="space-y-4 text-sm">
      <div className="space-y-2">
        <h3 className="font-normal">{t("heading")}</h3>
        <p className="text-muted leading-relaxed">
          {t("intro")}
        </p>
      </div>

      <div className="space-y-3">
        <label className="block">
          <span className="block text-xs font-normal text-muted mb-1 uppercase condensed">{t("endpointLabel")}</span>
          <input 
            type="url" 
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            className="field font-mono"
            placeholder="https://api.openai.com/v1"
          />
        </label>
        <label className="block">
          <span className="block text-xs font-normal text-muted mb-1 uppercase condensed">{t("modelLabel")}</span>
          <input 
            type="text" 
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="field font-mono"
            placeholder="gpt-4o-mini"
          />
        </label>
        <label className="block">
          <span className="block text-xs font-normal text-muted mb-1 uppercase condensed">{t("keyLabel")}</span>
          <input 
            type="password" 
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="field font-mono"
            placeholder="sk-..."
          />
        </label>
      </div>

      <div className="pt-2">
        <button 
          type="button"
          onClick={handleSave}
          disabled={!endpoint || !apiKey || !model}
          className="btn-quiet"
        >
          {t("save")}
        </button>
      </div>
    </div>
  );
}
