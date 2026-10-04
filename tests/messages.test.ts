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
 * Values that are deliberately identical to the English, named per locale.
 *
 * Per locale, not globally: "Name is the same word in German" is a claim worth
 * recording, and exempting the key everywhere would also stop the test noticing
 * if the Turkish ever regressed to "Name".
 */
const EVERY_LOCALE: readonly string[] = [
  // The product name, numerals, a token the model emits verbatim, and a masked
  // input placeholder.
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
  "fixDrafts.quantifyToken"
];

const VERBATIM: Readonly<Record<string, ReadonlySet<string>>> = {
  // Turkish for "Model" is "Model", and Turkish for "Modern PDF" is
  // "Modern PDF".
  tr: new Set([...EVERY_LOCALE, "askDock.roleModel", "editor.export.template.modern"]),
  // German and English share a great many short nouns, and most of the editor's
  // field labels are short nouns: Name, Position, Region, Organisation, URL,
  // Website, Version, System.
  de: new Set([
    ...EVERY_LOCALE,
    "theme.system",
    "identityTable.fields.name",
    "editor.fields.basics.name",
    "editor.fields.basics.url",
    "editor.fields.basics.location.region",
    "editor.fields.basics.profiles.url",
    "editor.fields.work.position",
    "editor.fields.work.url",
    "editor.fields.volunteer.organization",
    "editor.fields.volunteer.position",
    "editor.fields.volunteer.url",
    "editor.fields.education.url",
    "editor.fields.publications.url",
    "editor.fields.references.name",
    "editor.fields.projects.url",
    "editor.fields.projects.entity",
    "editor.fields.meta.version",
    "kanban.stages.interview"
  ])
};

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
    const verbatim = VERBATIM[locale] ?? new Set<string>();
    const untranslated = [...english].filter(
      ([key, value]) => !verbatim.has(key) && translated.get(key) === value
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
