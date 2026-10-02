import type { JsonSchema } from "./providers/types";

/**
 * Schema validation for every LLM output (L.4). A model answer is untrusted
 * text until it proves its shape: the provider parses it, this module walks
 * it against the declared JsonSchema, and anything that fails is rejected as
 * a SchemaViolationError before a single character of it can reach the
 * screen. The error carries the machine-readable issues and a message the UI
 * can show verbatim - plain about what happened and what to do.
 */

export interface SchemaIssue {
  /** Dotted path into the payload; "" is the payload root. */
  readonly path: string;
  readonly message: string;
}

const MAX_ISSUES = 10;

const REJECTION =
  "The model's answer did not match the required shape, so nothing was shown. Try again, or choose a stronger model tier.";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function joinPath(path: string, key: string): string {
  return path === "" ? key : `${path}.${key}`;
}

function check(value: unknown, schema: JsonSchema, path: string, issues: SchemaIssue[]): void {
  if (issues.length >= MAX_ISSUES) return;

  switch (schema.type) {
    case "object": {
      if (!isRecord(value)) {
        issues.push({ path, message: "expected an object" });
        return;
      }
      for (const key of schema.required ?? []) {
        if (!(key in value)) {
          issues.push({ path: joinPath(path, key), message: "is required" });
        }
      }
      for (const [key, child] of Object.entries(schema.properties ?? {})) {
        const nested = value[key];
        // An absent optional property is not a violation; a present one must
        // match. Required-ness is already covered above.
        if (nested === undefined) continue;
        check(nested, child, joinPath(path, key), issues);
        if (issues.length >= MAX_ISSUES) return;
      }
      return;
    }
    case "array": {
      if (!Array.isArray(value)) {
        issues.push({ path, message: "expected an array" });
        return;
      }
      const items = schema.items;
      if (items === undefined) return;
      value.forEach((entry, index) => {
        check(entry, items, joinPath(path, String(index)), issues);
      });
      return;
    }
    case "string": {
      if (typeof value !== "string") {
        issues.push({ path, message: "expected a string" });
        return;
      }
      const allowed = schema.enum;
      if (allowed !== undefined && !allowed.includes(value)) {
        issues.push({ path, message: `expected one of: ${allowed.join(", ")}` });
      }
      return;
    }
    case "number": {
      if (typeof value !== "number" || !Number.isFinite(value)) {
        issues.push({ path, message: "expected a number" });
      }
      return;
    }
    case "boolean": {
      if (typeof value !== "boolean") {
        issues.push({ path, message: "expected a boolean" });
      }
      return;
    }
  }
}

/** Collects up to ten ways the payload fails the schema; empty means valid. */
export function validateSchema(payload: unknown, schema: JsonSchema): SchemaIssue[] {
  const issues: SchemaIssue[] = [];
  check(payload, schema, "", issues);
  return issues;
}

function plainRejection(issues: readonly SchemaIssue[]): string {
  const detail = issues
    .slice(0, 3)
    .map((issue) => `${issue.path === "" ? "payload" : issue.path}: ${issue.message}`)
    .join("; ");
  return detail === "" ? REJECTION : `${REJECTION} (${detail})`;
}

/**
 * The one error every malformed model answer turns into. It is an Error, so
 * existing catch sites keep working; the message is written for the user and
 * the issues are there for anything that wants to be specific.
 */
export class SchemaViolationError extends Error {
  readonly issues: readonly SchemaIssue[];

  constructor(issues: readonly SchemaIssue[], message?: string) {
    super(message ?? plainRejection(issues));
    this.name = "SchemaViolationError";
    this.issues = issues;
  }
}

/**
 * The provider-side gate for structured(): raw text in, validated payload
 * out, SchemaViolationError on anything else. All three tiers funnel their
 * answers through here, so "output failing its schema is never shown" is one
 * code path instead of three good intentions.
 */
export function parseStructuredPayload<T>(raw: string, schema: JsonSchema): T {
  let payload: unknown;
  try {
    payload = JSON.parse(raw) as unknown;
  } catch {
    throw new SchemaViolationError([
      { path: "", message: "the answer is not JSON at all" }
    ]);
  }
  const issues = validateSchema(payload, schema);
  if (issues.length > 0) throw new SchemaViolationError(issues);
  return payload as T;
}
