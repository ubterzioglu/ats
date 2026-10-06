/**
 * Proposes cross-language synonyms (en/de/tr) for a person to review.
 *
 * Developer machines only, run by hand. Never part of install, build or CI:
 *   node scripts/mine-synonyms.mjs [--threshold 0.93] [--neighbours 5]
 *     [--max-cluster 6] [--all-languages] [--fixtures] [--no-aliases]
 *     [--limit N] [--cache-dir DIR] [--out FILE]
 *
 * Embeds the curated taxonomy, the static skill dictionary and (with
 * --fixtures) terms extracted from the test fixtures with
 * Xenova/multilingual-e5-small, clusters them by cosine similarity and writes
 * scripts/synonym-proposals/proposals.json. The model (about 118 MB) is
 * cached outside the repository, in ~/.cache/ats-synonym-miner by default.
 *
 * The output is unreviewed. Nothing reaches the engine until a person runs
 * scripts/approve-synonyms.mjs with --confirm. See docs/synonym-mining.md.
 */
import { mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { WEB_ROOT, importFromRepo, importFromWeb, registerEngineLoader } from "./lib/load-engine.mjs";

const MODEL_ID = "Xenova/multilingual-e5-small";
const DEFAULT_OUT = path.join(WEB_ROOT, "scripts", "synonym-proposals", "proposals.json");

function parseArgs(argv) {
  const args = {
    options: {},
    fixtures: false,
    aliases: true,
    limit: Infinity,
    cacheDir: path.join(os.homedir(), ".cache", "ats-synonym-miner"),
    out: DEFAULT_OUT
  };
  const value = (index, flag) => {
    const next = argv[index + 1];
    if (next === undefined || next.startsWith("--")) throw new Error(`${flag} needs a value`);
    return next;
  };
  const number = (index, flag) => {
    const parsed = Number(value(index, flag));
    if (!Number.isFinite(parsed)) throw new Error(`${flag} needs a number`);
    return parsed;
  };
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    if (flag === "--threshold") args.options.threshold = number(i++, flag);
    else if (flag === "--neighbours") args.options.neighbours = number(i++, flag);
    else if (flag === "--max-cluster") args.options.maxClusterSize = number(i++, flag);
    else if (flag === "--all-languages") args.options.crossLanguageOnly = false;
    else if (flag === "--fixtures") args.fixtures = true;
    else if (flag === "--no-aliases") args.aliases = false;
    else if (flag === "--limit") args.limit = number(i++, flag);
    else if (flag === "--cache-dir") args.cacheDir = path.resolve(value(i++, flag));
    else if (flag === "--out") args.out = path.resolve(value(i++, flag));
    else throw new Error(`unknown flag ${flag}`);
  }
  if (args.options.threshold !== undefined && (args.options.threshold <= 0 || args.options.threshold >= 1)) {
    throw new Error("--threshold must be between 0 and 1");
  }
  return args;
}

/** Terms the engine extracts from the fixture ads and CVs, tagged with the document language. */
async function fixtureTerms() {
  const { extractJobKeywords } = await importFromWeb("lib/scoring/keywords.ts");
  const { detectLanguage } = await importFromWeb("lib/scoring/language.ts");
  const fixtures = await importFromRepo("tests/fixtures.ts");
  const { GOLDEN_JOB_ADS } = await importFromRepo("tests/fixtures/job-ads.ts");
  const texts = [
    ...GOLDEN_JOB_ADS.map((ad) => ad.text),
    ...["JOB_AD", "DE_JOB_AD", "TR_JOB_AD", "STRONG_CV", "TR_CV", "DE_CV"].map((name) => fixtures[name])
  ].filter((text) => typeof text === "string");
  return texts.flatMap((text) => {
    const language = detectLanguage(text);
    return extractJobKeywords(text).map((keyword) => ({ term: keyword.term, language, source: "fixture" }));
  });
}

async function realEmbedder(cacheDir) {
  const transformers = await import("@huggingface/transformers");
  const { env, pipeline } = transformers.env ? transformers : transformers.default;
  env.cacheDir = cacheDir;
  console.error(`loading ${MODEL_ID} (q8), cache ${cacheDir}`);
  const extractor = await pipeline("feature-extraction", MODEL_ID, { dtype: "q8" });
  return {
    id: `${MODEL_ID} (q8, @huggingface/transformers node)`,
    real: true,
    async embed(texts) {
      const output = await extractor(texts, { pooling: "mean", normalize: true });
      return output.tolist();
    }
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  registerEngineLoader();
  const { SKILL_TAXONOMY, SYNONYMS, canonicalize } = await importFromWeb("lib/scoring/taxonomy.ts");
  const { DICTIONARY_ENTRIES } = await importFromWeb("lib/scoring/skill-dictionary.ts");
  const { APPROVED_SYNONYM_FILE } = await importFromWeb("lib/scoring/approved-synonyms.ts");
  const { collectTerms, mineSynonyms } = await import("./lib/synonym-miner.mjs");

  // Pending entries are already on someone's review list; do not propose them again.
  const pending = new Map();
  for (const entry of APPROVED_SYNONYM_FILE.entries) {
    for (const alias of entry.aliases) pending.set(alias, entry.canonical);
  }
  const groupOf = (term) => {
    const canonical = canonicalize(term);
    return pending.get(canonical) ?? canonical;
  };

  const dictionary = args.aliases
    ? DICTIONARY_ENTRIES
    : DICTIONARY_ENTRIES.map((entry) => ({ ...entry, aliases: [] }));
  const extra = args.fixtures ? await fixtureTerms() : [];
  const records = collectTerms({
    dictionary,
    curated: SKILL_TAXONOMY,
    synonyms: args.aliases ? SYNONYMS : {},
    extra,
    groupOf
  }).slice(0, args.limit);
  console.error(`${records.length} terms`);

  const embedder = await realEmbedder(args.cacheDir);
  let lastShown = 0;
  const result = await mineSynonyms({
    records,
    embedder,
    options: args.options,
    inputs: {
      curated: true,
      dictionary: true,
      aliases: args.aliases,
      fixtures: args.fixtures,
      limit: Number.isFinite(args.limit) ? args.limit : null
    },
    onProgress: (done, total) => {
      if (done - lastShown >= 1000 || done === total) {
        lastShown = done;
        console.error(`embedded ${done}/${total}`);
      }
    }
  });

  await mkdir(path.dirname(args.out), { recursive: true });
  await writeFile(args.out, `${JSON.stringify(result, null, 2)}\n`);
  const cross = result.proposals.filter((proposal) => proposal.crossLanguage).length;
  console.error(
    `${result.proposals.length} proposals (${cross} cross-language) from ${result.stats.acceptedPairs} pairs; ` +
      `rejected ${JSON.stringify(result.stats.rejected)}`
  );
  console.error(`wrote ${path.relative(WEB_ROOT, args.out)}; review it, then run scripts/approve-synonyms.mjs`);
}

await main();
