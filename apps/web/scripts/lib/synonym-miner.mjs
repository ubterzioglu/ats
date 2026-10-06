/**
 * The pure half of scripts/mine-synonyms.mjs: collects terms, clusters their
 * embeddings and writes proposals. The embedder is passed in, so the model
 * never loads here and the tests can drive the whole pipeline with a fake one.
 *
 * Proposals are suggestions for a person to review. Nothing in this file
 * writes to the engine's data; scripts/approve-synonyms.mjs does that, and
 * only on an explicit --confirm.
 */
import { createHash } from "node:crypto";

import { differsByVersion, isGuardedSurface, nestedSpelling } from "../../lib/scoring/approved-synonyms.ts";

export const PROPOSALS_SCHEMA = 1;

export const DEFAULT_OPTIONS = Object.freeze({
  /**
   * multilingual-e5-small scores unrelated short terms at 0.80-0.85 and puts
   * wrong cross-language pairs in the 0.88-0.91 band ("konsolidasyon" /
   * "europäische integration" at 0.90) on this repo's dictionary. See
   * docs/synonym-mining.md before lowering it.
   */
  threshold: 0.93,
  /** Both terms must be among each other's nearest neighbours. */
  neighbours: 5,
  maxClusterSize: 6,
  /**
   * Pair only terms of different languages, and keep at most one new member
   * per language in a cluster. Same-language neighbours are mostly related
   * terms ("air traffic management" / "air traffic control operations"), not
   * synonyms, and spelling variants are the dictionary build's job.
   */
  crossLanguageOnly: true
});

const TR_CHARS_RX = /[çğış]/;
const DE_CHARS_RX = /[äß]/;

/** A best guess for a surface with no recorded language. */
export function guessLanguage(term) {
  if (TR_CHARS_RX.test(term)) return "tr";
  if (DE_CHARS_RX.test(term)) return "de";
  return "unknown";
}

/**
 * Merges every source into one record per surface. `groupOf` returns the term
 * a surface currently resolves to (the engine's canonicalize, plus pending
 * approvals), so two surfaces with the same group are already linked.
 */
export function collectTerms({ dictionary = [], curated = [], synonyms = {}, extra = [], groupOf }) {
  const records = new Map();
  const add = (term, language, source, flags = {}) => {
    if (typeof term !== "string" || term.length === 0) return;
    const record = records.get(term) ?? {
      term,
      languages: new Set(),
      sources: new Set(),
      curated: false,
      dictionaryTerm: false
    };
    if (language && language !== "unknown") record.languages.add(language);
    record.sources.add(source);
    record.curated ||= Boolean(flags.curated);
    record.dictionaryTerm ||= Boolean(flags.dictionaryTerm);
    records.set(term, record);
  };

  for (const term of curated) add(term, "en", "curated", { curated: true });
  for (const [canonical, aliases] of Object.entries(synonyms)) {
    for (const alias of aliases) add(alias, guessLanguage(alias), "curated-alias");
    add(canonical, "en", "curated", { curated: true });
  }
  for (const entry of dictionary) {
    add(entry.term, entry.language, entry.source, { dictionaryTerm: true });
    for (const alias of entry.aliases ?? []) add(alias, entry.language, entry.source);
  }
  for (const item of extra) add(item.term, item.language, item.source ?? "fixture");

  return [...records.values()]
    .filter((record) => !isGuardedSurface(record.term))
    .map((record) => {
      const group = groupOf(record.term);
      return {
        term: record.term,
        languages: [...record.languages].sort(),
        sources: [...record.sources].sort(),
        group,
        curated: record.curated,
        dictionaryTerm: record.dictionaryTerm,
        // Only a surface that is its own group and not curated can be pointed
        // at another canonical term; a curated term or an existing alias keeps
        // its owner at runtime.
        movable: !record.curated && group === record.term
      };
    })
    .sort((a, b) => (a.term < b.term ? -1 : a.term > b.term ? 1 : 0));
}

function sharesLanguage(a, b) {
  return a.languages.some((language) => b.languages.includes(language));
}

/**
 * A single short token such as "kvkk" or "gmp". The model has little to go on
 * for an acronym, and the first real run paired "kvkk" (the Turkish data
 * protection law) with "kraft-wärme-kopplung" at 0.94.
 */
function isShortToken(term) {
  return !/\s/.test(term) && term.replace(/[^\p{L}]/gu, "").length <= 4;
}

