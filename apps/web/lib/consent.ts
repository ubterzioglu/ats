export const CONSENT_VERSION = "2026-10-05-v1";

export interface ConsentState {
  readonly analytics: boolean;
  readonly version: string;
  readonly timestamp: string;
}

const CONSENT_KEY = "affa_consent";

export function readConsent(): ConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) return null;
    const consent: ConsentState = JSON.parse(stored);
    if (consent.version !== CONSENT_VERSION) return null;
    return consent;
  } catch {
    return null;
  }
}

export function writeConsent(analytics: boolean): void {
  if (typeof window === "undefined") return;
  try {
    const consent: ConsentState = {
      analytics,
      version: CONSENT_VERSION,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
  } catch {
    // Ignore errors (private browsing, etc.)
  }
}

export function clearConsent(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(CONSENT_KEY);
  } catch {
    // Ignore errors
  }
}
