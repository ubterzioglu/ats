import { describe, expect, it } from "vitest";

import { analyzeCv } from "@/lib/scoring";
import { buildContext } from "@/lib/scoring/context";
import { scoreImpact } from "@/lib/scoring/impact";

function idsOf(cv: string): string[] {
  return scoreImpact(buildContext(cv)).findings.map((finding) => finding.id);
}

describe("A6: impact on real-world documents", () => {
  describe("date ranges are not numbers", () => {
    it("does not count a date range as a quantified bullet", () => {
      const cv = `Jane Doe

Experience

Engineer, Firma GmbH
- Worked on project from 2019-2022
- Maintained legacy systems 2020-2023
- Supported team during 2021-2022
- Handled operations Jan 2020-Dec 2023
`;
      expect(idsOf(cv)).toContain("impact.no-numbers");
    });

    it("counts a real number even near a date range", () => {
      const cv = `Jane Doe

Experience

Engineer, Firma GmbH
- Cut runtime from 40 to 12 minutes (2019-2022)
- Automated 120 tests in 2021
- Built API used by 3 teams
- Led migration of 5 services
`;
      expect(idsOf(cv)).not.toContain("impact.no-numbers");
    });
  });

  describe("German noun openings", () => {
    it("does not flag Entwicklung as a weak verb opening", () => {
      const cv = `Jane Doe

Experience

Senior Engineer, Berlin GmbH
- Entwicklung einer REST-API für 3 Teams
- Einführung von CI/CD-Pipelines
- Konzeption der Teststrategie
- Leitung des Migrationsprojekts
`;
      const result = analyzeCv({ cvText: cv });
      expect(result.language).toBe("de");
      expect(result.findings.map((f) => f.id)).not.toContain("impact.weak-verbs");
    });

    it("recognises Aufbau, Gestaltung, Realisierung, Umsetzung", () => {
      const cv = `Jane Doe

Experience

Engineer, München AG
- Aufbau des Test-Frameworks
- Gestaltung der Architektur
- Realisierung der Automatisierung
- Umsetzung der Migration
`;
      expect(idsOf(cv)).not.toContain("impact.weak-verbs");
    });

    it("still flags a German bullet that opens with a filler word", () => {
      const cv = `Jane Doe

Experience

Engineer, Berlin GmbH
- Zuständig für Tests
- Mitarbeit an APIs
- Teilnahme an Meetings
- Unterstützung im Team
`;
      expect(idsOf(cv)).toContain("impact.weak-verbs");
    });
  });

  describe("mitgewirkt and unterstützung bei", () => {
    it("triggers generic-phrasing, not hedging", () => {
      const cv = `Jane Doe

Experience

Engineer, Firma GmbH
- Mitgewirkt an der API-Entwicklung
- Unterstützung bei der Migration
- Mitgewirkt im Test-Team
- Unterstützung bei der Automatisierung
`;
      const ids = idsOf(cv);
      expect(ids).toContain("impact.generic-phrasing");
      expect(ids).not.toContain("impact.hedging");
    });
  });

  describe("experience section verb check when bullets < 4", () => {
    it("flags experience lines that lack action verbs", () => {
      const cv = `Jane Doe

Experience

Engineer, Firma GmbH
Zuständig für verschiedene Aufgaben im Team.
Mitarbeit an Projekten und Meetings.
Unterstützung der Kollegen bei täglichen Aufgaben.
`;
      expect(idsOf(cv)).toContain("impact.weak-verbs");
    });

    it("does not flag experience lines that open with verbs", () => {
      const cv = `Jane Doe

Experience

Engineer, Firma GmbH
Built the API layer used by three teams.
Migrated legacy services to Kubernetes.
Automated the deployment pipeline.
`;
      expect(idsOf(cv)).not.toContain("impact.weak-verbs");
    });
  });
});
