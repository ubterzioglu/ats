/**
 * Compiles the static skill dictionary at lib/scoring/data/skills.json from
 * three sources:
 *   - ESCO v1.2.1 skills pillar, knowledge concepts only, English and German
 *     labels (fetch with scripts/fetch-esco-skills.mjs);
 *   - O*NET 31.0 software_skills.csv (download from onetcenter.org);
 *   - scripts/skill-sources/manual-tr.tsv, a hand-made Turkish list.
 *
 * Run by hand after refreshing the raw files, never at install or build time:
 *   node scripts/build-skill-dictionary.mjs
 *
 * Raw downloads live in .skill-sources/ (git-ignored). The filters below are
 * deliberately strict: an entry that turns ordinary prose into a "skill"
 * inflates the baseline keyword check, so anything generic stays out. See
 * docs/skill-dictionary-sources.md for the licences and the attribution text.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

// The engine's own guards, loaded from source (Node strips the type syntax),
// so the build and the runtime agree on what a token and a stopword are.
const { tokenize, caseFold } = await import(pathToUrl("lib/scoring/text.ts"));
const { ALL_STOPWORDS, STOPWORDS_DE, STOPWORDS_EN, JOB_POSTING_NOISE } = await import(pathToUrl("lib/scoring/stopwords.ts"));
const { AMBIGUOUS_TERMS } = await import(pathToUrl("lib/scoring/ambiguous-terms.ts"));

const ESCO_VERSION = "v1.2.1";
const ONET_VERSION = "31.0";
const ESCO_DIR = path.join(root, ".skill-sources", `esco-${ESCO_VERSION}`);
const ONET_DIR = path.join(root, ".skill-sources", `onet-${ONET_VERSION}`);
const MANUAL_TR = path.join(root, "scripts", "skill-sources", "manual-tr.tsv");
const OUTPUT = path.join(root, "lib", "scoring", "data", "skills.json");

const MAX_TOKENS = 4;
/** The hand-made list is reviewed line by line, so a five-word method name may stay. */
const MANUAL_MAX_TOKENS = 5;
const MAX_LENGTH = 48;
const MAX_ALIASES = 4;
const GZIP_BUDGET = 300 * 1024;
/** O*NET examples outside the Hot Technology list must appear for this many occupations. */
const ONET_MIN_OCCUPATIONS = 5;
/** ESCO knowledge concepts must be linked to at least this many occupations. */
const ESCO_MIN_OCCUPATIONS = 1;

/**
 * Words that pass every structural test and still read as prose on a CV.
 * Reviewed against the build output; extend it when a rebuild lets one in.
 */
const GENERIC = new Set(
  `access teams word outlook office project projects chef bootstrap facebook twitter
   instagram linkedin youtube google apple amazon microsoft oracle adobe internet email
   windows mail calendar notes paint publisher visio forms sheets docs slides drive
   keynote numbers pages photos maps chrome safari edge explorer firefox opera
   management kommunikation marketing vertrieb verwaltung beratung organisation
   führung planung steuerung analyse entwicklung betrieb dokumentation qualität
   software hardware system systems data database network service services solution
   solutions platform tool tools server cloud web online digital mobile app apps
   express spring rails swift ruby go rust dart less salt rage shiva frostbite litchi
   tadpoles seesaw zoom slack unity blink canvas blackboard quicken loom cam cae staf hms
   lams moem blackberry buddhism videoconferencing blogging appletree jsss workday latin call
   flex fluent inventor maya painter distiller millennium bamboo hive concur cassandra acrobat
   struts tomcat hydra cuneiform sequel subquery yahoo ann ems pos pow obs plc pms domino workspace`.split(/\s+/).filter(Boolean)
);

/** ESCO knowledge labels that are everyday phrases rather than CV skills. */
const GENERIC_PHRASES = new Set([
  "application process", "body language", "human ear", "art collections", "animal positions",
  "numerical sequences", "teamwork principles", "company policies", "work ethics",
  "financial products", "musical instruments", "security regulations", "clinical reports",
  "public offering", "refractive power", "human anatomy", "office software", "spoken language",
  "military code", "art history", "world geography", "general medicine", "geografische gebiete",
  "ausreichende nahrungsaufnahme", "öffentliche meinungsbildung", "internationale wasserstraßen",
  "win/nt"
]);

