import type { ApplicationRecord } from "./schema";

export type ReminderType = "no-response" | "follow-up-interview";

export interface Reminder {
  readonly id: string;
  readonly type: ReminderType;
  readonly application: ApplicationRecord;
  readonly message: string;
  readonly daysSinceUpdate: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function generateReminders(
  applications: readonly ApplicationRecord[],
  nowMs: number = Date.now()
): Reminder[] {
  const reminders: Reminder[] = [];

  for (const app of applications) {
    // Only generate reminders for active stages
    if (app.stage === "rejected" || app.stage === "offer" || app.stage === "saved") {
      continue;
    }

    const daysSinceUpdate = Math.floor((nowMs - app.updatedAt) / DAY_MS);

    if (app.stage === "applied" && daysSinceUpdate >= 7) {
      reminders.push({
        id: `rem-applied-${app.id}`,
        type: "no-response",
        application: app,
        message: `It has been ${daysSinceUpdate} days since you applied. Consider following up.`,
        daysSinceUpdate
      });
    }

    if (app.stage === "interview" && daysSinceUpdate >= 3) {
      reminders.push({
        id: `rem-interview-${app.id}`,
        type: "follow-up-interview",
        application: app,
        message: `It has been ${daysSinceUpdate} days since your last interview update. A polite follow-up might help.`,
        daysSinceUpdate
      });
    }
  }

  // Sort by most urgent (oldest update first)
  return reminders.sort((a, b) => b.daysSinceUpdate - a.daysSinceUpdate);
}
