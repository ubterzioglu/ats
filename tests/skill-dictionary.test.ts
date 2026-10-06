import { readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

import { describe, expect, it } from "vitest";

import de from "@/messages/de.json";
import en from "@/messages/en.json";
import tr from "@/messages/tr.json";
import { analyzeCv } from "@/lib/scoring";
import { countOccurrences } from "@/lib/scoring/keywords";
import raw from "@/lib/scoring/data/skills.json";
import {
  DICTIONARY_ENTRIES,
  DICTIONARY_SOURCES,
  parseDictionaryRow
} from "@/lib/scoring/skill-dictionary";
import { isJobNoise, isStopword } from "@/lib/scoring/stopwords";
import {
  AMBIGUOUS_TERMS,
  SKILL_SET,
  SYNONYMS,
  canonicalize,
  findDictionaryPhrases,
  isDictionarySkill,
  isKnownSkill,
  variantsOf
} from "@/lib/scoring/taxonomy";
import { caseFold, tokenize } from "@/lib/scoring/text";

/**
 * The dictionary is generated data, so these checks guard the generator as
 * much as the file: a rebuild that lets prose words in, drops the source tag
 * or blows the bundle budget fails here before it reaches a score.
 */

const JSON_PATH = join(__dirname, "..", "apps", "web", "lib", "scoring", "data", "skills.json");

const surfaces = DICTIONARY_ENTRIES.flatMap((entry) => [entry.term, ...entry.aliases]);

describe("skill dictionary file", () => {
  it("parses every row, with a known language and source tag", () => {
    expect(DICTIONARY_ENTRIES.length).toBe(raw.entries.length);
    for (const entry of DICTIONARY_ENTRIES) {
      expect(["en", "de", "tr"]).toContain(entry.language);
      expect(["esco", "onet", "manual-tr"]).toContain(entry.source);
    }
  });

  it("pairs each source with the languages it can supply", () => {
    for (const entry of DICTIONARY_ENTRIES) {
      if (entry.source === "onet") expect(entry.language).toBe("en");
      if (entry.source === "esco") expect(["en", "de"]).toContain(entry.language);
      if (entry.source === "manual-tr") expect(entry.language).toBe("tr");
    }
  });

  it("rejects malformed rows instead of trusting them", () => {
    expect(parseDictionaryRow(["x y z", "fr", "esco"])).toBeNull();
    expect(parseDictionaryRow(["x y z", "en", "lightcast"])).toBeNull();
    expect(parseDictionaryRow(["x y z", "en", "esco", [1]])).toBeNull();
    expect(parseDictionaryRow("x y z")).toBeNull();
    expect(parseDictionaryRow(["x y z", "en", "esco"])?.aliases).toEqual([]);
  });

  it("stores every surface folded, trimmed and single-spaced", () => {
    for (const surface of surfaces) {
      expect(surface).toBe(caseFold(surface).trim().replace(/\s+/g, " "));
    }
  });

  it("has no duplicate terms and no surface owned twice", () => {
    const seen = new Set<string>();
    for (const surface of surfaces) {
      expect(seen.has(surface), `"${surface}" appears twice`).toBe(false);
      seen.add(surface);
    }
  });

  it("lets no ambiguous token, stopword or job-ad noise in", () => {
    for (const surface of surfaces) {
      expect(surface.length).toBeGreaterThanOrEqual(3);
      expect(AMBIGUOUS_TERMS.has(surface), surface).toBe(false);
      expect(isStopword(surface), surface).toBe(false);
      expect(isJobNoise(surface), surface).toBe(false);
      const tokens = tokenize(surface);
      expect(tokens.length).toBeGreaterThan(0);
      expect(isStopword(tokens[tokens.length - 1] ?? ""), surface).toBe(false);
    }
  });

  it("keeps everyday single words out", () => {
    for (const word of ["teams", "word", "access", "office", "management", "zoom", "slack", "call", "less"]) {
      expect(surfaces).not.toContain(word);
    }
  });

  it("stays inside the size budget", () => {
    const bytes = readFileSync(JSON_PATH);
    expect(gzipSync(bytes).length).toBeLessThan(300 * 1024);
  });

  it("carries entries from every source it names", () => {
    const count = (source: string): number =>
      DICTIONARY_ENTRIES.filter((entry) => entry.source === source).length;
    expect(count("esco")).toBeGreaterThan(1000);
    expect(count("onet")).toBeGreaterThan(300);
    expect(count("manual-tr")).toBeGreaterThan(300);
    expect(DICTIONARY_SOURCES.esco.version).toBe("v1.2.1");
    expect(DICTIONARY_SOURCES.onet.version).toBe("31.0");
  });
});

describe("taxonomy integration", () => {
  it("recognises a term only the dictionary knows", () => {
    expect(SKILL_SET.has("jquery")).toBe(false);
    expect(isKnownSkill("jquery")).toBe(true);
    expect(isKnownSkill("datenanalyse")).toBe(true);
    expect(isKnownSkill("bordrolama")).toBe(true);
  });

  it("keeps curated entries first", () => {
    // Both are in the dictionary as well; the curated table still owns them.
    expect(isDictionarySkill("kubernetes")).toBe(false);
    expect(isDictionarySkill("postgresql")).toBe(false);
    expect(canonicalize("postgres")).toBe("postgresql");
    expect(variantsOf("postgresql")).toEqual(["postgresql", ...(SYNONYMS.postgresql ?? [])]);
    expect(canonicalize("k8s")).toBe("kubernetes");
  });

  it("resolves dictionary aliases to the dictionary term", () => {
    expect(canonicalize("autocad")).toBe("autodesk autocad");
    expect(countOccurrences("Drafted site plans in AutoCAD.", "autodesk autocad")).toBe(1);
    expect(canonicalize("bordro hazirlama")).toBe("bordrolama");
  });

  it("finds multi-word terms through tokens, whatever the punctuation", () => {
    expect(findDictionaryPhrases("Queries in Transact-SQL")).toContain("transact-sql");
    expect(findDictionaryPhrases("queries in transact sql")).toContain("transact-sql");
    expect(countOccurrences("queries in transact sql", "transact-sql")).toBe(1);
  });
});

function baselineTerms(cvText: string): string[] {
  return analyzeCv({ cvText }).keywords.matched.map((term) => term.term);
}

describe("baseline keyword check with the dictionary", () => {
  const english = `Jane Doe
jane@example.com
+44 7700 900000

Experience
Frontend Developer, Example Ltd
01/2020 - present
- Built customer dashboards with jQuery and Transact-SQL reports for the finance team.
- Maintained the build and release process for three web applications.

Skills
jQuery, Transact-SQL, Python
`;

  const german = `Max Mustermann
max@example.de
+49 151 0000000

Berufserfahrung
Analyst, Beispiel GmbH
01/2020 - heute
- Verantwortlich für die Datenanalyse und das Risikomanagement der Abteilung.
- Erstellung von Berichten für die Geschäftsführung und die Fachbereiche.

Kenntnisse
Datenanalyse, Risikomanagement, Python
`;

  const turkish = `Ayşe Yılmaz
ayse@example.com
+90 532 000 0000

Deneyim
Muhasebe Uzmanı, Örnek A.Ş.
01/2020 - halen
- Bordrolama ve SGK işlemleri süreçlerinin tamamını yürüttüm.
- Aylık proje planlama toplantılarında finans ekibini temsil ettim.

Beceriler
Bordrolama, SGK işlemleri, proje planlama, Python
`;

  it("counts an English dictionary term", () => {
    const terms = baselineTerms(english);
    expect(terms).toContain("jquery");
    expect(terms).toContain("transact-sql");
    expect(terms).toContain("python");
  });

  it("counts a German dictionary term", () => {
    const terms = baselineTerms(german);
    expect(terms).toContain("datenanalyse");
    expect(terms).toContain("risikomanagement");
  });

  it("counts a Turkish dictionary term", () => {
    const terms = baselineTerms(turkish);
    expect(terms).toContain("bordrolama");
    expect(terms).toContain("sgk işlemleri");
    expect(terms).toContain("proje planlama");
  });

  it("keeps every lost keyword point explained by a finding", () => {
    for (const cvText of [english, german, turkish]) {
      const result = analyzeCv({ cvText });
      for (const dimension of result.dimensions) {
        const cost = result.findings
          .filter((finding) => finding.dimension === dimension.id)
          .reduce((sum, finding) => sum + finding.cost, 0);
        expect(dimension.score).toBe(Math.max(0, Math.min(dimension.max, dimension.max - cost)));
      }
    }
  });
});

describe("attribution", () => {
  const catalogs: ReadonlyArray<readonly [string, { about: Record<string, string> }]> = [
    ["en", en],
    ["de", de],
    ["tr", tr]
  ];

  it.each(catalogs)("%s names ESCO with the wording the Commission asks for", (_locale, catalog) => {
    expect(catalog.about.escoCredit).toContain("This service uses the");
    expect(catalog.about.escoCredit).toContain("ESCO classification");
    expect(catalog.about.escoCredit).toContain("of the European Commission.");
  });

  it.each(catalogs)("%s credits O*NET with the licensor's text and version", (_locale, catalog) => {
    const credit = catalog.about.onetCredit ?? "";
    expect(credit).toContain(`O*NET ${DICTIONARY_SOURCES.onet.version} Database`);
    expect(credit).toContain(
      "by the U.S. Department of Labor, Employment and Training Administration (USDOL/ETA)."
    );
    expect(credit).toContain("CC BY 4.0");
    expect(credit).toContain("O*NET® is a trademark of USDOL/ETA.");
    expect(credit).toContain("has modified all or some of this information.");
    expect(credit).toContain("USDOL/ETA has not approved, endorsed, or tested these modifications.");
  });
});
