"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { LEGAL_VERSION } from "@/lib/legal-entity";

interface CvConsentProps {
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
}

const STORAGE_KEY = "affa_cv_consent";

interface StoredConsent {
  version: string;
  at: string;
}

export function CvConsent({ checked, onChange }: CvConsentProps) {
  const t = useTranslations("analyze.consent");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Read from localStorage on mount
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const consent: StoredConsent = JSON.parse(stored);
        if (consent.version === LEGAL_VERSION) {
          onChange(true);
        }
      }
    } catch {
      // Ignore errors (private browsing, etc.)
    }
    setMounted(true);
  }, [onChange]);

  const handleChange = (newChecked: boolean) => {
    onChange(newChecked);
    if (newChecked) {
      try {
        const consent: StoredConsent = {
          version: LEGAL_VERSION,
          at: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
      } catch {
        // Ignore errors
      }
    } else {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore errors
      }
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => handleChange(e.target.checked)}
        className="mt-1 h-4 w-4 rounded border-line bg-bed text-iris focus:ring-iris"
      />
      <span className="text-sm text-muted">
        {t.rich("label", {
          kvkk: (chunks) => (
            <Link href="/kvkk" className="text-iris hover:underline">
              {chunks}
            </Link>
          ),
          privacy: (chunks) => (
            <Link href="/privacy" className="text-iris hover:underline">
              {chunks}
            </Link>
          )
        })}
      </span>
    </label>
  );
}
