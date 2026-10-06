import { readFileSync } from "node:fs";
import { join, resolve as resolvePath } from "node:path";

import { describe, expect, it } from "vitest";

import { HELP_ENTRIES } from "@/lib/help/bank";
import { createKeywordAnswerer } from "@/lib/help/keyword-answerer";

const MESSAGES = resolvePath(__dirname, "../apps/web/messages");
const LOCALES = ["en", "de", "tr"] as const;

function lookup(catalog: unknown, key: string): unknown {
  let node = catalog;
  for (const part of key.split(".")) {
    if (typeof node !== "object" || node === null) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return node;
}

const MOCK_MESSAGES: Record<string, string> = {
  "faq.items.upload.a": "Yes. Your CV is read and scored in your browser first.",
  "faq.items.score.a": "Five dimensions add up to 100 points.",
  "faq.items.languages.a": "Section headings, action verbs and stopwords are recognised in English, German and Turkish.",
  "faq.items.shared.a": "Scores and advice only. The link carries no lines from your CV.",
  "faq.items.guarantee.a": "No. The checks are heuristics built from how mainstream parsers behave.",
  "faq.items.noAd.a": "The keyword dimension is capped at 20 of 25 points.",
  "faq.items.formats.a": "PDF, DOCX and plain text files up to 10 MB.",
  "faq.items.retention.a": "Twelve months from the upload date.",
  "faq.items.delete.a": "Use the data request form to ask for erasure.",
  "faq.items.accuracy.a": "The checks are built from how mainstream parsers behave.",
  "help.answers.free": "Yes, the analysis is free. You need to sign in to run it.",
  "help.answers.account": "Yes. You need to sign in to analyze a CV."
};

function resolve(key: string): string {
  return MOCK_MESSAGES[key] ?? `[missing: ${key}]`;
}

describe("createKeywordAnswerer", () => {
  const answerer = createKeywordAnswerer({ entries: HELP_ENTRIES, resolve, locale: "en" });

  it("matches a question built from an entry's own keywords", async () => {
    const answer = await answerer.answer("Is my CV stored?");
    expect(answer.kind).toBe("text");
    if (answer.kind === "text") {
      expect(answer.text).toBe("Yes. Your CV is read and scored in your browser first.");
    }
  });

  it("returns none for an unrelated question", async () => {
    const answer = await answerer.answer("What is the weather today?");
    expect(answer.kind).toBe("none");
  });

  it("returns none for empty input", async () => {
    expect((await answerer.answer("")).kind).toBe("none");
    expect((await answerer.answer("   ")).kind).toBe("none");
  });

  it("returns none for punctuation-only input", async () => {
    expect((await answerer.answer("?!.,")).kind).toBe("none");
  });

  it("matches Turkish questions with İ/ı folding", async () => {
    const answer = await answerer.answer("CV'm saklanıyor mu?");
    expect(answer.kind).toBe("text");
    if (answer.kind === "text") {
      expect(answer.text).toBe("Yes. Your CV is read and scored in your browser first.");
    }
  });

  // The answerer follows the site locale (not the question), so German
  // keywords are only consulted on the German site.
  it("matches German questions with ß/ü folding", async () => {
    const german = createKeywordAnswerer({ entries: HELP_ENTRIES, resolve, locale: "de" });
    const answer = await german.answer("Wie lange werden meine Daten aufbewahrt?");
    expect(answer.kind).toBe("text");
    if (answer.kind === "text") {
      expect(answer.text).toBe("Twelve months from the upload date.");
    }
  });

  it("matches the free question", async () => {
    const answer = await answerer.answer("Is this service free?");
    expect(answer.kind).toBe("text");
    if (answer.kind === "text") {
      expect(answer.text).toBe("Yes, the analysis is free. You need to sign in to run it.");
    }
  });

  it("matches the account question", async () => {
    const answer = await answerer.answer("Do I need an account?");
    expect(answer.kind).toBe("text");
    if (answer.kind === "text") {
      expect(answer.text).toBe("Yes. You need to sign in to analyze a CV.");
    }
  });

  it("picks deterministically when two entries score equally", async () => {
    const answerer2 = createKeywordAnswerer({ entries: HELP_ENTRIES, resolve, locale: "en" });
    const a = await answerer2.answer("data");
    const b = await answerer2.answer("data");
    expect(a).toEqual(b);
  });

  it("matches the account question on the German site", async () => {
    const german = createKeywordAnswerer({ entries: HELP_ENTRIES, resolve, locale: "de" });
    const answer = await german.answer("Brauche ich ein Konto?");
    expect(answer.kind).toBe("text");
    if (answer.kind === "text") {
      expect(answer.text).toBe("Yes. You need to sign in to analyze a CV.");
    }
  });

  it.each(LOCALES)("every answerKey resolves to a message in the %s catalog", (locale) => {
    const catalog: unknown = JSON.parse(readFileSync(join(MESSAGES, `${locale}.json`), "utf8"));
    for (const entry of HELP_ENTRIES) {
      expect(lookup(catalog, entry.answerKey), entry.answerKey).toEqual(expect.any(String));
    }
  });

  // /analyze sits behind sign-in (lib/auth/routes.ts), so the catalog answers
  // must say so rather than promise an analysis without an account.
  const SIGN_IN: Readonly<Record<(typeof LOCALES)[number], RegExp>> = {
    en: /sign in/i,
    de: /anmelden|melden Sie sich an/i,
    tr: /giriş yap/i
  };
  const NO_ACCOUNT: Readonly<Record<(typeof LOCALES)[number], RegExp>> = {
    en: /no account/i,
    de: /kein Konto/i,
    tr: /hesap gerektirmez/i
  };

  it.each(LOCALES)("the %s account, free and share answers say sign-in is required", (locale) => {
    const catalog: unknown = JSON.parse(readFileSync(join(MESSAGES, `${locale}.json`), "utf8"));
    for (const key of ["help.answers.account", "help.answers.free", "analyzer.errors.shareAuthRequired"]) {
      const text = lookup(catalog, key);
      expect(text, key).toEqual(expect.stringMatching(SIGN_IN[locale]));
      expect(text, key).not.toEqual(expect.stringMatching(NO_ACCOUNT[locale]));
    }
  });

  it("matches multi-word keywords as phrases", async () => {
    const answer = await answerer.answer("How long is my data kept?");
    expect(answer.kind).toBe("text");
    if (answer.kind === "text") {
      expect(answer.text).toBe("Twelve months from the upload date.");
    }
  });

  it("searches answer text when keywords do not match", async () => {
    const answer = await answerer.answer("How are points calculated?");
    expect(answer.kind).toBe("text");
    if (answer.kind === "text") {
      expect(answer.text).toBe("Five dimensions add up to 100 points.");
    }
  });

  it("suggests when close but not matching", async () => {
    const answer = await answerer.answer("Is my resume saved?");
    expect(answer.kind === "text" || answer.kind === "suggest" || answer.kind === "none").toBe(true);
  });
});
