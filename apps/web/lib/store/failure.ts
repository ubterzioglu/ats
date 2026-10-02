/**
 * Local persistence can be refused outright (private browsing, blocked site
 * data) or run out of room mid-write. Both are normal, and both must reach the
 * user: a module that drops the work it was asked to save and says nothing is
 * worse than one that cannot save at all.
 */
export type StoreFailureReason =
  | "unsupported"
  | "blocked"
  | "quota-exceeded"
  | "version-conflict"
  | "failed";

export interface StoreFailure {
  readonly reason: StoreFailureReason;
  /** Plain sentence, safe to show as-is. */
  readonly message: string;
}

export type StoreResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly failure: StoreFailure };

const MESSAGES: Readonly<Record<StoreFailureReason, string>> = {
  unsupported: "This browser offers no local database, so nothing can be kept between visits.",
  blocked: "The browser refused local storage. Private browsing and blocked site data both do this.",
  "quota-exceeded": "Local storage is full. Delete older saved work and try again.",
  "version-conflict": "Another tab is holding an older version of the local database. Close it and reload.",
  failed: "The local database could not be reached."
};

export function failure(reason: StoreFailureReason): StoreFailure {
  return { reason, message: MESSAGES[reason] };
}

export function ok<T>(value: T): StoreResult<T> {
  return { ok: true, value };
}

export function failed<T>(reason: StoreFailureReason): StoreResult<T> {
  return { ok: false, failure: failure(reason) };
}

/**
 * Firefox in private browsing rejects the open request with InvalidStateError,
 * Chrome with SecurityError, and Safari with UnknownError. None of them mean a
 * bug on our side, so they are all reported as a refusal.
 */
export function classify(cause: unknown): StoreFailureReason {
  const name = cause instanceof DOMException || cause instanceof Error ? cause.name : "";

  if (name === "QuotaExceededError") return "quota-exceeded";
  if (name === "SecurityError" || name === "InvalidStateError" || name === "UnknownError") {
    return "blocked";
  }
  if (name === "VersionError") return "version-conflict";
  return "failed";
}