/**
 * Why a pair is never proposed, or null: already linked, a version or
 * spelling look-alike, an acronym-sized token, two curated terms (the curated
 * table decided they are different), or - in cross-language mode - not a
 * translation pair.
 */
export function excludedPair(a, b, crossLanguageOnly = DEFAULT_OPTIONS.crossLanguageOnly) {
  if (a.group === b.group) return "known";
  if (differsByVersion(a.term, b.term) || differsByVersion(a.group, b.group)) return "version";
  if (nestedSpelling(a.term, b.term) || nestedSpelling(a.group, b.group)) return "nested";
  if (isShortToken(a.term) || isShortToken(b.term)) return "short-token";
  if (a.curated && b.curated) return "two-curated";
  if (crossLanguageOnly && (a.languages.length === 0 || b.languages.length === 0 || sharesLanguage(a, b))) {
    return "same-language";
  }
  return null;
}

function normalize(vector) {
  let norm = 0;
  for (const value of vector) norm += value * value;
  norm = Math.sqrt(norm) || 1;
  return Float32Array.from(vector, (value) => value / norm);
}

function dot(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i += 1) sum += a[i] * b[i];
  return sum;
}

function insertNeighbour(list, index, similarity, size) {
  if (list.length === size && similarity <= list[list.length - 1].similarity) return;
  let at = list.findIndex((item) => similarity > item.similarity);
  if (at === -1) at = list.length;
  list.splice(at, 0, { index, similarity });
  if (list.length > size) list.pop();
}

/** Rounded for the output file, so a rerun with the same model diffs cleanly. */
function round3(value) {
  return Math.round(value * 1000) / 1000;
}

export function proposalId(terms) {
  const key = [...terms].sort().join("|");
  return `syn-${createHash("sha1").update(key).digest("hex").slice(0, 10)}`;
}

/**
 * The canonical side: an existing group that cannot move wins outright;
 * otherwise a curated term, then a dictionary term (the engine ignores an
 * approval whose canonical side it does not know), then English, then the
 * term most sources share, then the shortest, then alphabetical.
 */
function chooseCanonical(members) {
  const fixed = members.find((member) => !member.movable);
  if (fixed) return fixed.group;
  const ranked = [...members].sort(
    (a, b) =>
      Number(b.curated) - Number(a.curated) ||
      Number(b.dictionaryTerm) - Number(a.dictionaryTerm) ||
      Number(b.languages.includes("en")) - Number(a.languages.includes("en")) ||
      b.sources.length - a.sources.length ||
      a.term.length - b.term.length ||
      (a.term < b.term ? -1 : 1)
  );
  return ranked[0].term;
}

/**
 * Clusters terms by cosine similarity. Pairs must clear the threshold, be
 * mutual nearest neighbours and survive the exclusion rules; clusters grow by
 * complete linkage (every pair inside a cluster clears the threshold), so one
 * hub term cannot chain unrelated terms together. Deterministic for a given
 * set of vectors.
 */
