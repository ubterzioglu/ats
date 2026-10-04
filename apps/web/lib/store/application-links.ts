import type { ApplicationRecord, JobRecord, VariantRecord } from "./schema";
import { getJob } from "./jobs";
import { openStore } from "./db";
import { ok, type StoreResult } from "./failure";

export interface LinkedApplication {
  readonly application: ApplicationRecord;
  readonly job: JobRecord | null;
  readonly variant: VariantRecord | null;
  readonly errors: readonly string[];
}

export async function resolveApplicationLinks(
  application: ApplicationRecord
): Promise<StoreResult<LinkedApplication>> {
  let job: JobRecord | null = null;
  let variant: VariantRecord | null = null;
  const errors: string[] = [];

  if (application.jobId) {
    const jobResult = await getJob(application.jobId);
    if (!jobResult.ok) {
      errors.push(`Failed to read job ad: ${jobResult.failure.reason}`);
    } else if (jobResult.value === null) {
      errors.push(`The job ad this application refers to was deleted.`);
    } else {
      job = jobResult.value;
    }
  }

  if (application.variantId) {
    const opened = await openStore();
    if (!opened.ok) {
      errors.push(`Failed to open store: ${opened.failure.reason}`);
    } else {
      const variantResult = await opened.value.get("variants", application.variantId);
      opened.value.close();
      if (!variantResult.ok) {
        errors.push(`Failed to read CV variant: ${variantResult.failure.reason}`);
      } else if (variantResult.value === null) {
        errors.push(`The CV variant used for this application was deleted.`);
      } else {
        variant = variantResult.value;
      }
    }
  }

  return ok({
    application,
    job,
    variant,
    errors
  });
}
