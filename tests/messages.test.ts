import de from "@/messages/de.json";
import en from "@/messages/en.json";
import tr from "@/messages/tr.json";
import { describe, expect, it } from "vitest";

type Catalog = Record<string, unknown>;

const LOCALES: ReadonlyArray<readonly [string, Catalog]> = [
  ["tr", tr as Catalog],
  ["de", de as Catalog]
];

function flatten(value: Catalog, prefix = ""): Map<string, string> {
  const flat = new Map<string, string>();

  for (const [key, entry] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof entry === "string") {
      flat.set(path, entry);
    } else if (entry && typeof entry === "object") {
      for (const [nested, nestedValue] of flatten(entry as Catalog, path)) {
        flat.set(nested, nestedValue);
      }
    }
  }

  return flat;
}

/**
 * Keys that are deliberately the same in every language: the product name,
 * numerals, a token the model emits verbatim, and masked input placeholders.
 * Everything else identical to the English is an untranslated string.
 */
const SHARED_VERBATIM: ReadonlySet<string> = new Set([
  "brand.name",
  "metadata.titleTemplate",
  "metadata.openGraphTitle",
  "login.passwordPlaceholder",
  "notFound.code",
  "analyzer.previewOutOf",
  "measureRail.outOf",
  "benchPreview.outOf",
  "benchPreview.worth",
  "workItem.worth",
  "aiStatus.size",
  "fixDrafts.quantifyToken",
  // Turkish for "Model" is "Model", and German for "System" is "System".
  // Real collisions, not missed strings.
  "askDock.roleModel",
  "theme.system",
  // German for "Name" is "Name", and "Profil" differs from "Profile" only in
  // English. Real collisions, not missed strings.
  "identityTable.fields.name"
]);

const english = flatten(en as Catalog);

/** ICU placeholders must survive translation, or the message throws at render. */
function placeholders(message: string): readonly string[] {
  return [...message.matchAll(/\{(\w+)/g)].map((match) => match[1] ?? "").sort();
}

describe.each(LOCALES)("the %s catalog", (locale, catalog) => {
  const translated = flatten(catalog);

  it("has every key the English catalog has, and no extras", () => {
    expect([...translated.keys()].sort()).toEqual([...english.keys()].sort());
  });

  it("leaves no key untranslated", () => {
    const untranslated = [...english].filter(
      ([key, value]) => !SHARED_VERBATIM.has(key) && translated.get(key) === value
    );

    expect(untranslated.map(([key]) => key)).toEqual([]);
  });

  it("keeps every placeholder the English message declares", () => {
    const mismatched = [...english].filter(([key, value]) => {
      const other = translated.get(key) ?? "";
      return placeholders(value).join(",") !== placeholders(other).join(",");
    });

    expect(mismatched.map(([key]) => key)).toEqual([]);
  });

  it("names the locale it is for", () => {
    expect(locale).toMatch(/^(tr|de)$/);
  });
});

describe("the English catalog", () => {
  it("has no empty message", () => {
    const empty = [...english].filter(([, value]) => value.trim().length === 0);
    expect(empty.map(([key]) => key)).toEqual([]);
  });
});
