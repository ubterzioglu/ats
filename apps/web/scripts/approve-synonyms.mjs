/**
 * Moves one reviewed synonym proposal into lib/scoring/data/approved-synonyms.json
 * as `approvedBy: "human"`. Run by the person who reviewed it:
 *
 *   node scripts/approve-synonyms.mjs <id>                    # dry run, prints the entry
 *   node scripts/approve-synonyms.mjs <id> --confirm          # writes it
 *   node scripts/approve-synonyms.mjs <id> --drop "term" --note "why" --confirm
 *
 * <id> is a proposal id from scripts/synonym-proposals/proposals.json, or the
 * id of a "pending-review" entry already in the approved file. Nothing is
 * written without --confirm. After approving, run the tests and bump
 * ENGINE_VERSION: an approved synonym can change scores.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { WEB_ROOT, importFromWeb } from "./lib/load-engine.mjs";
import { approveProposal } from "./lib/synonym-approval.mjs";

const APPROVED = path.join(WEB_ROOT, "lib", "scoring", "data", "approved-synonyms.json");
const PROPOSALS = path.join(WEB_ROOT, "scripts", "synonym-proposals", "proposals.json");

function parseArgs(argv) {
  const args = { id: null, drop: [], note: undefined, confirm: false, date: new Date().toISOString().slice(0, 10) };
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    const value = () => {
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) throw new Error(`${flag} needs a value`);
      i += 1;
      return next;
    };
    if (flag === "--confirm") args.confirm = true;
    else if (flag === "--drop") args.drop.push(value());
    else if (flag === "--note") args.note = value();
    else if (flag === "--date") args.date = value();
    else if (flag.startsWith("--")) throw new Error(`unknown flag ${flag}`);
    else if (args.id === null) args.id = flag;
    else throw new Error(`unexpected argument ${flag}`);
  }
  if (args.id === null) throw new Error("usage: node scripts/approve-synonyms.mjs <id> [--drop term] [--note text] [--confirm]");
  return args;
}

async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    if (fallback !== undefined && error.code === "ENOENT") return fallback;
    throw error;
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { isGuardedSurface, parseApprovedSynonymFile } = await importFromWeb("lib/scoring/approved-synonyms.ts");
  const approvedDoc = await readJson(APPROVED);
  const proposalsDoc = await readJson(PROPOSALS, { proposals: [] });

  const { doc, entry, promoted } = approveProposal({
    approvedDoc,
    proposalsDoc,
    id: args.id,
    date: args.date,
    drop: args.drop,
    note: args.note,
    isGuarded: isGuardedSurface
  });

  // The engine silently skips a row it cannot parse; refuse to write one.
  const check = parseApprovedSynonymFile(doc);
  if (check.rejected > 0 || check.entries.length !== doc.entries.length) {
    throw new Error("the result does not pass the engine's schema check; nothing written");
  }

  console.log(JSON.stringify(entry, null, 2));

  // The engine re-applies its own priority rules; say which aliases it would skip.
  const { buildApprovedSynonymIndex } = await importFromWeb("lib/scoring/taxonomy.ts");
  const index = buildApprovedSynonymIndex(check.entries);
  const skipped = entry.aliases.filter((alias) => index.aliasOf.get(alias) !== entry.canonical);
  if (skipped.length > 0) {
    console.log(
      `\nwarning: the engine will ignore ${skipped.map((alias) => `"${alias}"`).join(", ")} ` +
        "(curated or dictionary owner, version look-alike, or an unknown canonical term)."
    );
  }

  if (!args.confirm) {
    console.log(`\ndry run: nothing written. Re-run with --confirm to approve ${args.id} as a human reviewer.`);
    return;
  }
  await writeFile(APPROVED, `${JSON.stringify(doc, null, 2)}\n`);
  console.log(`\n${promoted ? "promoted" : "approved"} ${args.id} in ${path.relative(WEB_ROOT, APPROVED)}.`);
  console.log("Run npm test, then bump ENGINE_VERSION: approved synonyms can change scores.");
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
