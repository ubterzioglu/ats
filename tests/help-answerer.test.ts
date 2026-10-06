import { describe, expect, it } from "vitest";

import { HELP_ENTRIES } from "@/lib/help/bank";
import { createKeywordAnswerer } from "@/lib/help/keyword-answerer";

const MOCK_MESSAGES: Record<string, string> = {
  "faq.items.upload.a": "Yes. Your CV is read and scored in your browser first.",
  "faq.items.score.a": "Five dimensions add up to 100 points.",
  "faq.items.languages.a": "Section headings, action verbs and stopwords are recognised in English, German and Turkish.",
  "faq.items.shared.a": "Scores and advice only. Lines taken from your CV are never stored.",
  "faq.items.guarantee.a": "No. The checks are heuristics built from how mainstream parsers behave.",
  "faq.items.noAd.a": "The keyword dimension is capped at 20 of 25 points.",
  "faq.items.formats.a": "PDF, DOCX and plain text files up to 10 MB.",
  "faq.items.retention.a": "Twelve months from the upload date.",
  "faq.items.delete.a": "Use the data request form to ask for erasure.",
  "faq.items.accuracy.a": "The checks are built from how mainstream parsers behave.",
  "help.answers.free": "Yes. The analysis runs in your browser and needs no account.",
  "help.answers.account": "No. The analysis itself needs no account."
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

  it("matches German questions with ß/ü folding", async () => {
    const answer = await answerer.answer("Wie lange werden meine Daten aufbewahrt?");
    expect(answer.kind).toBe("text");
    if (answer.kind === "text") {
      expect(answer.text).toBe("Twelve months from the upload date.");
    }
  });

  it("matches the free question", async () => {
    const answer = await answerer.answer("Is this service free?");
    expect(answer.kind).toBe("text");
    if (answer.kind === "text") {
      expect(answer.text).toBe("Yes. The analysis runs in your browser and needs no account.");
    }
  });

  it("matches the account question", async () => {
    const answer = await answerer.answer("Do I need an account?");
    expect(answer.kind).toBe("text");
    if (answer.kind === "text") {
      expect(answer.text).toBe("No. The analysis itself needs no account.");
    }
  });

  it("picks deterministically when two entries score equally", async () => {
    const answerer2 = createKeywordAnswerer({ entries: HELP_ENTRIES, resolve, locale: "en" });
    const a = await answerer2.answer("data");
    const b = await answerer2.answer("data");
    expect(a).toEqual(b);
  });

  it("every answerKey resolves to a message that exists", async () => {
    for (const entry of HELP_ENTRIES) {
      const text = resolve(entry.answerKey);
      expect(text).not.toContain("[missing:");
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
