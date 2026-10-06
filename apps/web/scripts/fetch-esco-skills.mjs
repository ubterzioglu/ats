/**
 * Downloads the ESCO skills pillar from the public ESCO web service and keeps
 * only what build-skill-dictionary.mjs reads: labels (en, de), skill type,
 * reuse level and how many occupations link to the skill.
 *
 * Run by hand, never at install or build time:
 *   node scripts/fetch-esco-skills.mjs [version]
 *
 * The ESCO download portal hands out CSV packages by email only, so this goes
 * through https://ec.europa.eu/esco/api, which serves the same released data.
 * Output: .skill-sources/esco-<version>/skills.jsonl (git-ignored).
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const VERSION = process.argv[2] ?? "v1.2.1";
const API = "https://ec.europa.eu/esco/api/search";
const PAGE_SIZE = 100;
const LANGUAGES = ["en", "de"];

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outDir = path.join(root, ".skill-sources", `esco-${VERSION}`);

function lastSegment(uri) {
  return typeof uri === "string" ? uri.slice(uri.lastIndexOf("/") + 1) : null;
}

function linkUris(links, key) {
  const value = links?.[key];
  if (!value) return [];
  return (Array.isArray(value) ? value : [value]).map((entry) => entry.uri).filter(Boolean);
}

function reduce(result) {
  const links = result._links ?? {};
  const pick = (labels) =>
    Object.fromEntries(LANGUAGES.map((lang) => [lang, labels?.[lang] ?? null]));
  return {
    uri: result.uri,
    status: result.status ?? null,
    preferredLabel: pick(result.preferredLabel),
    alternativeLabel: Object.fromEntries(
      LANGUAGES.map((lang) => [lang, result.alternativeLabel?.[lang] ?? []])
    ),
    skillType: linkUris(links, "hasSkillType").map(lastSegment),
    reuseLevel: linkUris(links, "hasReuseLevel").map(lastSegment),
    schemes: linkUris(links, "isInScheme").map(lastSegment),
    occupations:
      linkUris(links, "isEssentialForOccupation").length +
      linkUris(links, "isOptionalForOccupation").length
  };
}

async function fetchPage(page) {
  const url =
    `${API}?type=skill&language=en&full=true&limit=${PAGE_SIZE}&offset=${page}` +
    `&selectedVersion=${encodeURIComponent(VERSION)}`;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const response = await fetch(url);
    if (response.ok) return response.json();
    if (attempt === 4) throw new Error(`ESCO API ${response.status} on page ${page}`);
    await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
  }
  throw new Error("unreachable");
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const first = await fetchPage(0);
  const total = first.total;
  const pages = Math.ceil(total / PAGE_SIZE);
  const records = [];
  for (let page = 0; page < pages; page += 1) {
    const body = page === 0 ? first : await fetchPage(page);
    for (const result of body._embedded?.results ?? []) records.push(reduce(result));
    process.stdout.write(`\rpage ${page + 1}/${pages} (${records.length}/${total})`);
  }
  process.stdout.write("\n");
  await writeFile(
    path.join(outDir, "skills.jsonl"),
    records.map((record) => JSON.stringify(record)).join("\n") + "\n"
  );
  await writeFile(
    path.join(outDir, "meta.json"),
    JSON.stringify(
      { source: API, version: VERSION, retrieved: new Date().toISOString(), total, fetched: records.length },
      null,
      2
    ) + "\n"
  );
  console.log(`wrote ${records.length} skills to ${outDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
