import { describe, expect, it } from "vitest";

import { analyzeCv } from "@/lib/scoring";
import { extractJobKeywords } from "@/lib/scoring/keywords";
import { isStopword, stopwordsFor } from "@/lib/scoring/stopwords";
import { matchKeyTurkish } from "@/lib/scoring/turkish";

import { TR_CV } from "./fixtures";

/**
 * J.3: a stopword that only exists in one language must not be filtered from
 * the other, and a stopword that arrives inflected must still be filtered.
 * Both directions matter: the union-of-everything filter treated a German
 * "war" as an English verb, while "konularında" sailed through as a domain
 * term and inflated coverage against any CV containing "konu".
 */

describe("per-language stopword sets", () => {
  it("filters a language's own stopwords", () => {
    expect(isStopword("dabei", "de")).toBe(true);
    expect(isStopword("außerdem", "de")).toBe(true);
    expect(isStopword("boyunca", "tr")).toBe(true);
    expect(isStopword("açısından", "tr")).toBe(true);
  });

  it("does not filter another language's stopwords into an English ad", () => {
    expect(isStopword("dabei", "en")).toBe(false);
    expect(isStopword("boyunca", "en")).toBe(false);
    expect(isStopword("the", "en")).toBe(true);
  });

  it("keeps English connectives available to non-English documents", () => {
    expect(stopwordsFor("de").has("and")).toBe(true);
    expect(stopwordsFor("tr").has("with")).toBe(true);
  });
});

const TR_NOISE_AD = `Veri Mühendisi

Bu pozisyon için ekip içinde farklı konular üzerinde çalışacaksınız.
Görev tanımı buna göre şekillenecek ve bu konuda ekibe göre hareket edilecek.
Ekip içinde buna göre davranılacak ve konu başlıklarına göre plan yapılacak.

Aranan nitelikler
- Veri mühendisi olarak en az 3 yıl profesyonel deneyim
- Python ve SQL bilgisi
- Kafka ve Airflow ile veri hatları kurma deneyimi
- Docker ve Kubernetes hakkında bilgi
`;

const DE_NOISE_AD = `Data Engineer (m/w/d)

Wir suchen jemanden für unser Team, der dabei hilft, die Datenplattform zu betreiben.
Dabei sollten sowohl Kenntnisse in Python als auch Erfahrung mit Kafka vorhanden sein.
Außerdem arbeiten Sie dabei mit Docker und Kubernetes, wodurch sich Chancen ergeben.

Ihr Profil
- Mindestens 3 Jahre Erfahrung mit Python und SQL
- Kenntnisse in Kafka und Airflow sowie Docker und Kubernetes
- Erfahrung mit CI/CD, idealerweise GitLab CI
`;

describe("Turkish stopwords under inflection", () => {
  const terms = extractJobKeywords(TR_NOISE_AD).map((term) => term.term);

  it("keeps the skills", () => {
    for (const expected of ["python", "sql", "kafka", "airflow", "docker", "kubernetes"]) {
      expect(terms).toContain(expected);
    }
  });

  it("filters connectives even when they arrive inflected", () => {
    const keys = terms.map(matchKeyTurkish);
    for (const forbidden of ["konu", "gore", "bun", "icin", "sekil", "ekip"]) {
      expect(keys).not.toContain(forbidden);
    }
  });
});

describe("German stopwords", () => {
  const terms = extractJobKeywords(DE_NOISE_AD).map((term) => term.term);

  it("keeps the skills", () => {
    for (const expected of ["python", "sql", "kafka", "airflow", "docker", "kubernetes", "ci/cd"]) {
      expect(terms).toContain(expected);
    }
  });

  it("filters connectives and job-ad filler", () => {
    for (const forbidden of ["dabei", "sowie", "außerdem", "wodurch", "erfahrung", "kenntnisse", "jahre", "team", "chancen", "mindestens"]) {
      expect(terms).not.toContain(forbidden);
    }
  });
});

describe("coverage inflation", () => {
  it("does not match Turkish filler between the ad and the CV", () => {
    const result = analyzeCv({ cvText: TR_CV, jobDescription: TR_NOISE_AD });
    const matched = result.keywords.matched.map((term) => term.term);
    const keys = matched.map(matchKeyTurkish);
    expect(keys).not.toContain("konu");
    expect(keys).not.toContain("ekip");
    expect(keys).not.toContain("bilg");
    expect(matched.some((term) => matchKeyTurkish(term) === matchKeyTurkish("mühendis"))).toBe(true);
  });
});
