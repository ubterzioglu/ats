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

  // Dala inner-page adaptation: a dialog has to separate itself from the page
  // beneath it, so it is solid black with the one allowed hairline. No shadow.
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-void/90 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="byok-consent-heading"
        className="w-full max-w-md space-y-6 border border-line bg-void p-8"
      >
        <h2 id="byok-consent-heading" className="text-heading-2xs font-normal">
          {t("consentHeading")}
        </h2>
        <p className="text-sm leading-relaxed text-muted">{t("consentIntro")}</p>
        <p className="break-all border-b border-line pb-2 font-mono text-sm text-ink">
          {request.endpoint}
        </p>
        <p className="border-l-2 border-saffron pl-4 text-sm text-saffron">{t("consentWarning")}</p>
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            className="btn-quiet"
            onClick={() => {
              request.resolve(false);
              setRequest(null);
            }}
          >
            {t("consentReject")}
          </button>
          <button
            type="button"
            className="btn"
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
