import { describe, expect, it } from "vitest";

import { ACTION_VERB_LIBRARY } from "@/lib/scoring/data/action-verbs";
import { scoreImpact } from "@/lib/scoring/impact";
import { buildContext } from "@/lib/scoring/context";

describe("ACTION_VERB_LIBRARY", () => {
  it("contains categorized verbs for EN, DE and TR", () => {
    const en = ACTION_VERB_LIBRARY.filter((v) => v.language === "en");
    const de = ACTION_VERB_LIBRARY.filter((v) => v.language === "de");
    const tr = ACTION_VERB_LIBRARY.filter((v) => v.language === "tr");

    expect(en.length).toBeGreaterThanOrEqual(30);
    expect(de.length).toBeGreaterThanOrEqual(20);
    expect(tr.length).toBeGreaterThanOrEqual(25);
  });

  it("covers leadership, implementation, optimization, analysis, and communication categories", () => {
    const categories = new Set(ACTION_VERB_LIBRARY.map((v) => v.category));
    expect(categories.has("leadership")).toBe(true);
    expect(categories.has("implementation")).toBe(true);
    expect(categories.has("optimization")).toBe(true);
    expect(categories.has("analysis")).toBe(true);
    expect(categories.has("communication")).toBe(true);
  });
});

describe("impact scoring with expanded action verbs and generic phrasing", () => {
  it("accepts Turkish 3rd person singular action verbs without flagging weak-verbs", () => {
    const cv = `Baris Terzioglu
Software Engineer
Deneyim
- Mikroservis mimarisini tasarladı ve hayata geçirdi.
- CI/CD boru hattını otomatikleştirdi ve dağıtım süresini kısalttı.
- Test kapsamını artırdı ve regression riskini azalttı.
- 5 kişilik geliştirici ekibini başarıyla yönetti.`;

    const context = buildContext(cv);
    const outcome = scoreImpact(context);
    expect(outcome.findings.map((f) => f.id)).not.toContain("impact.weak-verbs");
  });

  it("flags new generic phrasing patterns in Turkish and English", () => {
    const cvTr = `Aday
Deneyim
- Projede veritabanı optimizasyonu ile ilgilendim.
- Ekip toplantılarına katılım sağladım ve dokümantasyona katkıda bulundum.
- Yeni versiyon testlerinde görev aldı ve raporlama yaptı.
- Müşteri entegrasyonlarına yardımcı oldum.`;

    const contextTr = buildContext(cvTr);
    const outcomeTr = scoreImpact(contextTr);
    expect(outcomeTr.findings.some((f) => f.id === "impact.generic-phrasing")).toBe(true);

    const cvEn = `Candidate
Experience
- Was tasked with maintaining the internal testing tools.
- Played a part in the architecture migration across services.
- Contributed to the monthly reporting for engineering leadership.
- Assisted with client onboarding and system setup.`;

    const contextEn = buildContext(cvEn);
    const outcomeEn = scoreImpact(contextEn);
    expect(outcomeEn.findings.some((f) => f.id === "impact.generic-phrasing")).toBe(true);
  });
});
