import { describe, expect, it } from "vitest";
import { generateReminders } from "../apps/web/lib/store/reminders";
import type { ApplicationRecord } from "../apps/web/lib/store/schema";

const DAY_MS = 24 * 60 * 60 * 1000;

describe("G.3 Local Reminders", () => {
  it("generates no reminders for recent applications", () => {
    const now = Date.now();
    const apps: ApplicationRecord[] = [
      {
        id: "app-1",
        companyName: "Recent Corp",
        roleTitle: "Engineer",
        stage: "applied",
        updatedAt: now - 2 * DAY_MS, // 2 days ago
        createdAt: now - 2 * DAY_MS
      }
    ];

    const reminders = generateReminders(apps, now);
    expect(reminders).toHaveLength(0);
  });

  it("generates reminders for applications older than 7 days", () => {
    const now = Date.now();
    const apps: ApplicationRecord[] = [
      {
        id: "app-2",
        companyName: "Ghosting Corp",
        roleTitle: "Engineer",
        stage: "applied",
        updatedAt: now - 8 * DAY_MS, // 8 days ago
        createdAt: now - 8 * DAY_MS
      }
    ];

    const reminders = generateReminders(apps, now);
    expect(reminders).toHaveLength(1);
    expect(reminders[0]?.type).toBe("no-response");
    expect(reminders[0]?.daysSinceUpdate).toBe(8);
  });

  it("generates reminders for interviews older than 3 days", () => {
    const now = Date.now();
    const apps: ApplicationRecord[] = [
      {
        id: "app-3",
        companyName: "Interview Corp",
        roleTitle: "Engineer",
        stage: "interview",
        updatedAt: now - 4 * DAY_MS, // 4 days ago
        createdAt: now - 10 * DAY_MS
      }
    ];

    const reminders = generateReminders(apps, now);
    expect(reminders).toHaveLength(1);
    expect(reminders[0]?.type).toBe("follow-up-interview");
    expect(reminders[0]?.daysSinceUpdate).toBe(4);
  });

  it("ignores resolved stages", () => {
    const now = Date.now();
    const apps: ApplicationRecord[] = [
      { id: "app-4", companyName: "A", roleTitle: "R", stage: "rejected", updatedAt: now - 20 * DAY_MS, createdAt: now },
      { id: "app-5", companyName: "B", roleTitle: "R", stage: "offer", updatedAt: now - 20 * DAY_MS, createdAt: now },
      { id: "app-6", companyName: "C", roleTitle: "R", stage: "saved", updatedAt: now - 20 * DAY_MS, createdAt: now }
    ];

    const reminders = generateReminders(apps, now);
    expect(reminders).toHaveLength(0);
  });

  it("sorts reminders by urgency (oldest update first)", () => {
    const now = Date.now();
    const apps: ApplicationRecord[] = [
      { id: "app-7", companyName: "A", roleTitle: "R", stage: "applied", updatedAt: now - 8 * DAY_MS, createdAt: now },
      { id: "app-8", companyName: "B", roleTitle: "R", stage: "interview", updatedAt: now - 15 * DAY_MS, createdAt: now }
    ];

    const reminders = generateReminders(apps, now);
    expect(reminders).toHaveLength(2);
    expect(reminders[0]?.daysSinceUpdate).toBe(15);
    expect(reminders[1]?.daysSinceUpdate).toBe(8);
  });
});
