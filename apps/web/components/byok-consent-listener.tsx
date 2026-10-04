"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

interface ByokConsentRequest {
  readonly endpoint: string;
  readonly resolve: (approved: boolean) => void;
}

export function ByokConsentListener() {
  const t = useTranslations("byokSetup");
  const [request, setRequest] = useState<ByokConsentRequest | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<ByokConsentRequest>;
      setRequest(customEvent.detail);
    };
    window.addEventListener("byok-consent-request", handler);
    return () => window.removeEventListener("byok-consent-request", handler);
  }, []);

  if (!request) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/10 p-4">
      <div className="bg-sheet rounded-modal shadow-float max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200 border border-line">
        <h2 className="text-lg font-semibold">{t("consentHeading")}</h2>
        <p className="text-sm text-muted leading-relaxed">
          {t("consentIntro")}
        </p>
        <div className="bg-bench-sunk rounded-control p-3 text-sm font-mono text-ink border border-line break-all">
          {request.endpoint}
        </div>
        <p className="text-sm text-caution-ink font-medium bg-caution/[0.08] border border-caution/40 p-3 rounded-control">
          {t("consentWarning")}
        </p>
        <div className="flex justify-end gap-3 pt-2">
          <button 
            type="button"
            className="px-4 py-2 text-sm font-medium hover:bg-bench-sunk transition-colors rounded-control border border-transparent"
            onClick={() => {
              request.resolve(false);
              setRequest(null);
            }}
          >
            {t("consentReject")}
          </button>
          <button 
            type="button"
            className="px-4 py-2 text-sm font-medium bg-action text-white hover:opacity-90 transition-opacity rounded-control shadow-sm"
            onClick={() => {
              request.resolve(true);
              setRequest(null);
            }}
          >
            {t("consentApprove")}
          </button>
        </div>
      </div>
    </div>
  );
}
