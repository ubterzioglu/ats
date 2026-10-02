import { describe, expect, it } from "vitest";

import {
  appendItem,
  clearField,
  formatStringList,
  moveItem,
  parseStringList,
  readList,
  removeItem,
  setField,
  setLiteral
} from "@/lib/editor/draft";
import { safeParseResume } from "@/lib/resume/schema";
import type { Resume } from "@/types/resume";

describe("editing a field", () => {
  it("returns a new document and leaves the old one alone", () => {
    const before: Resume = { basics: { name: "Ayse" } };
    const after = setField(before, ["basics", "name"], "Ayse Yilmaz");

    expect(after.basics?.name).toBe("Ayse Yilmaz");
    expect(before.basics?.name).toBe("Ayse");
    expect(after).not.toBe(before);
    expect(after.basics).not.toBe(before.basics);
  });

  it("creates the path it is given", () => {
    const after = setField({}, ["basics", "location", "city"], "Istanbul");
    expect(after.basics?.location?.city).toBe("Istanbul");
  });

  it("removes a cleared field rather than storing an empty string", () => {
    // Empty stays empty: a builder that leaves "name": "" behind has written a
    // field the candidate never wrote.
    const after = setField({ basics: { name: "Ayse", label: "QA" } }, ["basics", "name"], "");

    expect(after.basics).toEqual({ label: "QA" });
    expect("name" in (after.basics ?? {})).toBe(false);
  });

  it("removes a section that becomes empty on the way back up", () => {
    const after = clearField({ basics: { name: "Ayse" } }, ["basics", "name"]);
    expect(after).toEqual({});
  });

  it("keeps an empty date, which means a role that is still open", () => {
    // JSON Resume's own sample writes "endDate": "" for a current role, so the
    // empty string here is data rather than a gap.
    const after = setLiteral({ work: [{ name: "Acme" }] }, ["work", 0, "endDate"], "");
    expect(after.work?.[0]?.endDate).toBe("");
  });
});

describe("editing a list of items", () => {
  it("appends a blank item and keeps it, so the row can be typed into", () => {
    const after = appendItem({}, ["work"], {});
    expect(after.work).toEqual([{}]);
  });

  it("removes one item without touching the others", () => {
    const before: Resume = { work: [{ name: "A" }, { name: "B" }, { name: "C" }] };
    const after = removeItem(before, ["work"], 1);

    expect(after.work?.map((item) => item.name)).toEqual(["A", "C"]);
    expect(before.work).toHaveLength(3);
  });

  it("removes the section when its last item goes", () => {
    const after = removeItem({ work: [{ name: "A" }] }, ["work"], 0);
    expect(after).toEqual({});
  });

  it("ignores a remove for an index that is not there", () => {
    const before: Resume = { work: [{ name: "A" }] };
    expect(removeItem(before, ["work"], 7)).toBe(before);
  });

  it("moves an item", () => {
    const before: Resume = { work: [{ name: "A" }, { name: "B" }, { name: "C" }] };

    expect(moveItem(before, ["work"], 2, 0).work?.map((item) => item.name)).toEqual([
      "C",
      "A",
      "B"
    ]);
    expect(moveItem(before, ["work"], 0, 1).work?.map((item) => item.name)).toEqual([
      "B",
      "A",
      "C"
    ]);
  });

  it("is a no-op when an item is moved onto itself", () => {
    const before: Resume = { work: [{ name: "A" }, { name: "B" }] };
    expect(moveItem(before, ["work"], 1, 1)).toBe(before);
  });

  it("reads a missing list as empty rather than throwing", () => {
    expect(readList({}, ["work"])).toEqual([]);
    expect(readList({ basics: { name: "A" } }, ["basics", "profiles"])).toEqual([]);
  });
});

describe("string lists", () => {
  it("round-trips through the textarea shape", () => {
    const lines = ["Cut release testing to four hours", "Migrated 240 manual cases"];
    expect(parseStringList(formatStringList(lines))).toEqual(lines);
  });

  it("drops blank lines rather than storing them", () => {
    expect(parseStringList("one\n\n  \ntwo\n")).toEqual(["one", "two"]);
  });

  it("reads a non-list as empty text", () => {
    expect(formatStringList(undefined)).toBe("");
    expect(formatStringList("not a list")).toBe("");
  });
});

describe("what the editor produces", () => {
  it("is always a document the schema accepts", () => {
    let resume: Resume = {};
    resume = setField(resume, ["basics", "name"], "Ayşe Yılmaz");
    resume = setField(resume, ["basics", "location", "city"], "İstanbul");
    resume = appendItem(resume, ["work"], {});
    resume = setField(resume, ["work", 0, "position"], "Senior QA Engineer");
    resume = setLiteral(resume, ["work", 0, "startDate"], "2021-03");
    resume = setLiteral(resume, ["work", 0, "endDate"], "");
    resume = setField(resume, ["work", 0, "highlights"], ["Cut release testing to four hours"]);

    const parsed = safeParseResume(resume);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.resume).toEqual(resume);
  });

  it("never invents a key the candidate did not fill", () => {
    const resume = appendItem({}, ["work"], {});
    expect(JSON.stringify(resume)).toBe('{"work":[{}]}');
  });
});
