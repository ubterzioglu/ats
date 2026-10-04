import { IDBFactory } from "fake-indexeddb";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { openStore } from "@/lib/store/db";
import { createApplication } from "@/lib/applications/store";
import { createJob } from "@/lib/store/jobs";
import { resolveApplicationLinks } from "@/lib/store/application-links";

const realIndexedDB = globalThis.indexedDB;

beforeEach(() => {
  Object.defineProperty(globalThis, "indexedDB", {
    value: new IDBFactory(),
    configurable: true,
    writable: true
  });
});

afterEach(() => {
  Object.defineProperty(globalThis, "indexedDB", {
    value: realIndexedDB,
    configurable: true,
    writable: true
  });
});

describe("G.2 Card Links", () => {
  it("resolves the linked job and variant", async () => {
    // Seed job
    await createJob({
      id: "job-1",
      title: "Engineer",
      companyName: "Acme",
      rawText: "Job text",
      updatedAt: 1,
      createdAt: 1
    });

    // Seed variant directly
    const opened = await openStore();
    if (!opened.ok) throw new Error("Store failed");
    await opened.value.put("variants", {
      id: "var-1",
      jobId: "job-1",
      updatedAt: 1,
      overrides: {}
    });
    opened.value.close();

    // Seed app
    const appResult = await createApplication({
      id: "app-1",
      companyName: "Acme",
      roleTitle: "Engineer",
      stage: "applied",
      jobId: "job-1",
      variantId: "var-1",
      scoreAtApplication: 85
    });

    if (!appResult.ok) throw new Error("App creation failed");

    const resolved = await resolveApplicationLinks(appResult.value);
    if (!resolved.ok) throw new Error("Link resolution failed");

    expect(resolved.value.errors).toHaveLength(0);
    expect(resolved.value.job?.id).toBe("job-1");
    expect(resolved.value.variant?.id).toBe("var-1");
    expect(resolved.value.application.scoreAtApplication).toBe(85);
  });

  it("reports honestly if a linked record was deleted", async () => {
    // Seed app pointing to non-existent records
    const appResult = await createApplication({
      id: "app-2",
      companyName: "Acme",
      roleTitle: "Engineer",
      stage: "applied",
      jobId: "job-deleted",
      variantId: "var-deleted"
    });

    if (!appResult.ok) throw new Error("App creation failed");

    const resolved = await resolveApplicationLinks(appResult.value);
    if (!resolved.ok) throw new Error("Link resolution failed");

    expect(resolved.value.job).toBeNull();
    expect(resolved.value.variant).toBeNull();
    expect(resolved.value.errors).toHaveLength(2);
    expect(resolved.value.errors[0]).toMatch(/job ad/);
    expect(resolved.value.errors[1]).toMatch(/CV variant/);
  });
});
