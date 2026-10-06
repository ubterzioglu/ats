"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { readConsent, writeConsent, CONSENT_VERSION } from "@/lib/consent";

export function ConsentBanner() {
  const t = useTranslations("consent");
  const [show, setShow] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    const consent = readConsent();
    if (!consent) {
      setShow(true);
    }
  }, []);

  function handleAccept() {
    writeConsent(true);
    setShow(false);
    // Reload to trigger Clarity
    window.location.reload();
  }

  function handleReject() {
    writeConsent(false);
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-line bg-bed p-4 shadow-lg">
      <div className="container mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <p className="text-sm text-ink">{t("message")}</p>
            <p className="mt-1 text-xs text-muted">
              {t("version", { version: CONSENT_VERSION })}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleReject} className="btn-quiet text-sm">
              {t("reject")}
            </button>
            <button onClick={handleAccept} className="btn text-sm">
              {t("accept")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