/** First words of ESCO catalogue headings ("Arten gefährlicher Abfälle"). */
const CATALOGUE_HEADS = new Set([
  "types", "type", "principles", "characteristics", "history", "arten", "grundsätze",
  "eigenschaften", "geschichte", "merkmale"
]);

/** Heads of German compounds that name a discipline, method or body of rules. */
const GERMAN_SKILL_HEAD_RX =
  /(management|technik|techniken|technologie|technologien|verfahren|recht|analyse|analytik|entwicklung|programmierung|planung|systeme|methoden|methodik|wissenschaft|wissenschaften|medizin|therapie|pflege|buchhaltung|buchführung|rechnung|design|sicherheit|steuerung|wartung|prüfung|diagnostik|marketing|controlling|engineering|informatik|statistik|logistik|optimierung|modellierung|automatisierung|sprache|sprachen|tests)$/;

/** Vendor prefixes O*NET puts in front of product names ("Autodesk AutoCAD"). */
const VENDORS = [
  "microsoft", "adobe", "autodesk", "oracle", "apache", "amazon", "google", "ibm", "sap",
  "atlassian", "red hat", "salesforce", "intuit", "sas", "dassault systemes", "bentley",
  "esri", "the mathworks", "mathworks", "cisco", "vmware", "apple", "corel", "hashicorp",
  "jetbrains", "github", "gitlab", "meta", "facebook", "elastic", "mongodb", "tableau",
  "teradata", "informatica", "qlik", "sage", "epic systems", "cerner", "infor", "workday",
  "servicenow", "siemens", "trimble", "unity technologies", "epic games", "nvidia",
  "docker", "progress", "micro focus", "hewlett packard enterprise", "hp", "dell", "citrix",
  "splunk", "palantir", "wolfram research", "minitab", "stata", "ptc", "ansys", "graphisoft"
];

function pathToUrl(relative) {
  return new URL(`file:///${path.join(root, relative).replace(/\\/g, "/")}`).href;
}

function asciiFold(text) {
  return text
    .replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ı/g, "i")
    .replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u");
}

/** Lowercased, whitespace-collapsed, parenthetical and trailing "software" removed. */
function clean(label) {
  return caseFold(
    label
      .normalize("NFC")
      .replace(/[‘’]/g, "'")
      .replace(/[–—]/g, "-")
      .replace(/\s*\([^)]*\)\s*/g, " ")
      .replace(/\s+software$/i, "")
      .replace(/\s+/g, " ")
      .trim()
  );
}

/**
 * A single word that is plainly a product or a technical token by its shape:
 * internal capitals (JavaScript, AutoCAD), a digit (Log4j), a symbol (C++,
 * Node.js) or an acronym of at least three letters (SPSS).
 */
