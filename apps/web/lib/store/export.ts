import type { ApplicationRecord, ApplicationStage } from "./schema";

export function exportApplicationsToJSON(apps: readonly ApplicationRecord[]): string {
  return JSON.stringify(apps, null, 2);
}

export function importApplicationsFromJSON(json: string): ApplicationRecord[] {
  const parsed = JSON.parse(json);
  if (!Array.isArray(parsed)) throw new Error("Expected an array of applications");
  
  return parsed.map(app => {
    if (typeof app.id !== "string" || typeof app.companyName !== "string" || typeof app.roleTitle !== "string") {
      throw new Error("Invalid application record format");
    }
    return app as ApplicationRecord;
  });
}

const CSV_HEADERS = [
  "id", "companyName", "roleTitle", "stage", "url", "jobId", 
  "variantId", "scoreAtApplication", "notes", "contacts", "updatedAt", "createdAt"
] as const;

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = typeof value === "object" ? JSON.stringify(value) : String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportApplicationsToCSV(apps: readonly ApplicationRecord[]): string {
  const lines = [CSV_HEADERS.join(",")];
  for (const app of apps) {
    const row = CSV_HEADERS.map(key => {
      const val = app[key as keyof ApplicationRecord];
      return escapeCsv(val);
    });
    lines.push(row.join(","));
  }
  return lines.join("\n");
}

export function importApplicationsFromCSV(csv: string): ApplicationRecord[] {
  if (!csv.trim()) return [];
  const lines = parseCsvLines(csv);
  if (lines.length < 2) return [];

  const headers = lines[0] ?? [];
  const headerMap = new Map(headers.map((h, i) => [h.trim(), i]));

  const records: ApplicationRecord[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i];
    if (!cols || cols.length === 0 || (cols.length === 1 && !cols[0])) continue;

    const getValue = (key: typeof CSV_HEADERS[number]) => {
      const idx = headerMap.get(key);
      if (idx === undefined || idx >= cols.length) return undefined;
      const val = cols[idx]?.trim();
      return val === "" ? undefined : val;
    };

    const id = getValue("id") ?? "";
    const companyName = getValue("companyName") ?? "";
    const roleTitle = getValue("roleTitle") ?? "";
    const stage = (getValue("stage") ?? "saved") as ApplicationStage;
    const url = getValue("url");
    const jobId = getValue("jobId");
    const variantId = getValue("variantId");
    
    const scoreRaw = getValue("scoreAtApplication");
    const scoreAtApplication = scoreRaw ? Number(scoreRaw) : undefined;
    
    const notes = getValue("notes");
    
    const contactsRaw = getValue("contacts");
    let contacts: string[] | undefined = undefined;
    if (contactsRaw) {
      try {
        contacts = JSON.parse(contactsRaw);
      } catch {
        contacts = [contactsRaw];
      }
    }

    const updatedAt = Number(getValue("updatedAt") ?? Date.now());
    const createdAt = Number(getValue("createdAt") ?? Date.now());

    records.push({
      id,
      companyName,
      roleTitle,
      stage,
      url,
      jobId,
      variantId,
      scoreAtApplication,
      notes,
      contacts,
      updatedAt,
      createdAt
    });
  }

  return records;
}

function parseCsvLines(csv: string): string[][] {
  const result: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let inQuotes = false;

  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];
    const nextChar = csv[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentCell);
      currentCell = "";
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++; // skip \n
      currentRow.push(currentCell);
      result.push(currentRow);
      currentRow = [];
      currentCell = "";
    } else {
      currentCell += char;
    }
  }

  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell);
    result.push(currentRow);
  }

  return result;
}
