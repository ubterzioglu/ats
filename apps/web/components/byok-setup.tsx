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
    <div className="space-y-4 rounded-control border border-line bg-bench p-5 sm:p-6 text-sm">
      <div className="space-y-2">
        <h3 className="font-semibold">{t("heading")}</h3>
        <p className="text-muted leading-relaxed">
          {t("intro")}
        </p>
      </div>

      <div className="space-y-3">
        <label className="block">
          <span className="block text-xs font-medium text-muted mb-1 uppercase condensed">{t("endpointLabel")}</span>
          <input 
            type="url" 
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            className="w-full bg-bench-sunk border border-line rounded-control px-3 py-2 focus:border-action focus:outline-none text-ink font-mono text-sm"
            placeholder="https://api.openai.com/v1"
          />
        </label>
        <label className="block">
          <span className="block text-xs font-medium text-muted mb-1 uppercase condensed">{t("modelLabel")}</span>
          <input 
            type="text" 
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full bg-bench-sunk border border-line rounded-control px-3 py-2 focus:border-action focus:outline-none text-ink font-mono text-sm"
            placeholder="gpt-4o-mini"
          />
        </label>
        <label className="block">
          <span className="block text-xs font-medium text-muted mb-1 uppercase condensed">{t("keyLabel")}</span>
          <input 
            type="password" 
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full bg-bench-sunk border border-line rounded-control px-3 py-2 focus:border-action focus:outline-none text-ink font-mono text-sm"
            placeholder="sk-..."
          />
        </label>
      </div>

      <div className="pt-2">
        <button 
          type="button"
          onClick={handleSave}
          disabled={!endpoint || !apiKey || !model}
          className="w-full sm:w-auto bg-ink text-bench px-4 py-2 rounded-control font-medium disabled:opacity-50 transition-opacity"
        >
          {t("save")}
        </button>
      </div>
    </div>
  );
}
