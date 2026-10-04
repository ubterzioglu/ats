import { IDBFactory } from "fake-indexeddb";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  createApplication,
  deleteApplication,
  getApplication,
  listApplications,
  updateApplication
} from "@/lib/applications/store";

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

describe("applications store", () => {
  it("creates and retrieves an application", async () => {
    const created = await createApplication({
      id: "app-1",
      companyName: "Acme Corp",
      roleTitle: "Engineer",
      stage: "saved"
    });
    
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    
    expect(created.value.id).toBe("app-1");
    expect(created.value.companyName).toBe("Acme Corp");
    expect(created.value.createdAt).toBeGreaterThan(0);
    
    const read = await getApplication("app-1");
    expect(read.ok).toBe(true);
    if (!read.ok) return;
    expect(read.value).toEqual(created.value);
  });

  it("updates an application", async () => {
    await createApplication({
      id: "app-2",
      companyName: "Beta Corp",
      roleTitle: "Designer",
      stage: "saved"
    });
    
    const updated = await updateApplication("app-2", { stage: "interview", notes: "First round on Friday" });
    expect(updated.ok).toBe(true);
    if (!updated.ok) return;
    
    expect(updated.value?.stage).toBe("interview");
    expect(updated.value?.notes).toBe("First round on Friday");
    expect(updated.value?.companyName).toBe("Beta Corp");
    
    const read = await getApplication("app-2");
    expect(read.ok && read.value?.stage).toBe("interview");
  });

  it("lists applications ordered by updatedAt descending", async () => {
    await createApplication({ id: "1", companyName: "A", roleTitle: "A", stage: "saved" });
    
    // Slight delay to ensure updatedAt is different
    await new Promise((resolve) => setTimeout(resolve, 5));
    
    await createApplication({ id: "2", companyName: "B", roleTitle: "B", stage: "applied" });
    
    const list = await listApplications();
    expect(list.ok).toBe(true);
    if (!list.ok) return;
    
    expect(list.value).toHaveLength(2);
    expect(list.value[0]?.id).toBe("2");
    expect(list.value[1]?.id).toBe("1");
    
    // Update 1, which should push it to the top
    await updateApplication("1", { stage: "interview" });
    
    const listAfterUpdate = await listApplications();
    expect(listAfterUpdate.ok && listAfterUpdate.value[0]?.id).toBe("1");
  });

  it("deletes an application", async () => {
    await createApplication({ id: "3", companyName: "C", roleTitle: "C", stage: "saved" });
    await deleteApplication("3");
    
    const read = await getApplication("3");
    expect(read.ok && read.value).toBeNull();
  });
});
