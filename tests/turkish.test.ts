import { describe, expect, it } from "vitest";

import { analyzeCv } from "@/lib/scoring";
import { buildContext } from "@/lib/scoring/context";
import { extractJobKeywords } from "@/lib/scoring/keywords";
import { detectSections } from "@/lib/scoring/sections";
import { caseFold, tokenize } from "@/lib/scoring/text";
import { foldTurkishDiacritics, matchKeyTurkish, stemTurkish, trLowercase } from "@/lib/scoring/turkish";

import { JOB_AD, STRONG_CV, TR_CV, TR_JOB_AD } from "./fixtures";

/**
 * J.1: Turkish stemming, locale-correct casing and the domain fold on top.
 * The acceptance is match parity: the same CV/ad pair scores comparably in
 * Turkish and English, because an inflected Turkish word is as normal as a
 * plural English one.
 */

describe("Turkish casing", () => {
  it("lowercases I to dotless ı and İ to dotted i", () => {
    expect(trLowercase("ISTANBUL")).toBe("ıstanbul");
    expect(trLowercase("İSTANBUL")).toBe("istanbul");
    expect(trLowercase("IŞIK")).toBe("ışık");
    expect(trLowercase("İş Deneyimi")).toBe("iş deneyimi");
  });

  it("case-folds İ to a single code point so tokens stay whole", () => {
    expect(caseFold("İŞ")).toBe("iş");
    expect(tokenize("İstanbul'da iş")).toEqual(["istanbul", "da", "iş"]);
    expect(tokenize("İş Deneyimi")).toEqual(["iş", "deneyimi"]);
  });
});

describe("Turkish stem keys", () => {
  const families: readonly (readonly string[])[] = [
    ["geliştirme", "geliştirmesi", "geliştirilmesi", "geliştirdim", "geliştirici", "geliştirmeler"],
    ["yönetim", "yönetimi", "yönetmek", "yönettim", "yönetici", "yöneticisi"],
    ["mühendis", "mühendisi", "mühendislik", "mühendisler"],
    ["test", "testi", "testleri", "testlerinde", "testler", "testlerimizin"],
    ["proje", "projeler", "projelerde", "projesi", "projesini"],
    ["deneyim", "deneyimi", "deneyiminde", "deneyimler", "deneyimlerinden"],
    ["yazılım", "yazılımı", "yazılımları", "yazılımcı", "yazılımlarında"],
    ["otomatik", "otomatikleştirme", "otomatikleştirdim"],
    ["çalışma", "çalışmaları", "çalıştım", "çalışmalarında"],
    ["iyileştirme", "iyileştirdim", "iyileştirmeler"]
  ];

  it.each(families.map((family, index) => [index, family] as const))(
    "converges family %i onto one match key",
    (_index, family) => {
      const keys = family.map(matchKeyTurkish);
      expect(new Set(keys).size).toBe(1);
    }
  );

  it("leaves taxonomy skills untouched", () => {
    expect(stemTurkish("java")).toBe("java");
    expect(stemTurkish("spark")).toBe("spark");
    expect(stemTurkish("kubernetes")).toBe("kubernetes");
    expect(stemTurkish("c++")).toBe("c++");
    expect(stemTurkish("next.js")).toBe("next.js");
  });

  it("leaves short words alone rather than over-stripping", () => {
    expect(stemTurkish("iş")).toBe("iş");
    expect(stemTurkish("yıl")).toBe("yıl");
    expect(stemTurkish("test")).toBe("test");
  });

  it("un-softens consonants the suffixes hid", () => {
    expect(matchKeyTurkish("yaptığı")).toBe(matchKeyTurkish("yaptım"));
    expect(matchKeyTurkish("kurduğu")).toBe(matchKeyTurkish("kurdum"));
  });
});

describe("matchKeyTurkish", () => {
  it("folds transliterated spellings onto the diacritic stem", () => {
    expect(matchKeyTurkish("gelistirme")).toBe(matchKeyTurkish("geliştirme"));
    expect(matchKeyTurkish("otomasyonu")).toBe(matchKeyTurkish("otomasyon"));
    expect(foldTurkishDiacritics("ışık çöp ğü şşı")).toBe("isik cop gu ssi");
  });
});

describe("Turkish section headings", () => {
  it("detects İş Deneyimi through the dotted capital", () => {
    const sections = detectSections(buildContext(TR_CV).lines);
    const ids = sections.map((section) => section.id);
    expect(ids).toEqual(expect.arrayContaining(["summary", "experience", "education", "skills"]));
  });
});

describe("Turkish keyword matching", () => {
  const terms = extractJobKeywords(TR_JOB_AD).map((term) => term.term);

  it("mines the Turkish ad for inflected domain words", () => {
    expect(terms.some((term) => matchKeyTurkish(term) === matchKeyTurkish("deneyim"))).toBe(true);
    expect(terms.some((term) => matchKeyTurkish(term) === matchKeyTurkish("otomasyon"))).toBe(true);
    expect(terms.some((term) => matchKeyTurkish(term) === matchKeyTurkish("regresyon"))).toBe(true);
  });

  it("keeps the known tools", () => {
    for (const expected of ["playwright", "typescript", "docker", "kubernetes"]) {
      expect(terms).toContain(expected);
    }
  });

  it("matches an inflected CV against the ad", () => {
    const result = analyzeCv({ cvText: TR_CV, jobDescription: TR_JOB_AD });
    expect(result.language).toBe("tr");
    expect(result.keywords.source).toBe("job-description");
    expect(result.keywords.coverage).toBeGreaterThanOrEqual(0.5);

    const coverageEn = analyzeCv({ cvText: STRONG_CV, jobDescription: JOB_AD }).keywords.coverage;
    expect(result.keywords.coverage).toBeGreaterThanOrEqual(coverageEn - 0.15);
  });

  it("does not charge Turkish verb-final bullets as verbless", () => {
    const result = analyzeCv({ cvText: TR_CV, jobDescription: TR_JOB_AD });
    expect(result.findings.map((finding) => finding.id)).not.toContain("impact.weak-verbs");
  });
});
