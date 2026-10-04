import { describe, expect, it } from "vitest";
import { readdir, readFile } from "fs/promises";
import { join } from "path";

const COMPONENTS_DIR = join(process.cwd(), "components");
const APP_DIR = join(process.cwd(), "app");

async function findTsFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true, recursive: true });
  for (const entry of entries) {
    if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))) {
      files.push(join(entry.parentPath || dir, entry.name));
    }
  }
  return files;
}

async function readAllComponents(): Promise<string> {
  const componentFiles = await findTsFiles(COMPONENTS_DIR);
  const appFiles = await findTsFiles(APP_DIR);
  const allFiles = [...componentFiles, ...appFiles];
  
  const contents = await Promise.all(
    allFiles.map((file) => readFile(file, "utf-8").catch(() => ""))
  );
  return contents.join("\n");
}

describe("reachability guardian: every engine function has a consumer", () => {
  it("compareAds is imported or used in components/app", async () => {
    const code = await readAllComponents();
    expect(code).toMatch(/compareAds/);
  });

  it("compareVariants is imported or used in components/app", async () => {
    const code = await readAllComponents();
    expect(code).toMatch(/compareVariants/);
  });

  it("generateReminders is imported or used in components/app", async () => {
    const code = await readAllComponents();
    expect(code).toMatch(/generateReminders/);
  });

  it("exportApplicationsToJSON is imported or used in components/app", async () => {
    const code = await readAllComponents();
    expect(code).toMatch(/exportApplicationsToJSON/);
  });

  it("exportApplicationsToCSV is imported or used in components/app", async () => {
    const code = await readAllComponents();
    expect(code).toMatch(/exportApplicationsToCSV/);
  });

  it("importApplicationsFromJSON is imported or used in components/app", async () => {
    const code = await readAllComponents();
    expect(code).toMatch(/importApplicationsFromJSON/);
  });

  it("importApplicationsFromCSV is imported or used in components/app", async () => {
    const code = await readAllComponents();
    expect(code).toMatch(/importApplicationsFromCSV/);
  });

  it("jobAd.redFlags is accessed in components/app", async () => {
    const code = await readAllComponents();
    expect(code).toMatch(/redFlags/);
  });

  it("suitability is accessed in components/app", async () => {
    const code = await readAllComponents();
    expect(code).toMatch(/suitability/);
  });

  it("rewriteBullets is imported or used in components/app", async () => {
    const code = await readAllComponents();
    expect(code).toMatch(/rewriteBullets/);
  });

  it("the guardian itself does not match its own test strings", async () => {
    const code = await readAllComponents();
    const selfReference = code.includes("reachability guardian");
    expect(selfReference).toBe(false);
  });
});
