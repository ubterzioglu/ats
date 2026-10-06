# Synonym mining and approval

Batch D3. Cross-language synonyms (en/de/tr) are proposed offline by an embedding model and reach the engine only
after a person approves them. The engine never runs a model: it reads the approved list as static data.

```
skills.json + taxonomy (+ fixtures)
   -> scripts/mine-synonyms.mjs          (developer machine, embedding model)
   -> scripts/synonym-proposals/proposals.json   (unreviewed, git-ignored)
   -> person reviews
   -> scripts/approve-synonyms.mjs <id> --confirm
   -> lib/scoring/data/approved-synonyms.json    (approvedBy: "human" only is read)
   -> lib/scoring/taxonomy.ts                    (aliases, below curated and dictionary)
```

## Mining

```bash
cd apps/web
node scripts/mine-synonyms.mjs --fixtures
```

- Model: `Xenova/multilingual-e5-small` (q8) through `@huggingface/transformers` in Node, the same model the browser
  hints use. About 118 MB, downloaded on the first run into `~/.cache/ats-synonym-miner` (`--cache-dir` to change);
  nothing is stored in the repository. With the model cached, a full run over about 11,000 terms takes under a minute.
- Terms: the curated taxonomy and its synonyms, every dictionary term and alias, and with `--fixtures` the terms
  `extractJobKeywords` finds in the test fixture ads and CVs. `--no-aliases` embeds canonical terms only.
- Never run by `npm install`, `npm run build`, the tests or CI (a test checks `package.json`).

### Rules

A pair is proposed only when all of these hold:

- cosine similarity at or above `--threshold` (default 0.93);
- each term is among the other's `--neighbours` nearest terms (default 5), so a hub term cannot pair with everything;
- the two terms are in different languages (default; `--all-languages` lifts it), and a cluster holds at most one
  new member per language;
- they do not already resolve to the same term (curated synonym, dictionary alias or a pending entry);
- neither is an ambiguous token, stopword or job-ad noise (`isGuardedSurface`, the same guard the dictionary build
  uses), and neither is a single token of four letters or fewer ("kvkk", "gmp");
- they do not differ by a version, number or symbol ("html" / "html5", "iso 9001" / "iso 27001", "c" / "c++") and one
  spelling is not nested inside the other ("java" / "javascript", "sql" / "mysql");
- they are not two curated terms; the curated table already decided those are different.

Clusters grow by complete linkage (every new pair inside a cluster clears the threshold) up to `--max-cluster`
(default 6). The canonical side is the term an existing alias already belongs to, otherwise a curated term, then a
dictionary term, then English.

### Calibration of the default

Measured on the first real run (2026-10-06, model cached, 10,906 terms): unrelated short terms score 0.80-0.85
("budgeting" / "java" 0.83); wrong cross-language pairs appear from about 0.88 to 0.91 ("konsolidasyon" /
"europäische integration" 0.90, "kaizen çalışmaları" / "total quality control" 0.89); above 0.93 the sample was mostly
translations of the same ESCO concept, with a few wrong pairs still present ("hidrolik sistemler" via
"hydraulic systems", an alias of "mechanical systems"). Every proposal still needs a person.

### Output

`scripts/synonym-proposals/proposals.json` (git-ignored, about 300 KB; rerun to regenerate):

| Field | Meaning |
| --- | --- |
| `status` | always `"unreviewed"` |
| `embedder`, `options`, `inputs`, `stats` | how the file was produced; `stats.rejected` counts each exclusion rule |
| `proposals[].id` | `syn-` plus a hash of the member terms; stable across reruns |
| `proposals[].canonical` | the term the aliases would resolve to |
| `proposals[].aliases` | the new links this proposal would add |
| `proposals[].languages`, `crossLanguage` | languages of the members |
| `proposals[].similarity` | lowest and mean cosine over the new links |
| `proposals[].sources` | `esco`, `onet`, `manual-tr`, `curated`, `curated-alias`, `fixture` |
| `proposals[].members[].linkedTo` | the term a member already resolves to, if any |

## Approving

```bash
node scripts/approve-synonyms.mjs syn-1234567890                     # dry run, prints the entry
node scripts/approve-synonyms.mjs syn-1234567890 --drop "term" --note "checked against ESCO" --confirm
```

- Only `--confirm` writes. The entry gets `approvedBy: "human"` and today's date (`--date` to set it).
- `--drop` removes aliases you reject; the rest of the proposal is approved.
- An id of a `pending-review` entry already in the approved file promotes it to `human`.
- Refused: ambiguous surfaces, an alias another approved entry owns, a canonical term that is an alias elsewhere, and
  anything the engine's schema check would skip.
- After approving, run `npm test` and bump `ENGINE_VERSION`: an approved synonym can change scores.

## How the engine reads it

`lib/scoring/approved-synonyms.ts` validates the file; `lib/scoring/taxonomy.ts` indexes entries with
`approvedBy === "human"` only. Approved aliases rank below the curated table and the dictionary: a curated term, a
curated alias or a dictionary alias keeps its owner, and an alias that differs from its canonical term by a version is
dropped. A dictionary term may be folded into an approved canonical term ("marktanalyse" into "market analysis"); that
is what approval is for. `pending-review` entries have no effect. `tests/approved-synonyms.test.ts` covers this with
its own lists, never by writing a human approval into the shipped file.