function hasTechnicalShape(original) {
  const word = original.trim();
  if (/\s/.test(word)) return false;
  if (/^[\p{Lu}][\p{Ll}]+[\p{Lu}]/u.test(word) || /^[\p{Ll}]+[\p{Lu}]/u.test(word)) return true;
  if (/\d/.test(word) && /\p{L}/u.test(word)) return true;
  if (/[+#.]/.test(word) && /\p{L}/u.test(word)) return true;
  return /^[\p{Lu}]{3,6}$/u.test(word);
}

const rejections = new Map();
function reject(reason, term) {
  const list = rejections.get(reason) ?? [];
  list.push(term);
  rejections.set(reason, list);
  return false;
}

/**
 * Structural guard shared by every source, for canonical terms and aliases alike.
 *
 * The Turkish stopword list carries content nouns ("iş", "süreç", "zaman")
 * that legitimately open a skill phrase ("iş analizi"), so a phrase may start
 * with one; it may not start with an English or German function word unless
 * it is a reviewed hand-made term ("hat dengeleme"), and no phrase may end on
 * a stopword of any language.
 */
function isUsable(term, maxTokens = MAX_TOKENS, reviewed = false) {
  if (term.length < 3 || term.length > MAX_LENGTH) return reject("length", term);
  if (!/^[\p{L}\p{N}][\p{L}\p{N} +#./&'-]*$/u.test(term)) return reject("characters", term);
  const tokens = tokenize(term);
  if (tokens.length === 0 || tokens.length > maxTokens) return reject("token-count", term);
  const first = tokens[0];
  const last = tokens[tokens.length - 1];
  const firstIsFunctionWord = STOPWORDS_EN.has(first) || STOPWORDS_DE.has(first);
  if (ALL_STOPWORDS.has(last) || (tokens.length === 1 ? ALL_STOPWORDS.has(first) : firstIsFunctionWord && !reviewed)) {
    return reject("stopword-edge", term);
  }
  if (tokens.every((token) => ALL_STOPWORDS.has(token) || JOB_POSTING_NOISE.has(token) || /^\d+$/.test(token))) {
    return reject("all-noise", term);
  }
  if (tokens.length === 1) {
    if (AMBIGUOUS_TERMS.has(term)) return reject("ambiguous", term);
    if (JOB_POSTING_NOISE.has(term)) return reject("job-noise", term);
    if (GENERIC.has(term)) return reject("generic", term);
    if (term.length < 3) return reject("short", term);
  }
  return true;
}

/** Lowercase words ESCO uses as ordinary vocabulary ("manage teams", "word processing"). */
function proseVocabulary(records) {
  const vocab = new Set();
  for (const record of records) {
    const labels = [record.preferredLabel.en, ...(record.alternativeLabel.en ?? [])];
    for (const label of labels) {
      if (!label) continue;
      for (const word of label.split(/[\s/(),]+/)) {
        if (/^[\p{Ll}][\p{Ll}'-]*$/u.test(word)) vocab.add(word);
      }
    }
  }
  return vocab;
}

/**
 * A single English word enters only if it is a technical token by shape, or a
 * proper noun ESCO never uses as an ordinary lowercase word.
 */
function singleWordAllowed(original, vocab) {
  const word = clean(original);
  const bare = original.replace(/\s*\([^)]*\)\s*/g, "").replace(/\s+software$/i, "").trim();
  // An all-caps label is still checked against prose: "CALL" is also "call".
  if (vocab.has(word)) return reject("single-prose", word);
  if (hasTechnicalShape(bare)) return true;
  if (!/^[\p{Lu}]/u.test(bare)) return reject("single-lowercase", word);
  if (word.length < 4) return reject("single-short", word);
  return true;
}

async function readEsco() {
  const raw = await readFile(path.join(ESCO_DIR, "skills.jsonl"), "utf8");
  const meta = JSON.parse(await readFile(path.join(ESCO_DIR, "meta.json"), "utf8"));
  const records = raw.split("\n").filter(Boolean).map((line) => JSON.parse(line));
  return { records, meta };
}

function escoEntries(records, vocab) {
  const out = [];
  const knowledge = records.filter(
    (record) =>
      record.status === "released" &&
      record.skillType.includes("knowledge") &&
      !record.reuseLevel.includes("transversal") &&
      record.occupations >= ESCO_MIN_OCCUPATIONS
  );
  for (const record of knowledge) {
    const englishLabel = record.preferredLabel.en;
    const englishMulti = englishLabel ? tokenize(clean(englishLabel)).length > 1 : false;
    for (const lang of ["en", "de"]) {
      const preferred = record.preferredLabel[lang];
      if (!preferred) continue;
      const accept = (label) => {
        const term = clean(label);
        if (!isUsable(term)) return null;
        const tokens = tokenize(term);
        if (tokens.length === 1) {
          if (lang === "en" && !singleWordAllowed(label, vocab)) return null;
          // A German one-word label is kept only when it is the compound of a
          // multi-word English concept and ends on a discipline or method head
          // ("Projektmanagement", "Automatisierungstechnik"), never a field
          // name like "Mathematik" or a market word like "Arbeitsmarkt".
          if (
            lang === "de" &&
            !hasTechnicalShape(label) &&
            !(englishMulti && term.length >= 10 && GERMAN_SKILL_HEAD_RX.test(term))
          ) {
            return reject("de-single", term);
          }
        } else if (tokens.slice(1, -1).some((token) => STOPWORDS_EN.has(token) || STOPWORDS_DE.has(token))) {
          // "types of pallets", "principles of combustion engines": catalogue
          // headings, not something a CV says verbatim.
          return reject("interior-function-word", term);
        }
        if (GENERIC_PHRASES.has(term)) return reject("generic-phrase", term);
        if (tokens.length > 1 && CATALOGUE_HEADS.has(tokens[0])) return reject("catalogue-heading", term);
        return term;
      };
      const term = accept(preferred);
      if (!term) continue;
      const termTokens = tokenize(term);
      const aliases = (record.alternativeLabel[lang] ?? [])
        .map(accept)
        .filter(Boolean)
        .filter((alias) => {
          // ESCO alternative labels sometimes name a narrower thing ("AngularJS"
          // under "computer programming"). An English one-word alias of a
          // phrase is kept only when it is the phrase's acronym ("bpmn").
          if (lang !== "en" || termTokens.length < 2 || tokenize(alias).length > 1) return true;
          const initials = termTokens.map((token) => token[0]).join("");
          return alias === initials || reject("alias-not-acronym", `${alias}>${term}`);
        });
      out.push({ term, lang, source: "esco", aliases, rank: record.occupations });
    }
  }
  return out;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += char;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

async function readOnet() {
  const rows = parseCsv(await readFile(path.join(ONET_DIR, "software_skills.csv"), "utf8"));
  const header = rows.shift();
  const col = (name) => header.indexOf(name);
  const exampleCol = col("Workplace Example");
  const hotCol = col("Hot Technology");
  const demandCol = col("In Demand");
  const socCol = col("O*NET-SOC Code");
  if ([exampleCol, hotCol, demandCol, socCol].includes(-1)) {
    throw new Error(`unexpected O*NET header: ${header.join(",")}`);
  }
  const byExample = new Map();
  for (const row of rows) {
    const example = row[exampleCol]?.trim();
    if (!example) continue;
    const entry = byExample.get(example) ?? { occupations: new Set(), hot: false, demand: false };
    entry.occupations.add(row[socCol]);
    entry.hot ||= row[hotCol] === "Y";
    entry.demand ||= row[demandCol] === "Y";
    byExample.set(example, entry);
  }
  return byExample;
}

/** The product name without its vendor, cleaned and in its original casing. */
function stripVendor(term, original) {
  for (const vendor of VENDORS) {
    if (!term.startsWith(`${vendor} `)) continue;
    const words = original.trim().split(/\s+/).slice(vendor.split(" ").length).join(" ");
    return { stripped: term.slice(vendor.length + 1), original: words };
  }
  return null;
}

function onetEntries(byExample, vocab) {
  const out = [];
  for (const [example, info] of byExample) {
    if (!info.hot && !info.demand && info.occupations.size < ONET_MIN_OCCUPATIONS) continue;
    const term = clean(example);
    if (!isUsable(term)) continue;
    const tokens = tokenize(term);
    if (tokens.slice(1, -1).some((token) => STOPWORDS_EN.has(token))) {
      reject("interior-function-word", term);
      continue;
    }
    if (tokenize(term).length === 1 && !singleWordAllowed(example, vocab)) continue;
    const aliases = [];
    const vendorless = stripVendor(term, example);
    if (vendorless && isUsable(vendorless.stripped)) {
      const single = tokenize(vendorless.stripped).length === 1;
      if (!single || singleWordAllowed(vendorless.original, vocab)) aliases.push(vendorless.stripped);
    }
    const rank = (info.hot ? 1000 : 0) + (info.demand ? 500 : 0) + info.occupations.size;
    out.push({ term, lang: "en", source: "onet", aliases, rank });
  }
  return out;
}

async function manualTrEntries() {
  const text = await readFile(MANUAL_TR, "utf8");
  const out = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim() || line.startsWith("#")) continue;
    const [termRaw, english, extra = ""] = line.split("\t");
    if (!termRaw || !english) throw new Error(`manual-tr line needs term and English: ${line}`);
    const term = caseFold(termRaw.trim());
    if (!isUsable(term, MANUAL_MAX_TOKENS, true)) continue;
    const candidates = [
      asciiFold(term),
      ...extra.split("|").map((alias) => caseFold(alias.trim())).filter(Boolean)
    ];
    for (const alias of [...candidates]) candidates.push(asciiFold(alias));
    const aliases = [...new Set(candidates)].filter(
      (alias) => alias !== term && isUsable(alias, MANUAL_MAX_TOKENS)
    );
    out.push({ term, lang: "tr", source: "manual-tr", aliases, rank: Number.MAX_SAFE_INTEGER, en: english.trim() });
  }
  return out;
}

/**
 * One owner per surface form. Earlier entries win: the hand-made list first,
 * then ESCO, then O*NET, each ordered by how widely the source uses the term.
 */
function dedupe(entries) {
  const claimed = new Set();
  const terms = new Set(entries.map((entry) => entry.term));
  const out = [];
  for (const entry of entries) {
    if (claimed.has(entry.term)) {
      reject("duplicate-term", entry.term);
      continue;
    }
    claimed.add(entry.term);
    const aliases = [];
    for (const alias of entry.aliases) {
      if (alias === entry.term || claimed.has(alias) || terms.has(alias)) continue;
      if (aliases.length >= MAX_ALIASES) break;
      claimed.add(alias);
      aliases.push(alias);
    }
    out.push({ ...entry, aliases });
  }
  return out;
}

async function main() {
  const { records, meta: escoMeta } = await readEsco();
  const vocab = proseVocabulary(records);
  const sourceOrder = { "manual-tr": 0, esco: 1, onet: 2 };
  const all = [
    ...(await manualTrEntries()),
    ...escoEntries(records, vocab),
    ...onetEntries(await readOnet(), vocab)
  ].sort(
    (a, b) =>
      sourceOrder[a.source] - sourceOrder[b.source] || b.rank - a.rank || a.term.localeCompare(b.term)
  );
  const entries = dedupe(all).sort((a, b) => a.term.localeCompare(b.term));

  const dictionary = {
    schema: 1,
    sources: {
      esco: {
        name: "ESCO classification",
        version: escoMeta.version,
        retrieved: escoMeta.retrieved.slice(0, 10),
        url: "https://esco.ec.europa.eu/"
      },
      onet: {
        name: "O*NET Database",
        version: ONET_VERSION,
        retrieved: new Date().toISOString().slice(0, 10),
        url: "https://www.onetcenter.org/database.html"
      },
      "manual-tr": { name: "Hand-made Turkish list", version: "1", url: null }
    },
    entries: entries.map(({ term, lang, source, aliases }) =>
      aliases.length > 0 ? [term, lang, source, aliases] : [term, lang, source]
    )
  };

  const json = JSON.stringify(dictionary);
  await writeFile(OUTPUT, json + "\n");

  const counts = {};
  for (const entry of entries) {
    const key = `${entry.source}/${entry.lang}`;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  const gzip = gzipSync(json).length;
  console.log(`entries: ${entries.length}`, counts);
  console.log(`aliases: ${entries.reduce((sum, entry) => sum + entry.aliases.length, 0)}`);
  console.log(`size: ${json.length} bytes, gzip ${gzip} bytes (budget ${GZIP_BUDGET})`);
  for (const [reason, terms] of rejections) {
    console.log(`rejected ${reason}: ${terms.length} e.g. ${terms.slice(0, 8).join(" | ")}`);
  }
  if (gzip > GZIP_BUDGET) {
    console.error("over the size budget");
    process.exit(1);
  }
}

await main();