export function clusterTerms(records, rawVectors, options = {}) {
  const { threshold, neighbours, maxClusterSize, crossLanguageOnly } = { ...DEFAULT_OPTIONS, ...options };
  if (records.length !== rawVectors.length) throw new Error("one vector per term is required");
  const vectors = rawVectors.map(normalize);
  const n = records.length;
  const nearest = Array.from({ length: n }, () => []);
  const edges = [];

  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      if (records[i].group === records[j].group) continue;
      const similarity = dot(vectors[i], vectors[j]);
      insertNeighbour(nearest[i], j, similarity, neighbours);
      insertNeighbour(nearest[j], i, similarity, neighbours);
      if (similarity >= threshold) edges.push({ i, j, similarity });
    }
  }

  const isNear = (from, to) => nearest[from].some((item) => item.index === to);
  const rejected = {
    version: 0,
    nested: 0,
    "short-token": 0,
    "two-curated": 0,
    "same-language": 0,
    "not-mutual": 0
  };
  const accepted = edges
    .filter((edge) => {
      const reason = excludedPair(records[edge.i], records[edge.j], crossLanguageOnly);
      if (reason) {
        rejected[reason] += 1;
        return false;
      }
      if (!isNear(edge.i, edge.j) || !isNear(edge.j, edge.i)) {
        rejected["not-mutual"] += 1;
        return false;
      }
      return true;
    })
    .sort(
      (a, b) =>
        b.similarity - a.similarity ||
        (records[a.i].term < records[b.i].term ? -1 : records[a.i].term > records[b.i].term ? 1 : 0) ||
        (records[a.j].term < records[b.j].term ? -1 : 1)
    );

  const clusterOf = Array.from({ length: n }, (_, index) => [index]);
  const pairOk = (a, b) => {
    if (records[a].group === records[b].group) return !differsByVersion(records[a].term, records[b].term);
    return excludedPair(records[a], records[b], crossLanguageOnly) === null && dot(vectors[a], vectors[b]) >= threshold;
  };
  const fixedGroups = (cluster) => new Set(cluster.filter((index) => !records[index].movable).map((index) => records[index].group));

  for (const { i, j } of accepted) {
    const left = clusterOf[i];
    const right = clusterOf[j];
    if (left === right || left.length + right.length > maxClusterSize) continue;
    const merged = [...left, ...right];
    if (fixedGroups(merged).size > 1) continue;
    if (!left.every((a) => right.every((b) => pairOk(a, b)))) continue;
    for (const index of merged) clusterOf[index] = merged;
  }

  const seen = new Set();
  const proposals = [];
  for (const cluster of clusterOf) {
    if (cluster.length < 2 || seen.has(cluster)) continue;
    seen.add(cluster);
    const members = cluster.map((index) => records[index]).sort((a, b) => (a.term < b.term ? -1 : 1));
    const canonical = chooseCanonical(members);
    const aliases = members
      .filter((member) => member.term !== canonical && member.group !== canonical && member.movable)
      .map((member) => member.term);
    if (aliases.length === 0) continue;
    const languages = [...new Set(members.flatMap((member) => member.languages))].sort();
    const crossLanguage = languages.length >= 2;
    // Measured over the new links only; pairs that are already one group say
    // nothing about the proposal.
    const similarities = [];
    for (let a = 0; a < cluster.length; a += 1) {
      for (let b = a + 1; b < cluster.length; b += 1) {
        if (records[cluster[a]].group === records[cluster[b]].group) continue;
        similarities.push(dot(vectors[cluster[a]], vectors[cluster[b]]));
      }
    }
    proposals.push({
      id: proposalId(members.map((member) => member.term)),
      canonical,
      aliases,
      languages,
      crossLanguage,
      similarity: {
        min: round3(Math.min(...similarities)),
        mean: round3(similarities.reduce((sum, value) => sum + value, 0) / similarities.length)
      },
      sources: [...new Set(members.flatMap((member) => member.sources))].sort(),
      members: members.map((member) => ({
        term: member.term,
        languages: member.languages,
        sources: member.sources,
        linkedTo: member.group === member.term ? null : member.group
      }))
    });
  }

  proposals.sort(
    (a, b) =>
      Number(b.crossLanguage) - Number(a.crossLanguage) ||
      b.similarity.min - a.similarity.min ||
      (a.id < b.id ? -1 : 1)
  );
  return { proposals, stats: { terms: n, candidatePairs: edges.length, acceptedPairs: accepted.length, rejected } };
}

/** Embeds in batches; the embedder returns one vector per input text. */
export async function embedAll(embedder, texts, { batchSize = 64, onProgress } = {}) {
  const vectors = [];
  for (let start = 0; start < texts.length; start += batchSize) {
    const batch = texts.slice(start, start + batchSize);
    const out = await embedder.embed(batch);
    if (out.length !== batch.length) throw new Error("embedder returned the wrong number of vectors");
    vectors.push(...out);
    onProgress?.(Math.min(texts.length, start + batchSize), texts.length);
  }
  return vectors;
}

/**
 * The whole pipeline minus file I/O. `embedder.id` names the model in the
 * output; `embedder.real` must be true for the CLI to write the tracked file.
 */
export async function mineSynonyms({ records, embedder, options = {}, inputs = {}, onProgress, generatedAt }) {
  const settings = { ...DEFAULT_OPTIONS, ...options };
  // e5 models expect a task prefix; "query: " is the symmetric choice.
  const vectors = await embedAll(embedder, records.map((record) => `query: ${record.term}`), { onProgress });
  const { proposals, stats } = clusterTerms(records, vectors, settings);
  return {
    schema: PROPOSALS_SCHEMA,
    status: "unreviewed",
    note:
      "Machine suggestions, not reviewed by anyone. Nothing here reaches the engine until a person " +
      "approves an entry with scripts/approve-synonyms.mjs --confirm.",
    generatedAt: generatedAt ?? new Date().toISOString().slice(0, 10),
    embedder: embedder.id,
    inputs,
    options: settings,
    stats,
    proposals
  };
}
