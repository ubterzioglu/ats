/**
 * The login page renders whatever `message` holds, so the auth actions pass a
 * key rather than a sentence: the text is looked up at render time, which keeps
 * it in the reader's language and keeps arbitrary query-string text off the
 * page.
 *
 * This lives outside `actions.ts` because a "use server" module may export
 * nothing but async functions.
 */
export type LoginMessageKey =
  | "invalidCredentials"
  | "signupFailed"
  | "checkYourEmail"
  | "linkExpired";

const MESSAGE_KEYS: readonly LoginMessageKey[] = [
  "invalidCredentials",
  "signupFailed",
  "checkYourEmail",
  "linkExpired"
];

export function isLoginMessageKey(value: string | undefined): value is LoginMessageKey {
  return value !== undefined && (MESSAGE_KEYS as readonly string[]).includes(value);
}
