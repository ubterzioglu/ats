import { describe, expect, it } from "vitest";

import { FIELD_ORDER, readIdentity } from "@/lib/bench/identity";
import { analyzeCv } from "@/lib/scoring";
import type { Finding } from "@/types/analysis";

function missing(...ids: readonly string[]): readonly Finding[] {
  return ids.map((id) => ({
    id,
    dimension: "contact" as const,
    severity: "medium" as const,
    title: id,
    detail: "",
    fix: "",
    cost: 1
  }));
}

const COMPLETE = [
  "Ayse Yilmaz",
  "ayse@example.com  +90 555 000 00 00  Istanbul",
  "linkedin.com/in/ayseyilmaz",
  "",
  "EXPERIENCE",
  "Senior QA Engineer    2021 - present"
].join("\n");

describe("readIdentity", () => {
  it("reports every field the system names, in order", () => {
    const fields = readIdentity(COMPLETE, []);
    expect(fields.map((field) => field.id)).toEqual([...FIELD_ORDER]);
  });

  it("shows the value the parser would lift out", () => {
    const fields = readIdentity(COMPLETE, []);
    const byId = new Map(fields.map((field) => [field.id, field]));

    expect(byId.get("name")?.value).toBe("Ayse Yilmaz");
    expect(byId.get("email")?.value).toBe("ayse@example.com");
    expect(byId.get("phone")?.value).toContain("555");
    expect(byId.get("profile")?.value).toBe("linkedin.com/in/ayseyilmaz");
    expect(byId.get("location")?.value).toBe("Istanbul");
  });

  it("marks a field missing when the engine says it is", () => {
    const fields = readIdentity(COMPLETE, missing("contact.phone", "contact.profile"));
    const byId = new Map(fields.map((field) => [field.id, field]));

    expect(byId.get("phone")?.status).toBe("missing");
    expect(byId.get("profile")?.status).toBe("missing");
    expect(byId.get("email")?.status).toBe("found");
  });

  it("never shows a value for a field the engine calls missing", () => {
    // The table sitting beside the score must not contradict it.
    const fields = readIdentity(COMPLETE, missing(...FIELD_ORDER.map((id) => `contact.${id}`)));
    expect(fields.every((field) => field.value === undefined)).toBe(true);
    expect(fields.every((field) => field.status === "missing")).toBe(true);
  });

  it("calls a field suspect when the engine accepts it but nothing legible is there", () => {
    // No line reads as a name pair, but the engine raised no name finding.
    const fields = readIdentity("ayse@example.com\n+90 555 000 00 00", []);
    const name = fields.find((field) => field.id === "name");

    expect(name?.status).toBe("suspect");
    expect(name?.reason).toBe("not-located");
    expect(name?.value).toBeUndefined();
  });

  it("calls a field suspect when its value is buried in a long unbroken run", () => {
    const run = `Ayse Yilmaz is a senior quality engineer based in Istanbul and reachable at ayse@example.com for any enquiry`;
    const fields = readIdentity(`Ayse Yilmaz\n${run}`, []);
    const email = fields.find((field) => field.id === "email");

    expect(email?.status).toBe("suspect");
    expect(email?.reason).toBe("buried-in-a-run");
    expect(email?.value).toBe("ayse@example.com");
  });

  it("carries the line index, so the value can be marked in the parse view", () => {
    const fields = readIdentity(COMPLETE, []);
    const email = fields.find((field) => field.id === "email");

    expect(email?.line).toBe(1);
    expect(COMPLETE.split("\n")[email?.line ?? -1]).toContain("ayse@example.com");
  });
});

describe("against the real engine", () => {
  it("agrees with the score: nothing shown as found is charged as missing", () => {
    const result = analyzeCv({ cvText: COMPLETE });
    const fields = readIdentity(COMPLETE, result.findings);

    const chargedMissing = new Set(
      result.findings.filter((finding) => finding.dimension === "contact").map((finding) => finding.id)
    );

    for (const field of fields) {
      if (field.status !== "missing") {
        expect(chargedMissing.has(`contact.${field.id}`)).toBe(false);
      }
    }
  });

  it("marks what the engine charges on a CV with no contact block at all", () => {
    const bare = ["EXPERIENCE", "Senior QA Engineer    2021 - present", "- Led the suite"].join("\n");
    const result = analyzeCv({ cvText: bare });
    const fields = readIdentity(bare, result.findings);

    expect(fields.filter((field) => field.status === "missing").length).toBeGreaterThan(2);
  });
});
