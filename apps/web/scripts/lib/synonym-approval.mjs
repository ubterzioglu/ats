/**
 * The pure half of scripts/approve-synonyms.mjs: turns one reviewed proposal
 * into an approved entry. No file access here, so the rules are testable.
 *
 * Approving is a person's decision. The CLI only calls this after an explicit
 * --confirm, and this function only ever writes `approvedBy: "human"` with the
 * date the person passed in.
 */

const DATE_RX = /^\d{4}-\d{2}-\d{2}$/;
const LANGUAGES = new Set(["en", "de", "tr"]);

function fail(message) {
  throw new Error(message);
}

function claimedSurfaces(entries, skipId) {
  const claimed = new Map();
  for (const entry of entries) {
    if (entry.id === skipId) continue;
    claimed.set(entry.canonical, entry.id);
    for (const alias of entry.aliases) claimed.set(alias, entry.id);
  }
  return claimed;
}

function checkSurfaces(canonical, aliases, entries, skipId, isGuarded) {
  for (const surface of [canonical, ...aliases]) {
    if (isGuarded(surface)) fail(`"${surface}" is an ambiguous, stopword or too-short surface and cannot be a synonym`);
  }
  const claimed = claimedSurfaces(entries, skipId);
  for (const alias of aliases) {
    const owner = claimed.get(alias);
    if (owner !== undefined) fail(`"${alias}" is already used by approved entry ${owner}`);
  }
  for (const entry of entries) {
    if (entry.id !== skipId && entry.aliases.includes(canonical)) {
      fail(`"${canonical}" is already an alias in approved entry ${entry.id}`);
    }
  }
}

/**
 * Returns the approved file with `id` approved by a person on `date`.
 *  - A proposal id becomes a new entry (minus any `drop`ped aliases).
 *  - A pending-review entry already on file is promoted to "human".
 *  - An entry a person already approved is left alone and reported.
 */
export function approveProposal({ approvedDoc, proposalsDoc, id, date, drop = [], note, isGuarded = () => false }) {
  if (typeof id !== "string" || id.length === 0) fail("a proposal id is required");
  if (typeof date !== "string" || !DATE_RX.test(date)) fail("date must be YYYY-MM-DD");
  if (approvedDoc?.schema !== 1 || !Array.isArray(approvedDoc.entries)) fail("approved file is not schema 1");
  const entries = approvedDoc.entries;
  const dropped = new Set(drop);

  const existing = entries.find((entry) => entry.id === id);
  if (existing) {
    if (existing.approvedBy === "human") fail(`${id} was already approved on ${existing.approvedOn}`);
    for (const term of dropped) {
      if (!existing.aliases.includes(term)) fail(`--drop "${term}" is not an alias of ${id}`);
    }
    const aliases = existing.aliases.filter((alias) => !dropped.has(alias));
    if (aliases.length === 0) fail("nothing left to approve after --drop");
    checkSurfaces(existing.canonical, aliases, entries, id, isGuarded);
    const entry = {
      ...existing,
      aliases,
      approvedBy: "human",
      approvedOn: date,
      ...(note ? { note } : {})
    };
    return { doc: { ...approvedDoc, entries: entries.map((item) => (item.id === id ? entry : item)) }, entry, promoted: true };
  }

  const proposal = proposalsDoc?.proposals?.find((item) => item.id === id);
  if (!proposal) fail(`no proposal or pending entry with id ${id}`);
  for (const term of dropped) {
    if (!proposal.aliases.includes(term)) fail(`--drop "${term}" is not an alias of ${id}`);
  }
  const aliases = proposal.aliases.filter((alias) => !dropped.has(alias));
  if (aliases.length === 0) fail("nothing left to approve after --drop");
  checkSurfaces(proposal.canonical, aliases, entries, id, isGuarded);

  const entry = {
    id,
    canonical: proposal.canonical,
    aliases,
    languages: proposal.languages.filter((language) => LANGUAGES.has(language)),
    approvedBy: "human",
    approvedOn: date,
    origin: "miner",
    similarity: proposal.similarity?.min ?? null,
    ...(note ? { note } : {})
  };
  // Appended, never inserted: when two entries claim a surface the earlier
  // one keeps it, so approving something new cannot change an older decision.
  return { doc: { ...approvedDoc, entries: [...entries, entry] }, entry, promoted: false };
}
