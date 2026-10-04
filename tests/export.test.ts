import { describe, expect, it } from "vitest";
import {
  exportApplicationsToJSON,
  importApplicationsFromJSON,
  exportApplicationsToCSV,
  importApplicationsFromCSV
} from "../apps/web/lib/store/export";
import type { ApplicationRecord } from "../apps/web/lib/store/schema";

describe("G.4 CSV and JSON Export", () => {
  const records: ApplicationRecord[] = [
    {
      id: "app-1",
      companyName: "Acme Corp",
      roleTitle: "Backend Engineer",
      stage: "applied",
      url: "https://acme.example.com",
      jobId: "job-1",
      variantId: "var-1",
      scoreAtApplication: 85,
      notes: "First round interview went well.\nWaiting for next steps.",
      contacts: ["Alice, HR", "Bob, Engineering Manager"],
      updatedAt: 1672531200000,
      createdAt: 1672531200000
    },
    {
      id: "app-2",
      companyName: "Global Tech",
      roleTitle: "Frontend Developer",
      stage: "saved",
      updatedAt: 1672541200000,
      createdAt: 1672541200000
    }
  ];

  it("round-trips JSON correctly", () => {
    const json = exportApplicationsToJSON(records);
    const imported = importApplicationsFromJSON(json);

    expect(imported).toEqual(records);
  });

  it("round-trips CSV correctly including newlines and commas", () => {
    const csv = exportApplicationsToCSV(records);
    const imported = importApplicationsFromCSV(csv);

    expect(imported).toHaveLength(2);
    
    // Check first record with complex fields (newlines, commas)
    const first = imported[0]!;
    expect(first.id).toBe("app-1");
    expect(first.companyName).toBe("Acme Corp");
    expect(first.stage).toBe("applied");
    expect(first.notes).toBe("First round interview went well.\nWaiting for next steps.");
    expect(first.scoreAtApplication).toBe(85);
    expect(first.contacts).toEqual(["Alice, HR", "Bob, Engineering Manager"]);
    
    // Check second record with missing optional fields
    const second = imported[1]!;
    expect(second.id).toBe("app-2");
    expect(second.companyName).toBe("Global Tech");
    expect(second.stage).toBe("saved");
    expect(second.notes).toBeUndefined();
    expect(second.scoreAtApplication).toBeUndefined();
    expect(second.contacts).toBeUndefined();
  });
});
