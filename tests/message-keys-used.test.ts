import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import de from "@/messages/de.json";
import en from "@/messages/en.json";
import tr from "@/messages/tr.json";

const WEB = resolve(__dirname, "../apps/web");
const CATALOGS: Readonly<Record<string, unknown>> = { en, de, tr };

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

function lookup(catalog: unknown, key: string): unknown {
  return key.split(".").reduce<unknown>((node, part) => {
    if (node && typeof node === "object" && part in node) {
      return (node as Record<string, unknown>)[part];
    }
    return undefined;
  }, catalog);
}

/**
 * Only files with exactly one translation namespace are checked: with two, a
 * bare t("x") cannot be attributed to either without parsing scopes.
 */
function usedKeys(): { file: string; key: string }[] {
  const found: { file: string; key: string }[] = [];
  for (const file of [...sourceFiles(join(WEB, "app")), ...sourceFiles(join(WEB, "components"))]) {
    const source = readFileSync(file, "utf8");
    const namespaces = [
      ...source.matchAll(/(?:useTranslations|getTranslations)\(\s*(?:\{[^}]*namespace:\s*)?"([^"]+)"/g)
    ].map((match) => match[1]);
    if (namespaces.length !== 1) continue;
    for (const match of source.matchAll(/\bt\(\s*"([A-Za-z0-9_.]+)"/g)) {
      found.push({ file: relative(WEB, file), key: `${namespaces[0]}.${match[1]}` });
    }
  }
  return found;
}

describe("message keys used by the interface", () => {
  const keys = usedKeys();

  it("finds keys to check", () => {
    expect(keys.length).toBeGreaterThan(100);
  });

  for (const [locale, catalog] of Object.entries(CATALOGS)) {
    it(`exist in the ${locale} catalog`, () => {
      const missing = keys
        .filter(({ key }) => typeof lookup(catalog, key) !== "string")
        .map(({ file, key }) => `${key} (${file})`);
      expect(missing).toEqual([]);
    });
  }
});
