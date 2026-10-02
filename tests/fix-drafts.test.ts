import { describe, expect, it } from "vitest";

import { applyFixDraft, draftFixes } from "@/lib/scoring/drafts";

import { STRONG_CV, WEAK_CV } from "./fixtures";

/**
 * A draft may rephrase a line; it may never add a fact. The [quantify: ...]
 * marker is the contract: everything the candidate still has to substantiate
 * stays visibly unclaimed.
 */

describe("draftFixes", () => {
  it("rewrites 'Responsible for X' as a claim with a quantify marker", () => {
    const drafts = draftFixes("- Responsible for testing of software.");
    expect(drafts).toHaveLength(1);
    const draft = drafts[0]!;
    expect(draft.replacement).toBe(
      "- Led testing of software, resulting in [quantify: what improved, by how much]."
    );
  });

  it("keeps the bullet prefix and offers the plain sentence", () => {
    const drafts = draftFixes("Responsible for the release process");
    expect(drafts[0]?.replacement).toBe(
      "Led the release process, resulting in [quantify: what improved, by how much]"
    );
  });

  it("rewrites the German and helper shapes", () => {
    const drafts = draftFixes("- Verantwortlich für die Testautomatisierung\n- Helped with documentation");
    expect(drafts.map((draft) => draft.rule)).toEqual(["responsible-for", "helped-with"]);
    expect(drafts[0]?.replacement).toContain("Led die Testautomatisierung");
    expect(drafts[1]?.replacement).toContain("Contributed to documentation");
  });

  it("finds drafts in the weak fixture and none in the strong one", () => {
    expect(draftFixes(WEAK_CV).length).toBeGreaterThan(0);
    expect(draftFixes(STRONG_CV)).toEqual([]);
  });

  it("never introduces a skill the line did not contain", () => {
    for (const draft of draftFixes(WEAK_CV)) {
      for (const skill of ["kubernetes", "playwright", "python", "docker", "sql"]) {
        if (!draft.original.toLowerCase().includes(skill)) {
          expect(draft.replacement.toLowerCase()).not.toContain(skill);
        }
      }
    }
  });
});

describe("applyFixDraft", () => {
  it("swaps exactly one line", () => {
    const text = "A\n- Responsible for testing of software.\nB";
    const drafts = draftFixes(text);
    const applied = applyFixDraft(text, drafts[0]!);
    expect(applied).not.toBeNull();
    const lines = applied!.split("\n");
    expect(lines[0]).toBe("A");
    expect(lines[2]).toBe("B");
    expect(lines[1]).toContain("Led testing of software");
  });

  it("refuses when the text moved since the draft was made", () => {
    const text = "A\n- Responsible for testing of software.";
    const drafts = draftFixes(text);
    expect(applyFixDraft(`${text}\nC`, drafts[0]!)).not.toBeNull();
    expect(applyFixDraft("completely different text", drafts[0]!)).toBeNull();
  });
});
