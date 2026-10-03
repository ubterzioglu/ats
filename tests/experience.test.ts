import { describe, expect, it } from "vitest";

import {
  buildExperience,
  collectDateFormats,
  extractPeriods,
  formatDuration,
  mergePeriods
} from "@/lib/scoring/experience";

/** Fixed so "present" does not drift with the wall clock. */
const NOW = new Date(2026, 8, 28);

describe("extractPeriods", () => {
  it("reads numeric, named and bare-year ranges", () => {
    const { periods } = extractPeriods(
      ["01/2020 - 12/2022 Senior Engineer", "March 2018 - June 2019 Engineer", "2014 - 2016 Junior"],
      NOW
    );
    expect(periods).toHaveLength(3);
  });

  it("reads German and Turkish month names", () => {
    const { periods } = extractPeriods(["März 2019 - Juni 2020", "Ocak 2021 - Aralık 2022"], NOW);
    expect(periods).toHaveLength(2);
  });

  it("treats an open end as running to today", () => {
    const { periods } = extractPeriods(["01/2024 - present"], NOW);
    expect(periods[0]?.open).toBe(true);
  });

  it("accepts heute and devam as open ends", () => {
    const { periods } = extractPeriods(["01/2024 - heute", "01/2024 - devam"], NOW);
    expect(periods.every((period) => period.open)).toBe(true);
  });

  it("separates a range whose end precedes its start", () => {
    const { periods, reversed } = extractPeriods(["12/2022 - 01/2020 Engineer"], NOW);
    expect(periods).toHaveLength(0);
    expect(reversed).toHaveLength(1);
  });

  it("ignores a line with no range at all", () => {
    const { periods, reversed } = extractPeriods(["Built the deployment pipeline", "Berlin, Germany"], NOW);
    expect(periods).toHaveLength(0);
    expect(reversed).toHaveLength(0);
  });

  // Column-aligned entries are one of the commonest CV layouts: the role, the
  // employer and the dates sit in three columns that extract to one line
  // separated by runs of spaces. A word ending immediately before the year used
  // to swallow it as a month name and the whole line was then skipped.
  describe("column-aligned entries", () => {
    it("reads a bare-year range preceded by the employer", () => {
      const { periods } = extractPeriods(["Senior QA Engineer    Acme    2021 - 2023"], NOW);
      expect(periods).toHaveLength(1);
      expect(periods[0]?.start).toBe(2021 * 12);
      expect(periods[0]?.end).toBe(2023 * 12);
    });

    it("reads a bare-year range preceded by the role alone", () => {
      const { periods } = extractPeriods(["Senior QA Engineer 2021 - 2023"], NOW);
      expect(periods).toHaveLength(1);
      expect(periods[0]?.start).toBe(2021 * 12);
    });

    it("reads an open range preceded by the employer", () => {
      const { periods } = extractPeriods(["Senior QA Engineer    Acme GmbH    2021 - present"], NOW);
      expect(periods).toHaveLength(1);
      expect(periods[0]?.open).toBe(true);
    });

    it("still reads a real month name that follows a word", () => {
      const { periods } = extractPeriods(["Engineer    Acme    March 2018 - June 2019"], NOW);
      expect(periods).toHaveLength(1);
      expect(periods[0]?.start).toBe(2018 * 12 + 2);
      expect(periods[0]?.end).toBe(2019 * 12 + 5);
    });

    it("reads a year-first ISO range", () => {
      const { periods } = extractPeriods(["Engineer    Acme    2021-03 - 2024-05"], NOW);
      expect(periods).toHaveLength(1);
      expect(periods[0]?.start).toBe(2021 * 12 + 2);
      expect(periods[0]?.end).toBe(2024 * 12 + 4);
    });

    it("reads a year-first ISO range that is still open", () => {
      const { periods } = extractPeriods(["Engineer    Acme    2021-01 - present"], NOW);
      expect(periods).toHaveLength(1);
      expect(periods[0]?.start).toBe(2021 * 12);
      expect(periods[0]?.open).toBe(true);
    });

    it("accepts the dot and slash spellings of a year-first date", () => {
      const { periods } = extractPeriods(["2021.03 - 2024.05", "2021/03 - 2024/05"], NOW);
      expect(periods).toHaveLength(2);
      expect(periods.every((period) => period.start === 2021 * 12 + 2)).toBe(true);
    });

    it("does not read a bare-year range as a year and a month", () => {
      const { periods } = extractPeriods(["Engineer    Acme    2021 - 12"], NOW);
      expect(periods).toHaveLength(0);
    });

    it("still reports a reversed column-aligned range as reversed", () => {
      const { periods, reversed } = extractPeriods(["Engineer    Acme    2023 - 2021"], NOW);
      expect(periods).toHaveLength(0);
      expect(reversed).toHaveLength(1);
    });
  });
});

describe("collectDateFormats", () => {
  it("sees the year-only shape in a column-aligned entry", () => {
    const { formats } = collectDateFormats(["Senior QA Engineer    Acme    2021 - 2023"]);
    expect(formats.has("year-only")).toBe(true);
  });
});

describe("mergePeriods", () => {
  it("adds separate periods", () => {
    const { months, overlapping } = mergePeriods([
      { start: 2020 * 12, end: 2022 * 12, open: false, source: "a" },
      { start: 2023 * 12, end: 2024 * 12, open: false, source: "b" }
    ]);
    expect(months).toBe(36);
    expect(overlapping).toBe(false);
  });

  it("counts concurrent roles once rather than twice", () => {
    const { months, overlapping } = mergePeriods([
      { start: 2020 * 12, end: 2024 * 12, open: false, source: "employed" },
      { start: 2021 * 12, end: 2023 * 12, open: false, source: "freelance alongside it" }
    ]);
    expect(months).toBe(48);
    expect(overlapping).toBe(true);
  });

  it("joins periods that only partly overlap", () => {
    const { months } = mergePeriods([
      { start: 2020 * 12, end: 2022 * 12, open: false, source: "a" },
      { start: 2021 * 12, end: 2023 * 12, open: false, source: "b" }
    ]);
    expect(months).toBe(36);
  });

  it("returns zero for no periods", () => {
    expect(mergePeriods([]).months).toBe(0);
  });
});

describe("buildExperience", () => {
  it("totals a straightforward history", () => {
    const report = buildExperience(["01/2020 - 01/2023 Engineer", "01/2016 - 01/2019 Junior Engineer"], NOW);
    expect(report.months).toBe(72);
    expect(report.overlapping).toBe(false);
  });

  it("does not inflate a total when roles run in parallel", () => {
    const naive = buildExperience(["01/2019 - 01/2024 Staff Engineer", "01/2020 - 01/2022 Advisor"], NOW);
    expect(naive.months).toBe(60);
    expect(naive.overlapping).toBe(true);
  });
});

describe("formatDuration", () => {
  it("writes years and months in each supported language", () => {
    expect(formatDuration(51, "en")).toBe("4 years 3 months");
    expect(formatDuration(51, "de")).toBe("4 Jahre 3 Monate");
    expect(formatDuration(51, "tr")).toBe("4 yıl 3 ay");
  });

  it("drops the empty half of the pair", () => {
    expect(formatDuration(24, "en")).toBe("2 years");
    expect(formatDuration(7, "en")).toBe("7 months");
  });

  it("uses the singular where the language has one", () => {
    expect(formatDuration(13, "en")).toBe("1 year 1 month");
    expect(formatDuration(13, "de")).toBe("1 Jahr 1 Monat");
  });
});
