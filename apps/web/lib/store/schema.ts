import type { Band, DimensionId, DocumentLanguage } from "@/types/analysis";

export const DB_NAME = "ats-local";

/**
 * One store per kind of record. Adding a store means appending a migration
 * below and raising `DB_VERSION`; never edit a migration that has shipped,
 * because browsers that already ran it will not run it again.
 */
export interface StoreSchema {
  readonly meta: MetaRecord;
  readonly history: HistoryRecord;
}

export type StoreName = keyof StoreSchema;

/** Small named values: schema bookkeeping, user preferences, counters. */
export interface MetaRecord {
  readonly key: string;
  readonly value: string | number | boolean;
  readonly updatedAt: number;
}

/**
 * One past analysis. Scores and the time only: the CV text, the findings and
 * their evidence lines all stay out, because history outlives the session that
 * produced it and the document is not ours to keep.
 */
export interface HistoryRecord {
  readonly id: string;
  readonly recordedAt: number;
  readonly total: number;
  readonly band: Band;
  readonly language: DocumentLanguage;
  readonly dimensions: readonly HistoryDimension[];
}

export interface HistoryDimension {
  readonly id: DimensionId;
  readonly score: number;
  readonly max: number;
}

export interface Migration {
  readonly version: number;
  readonly apply: (db: IDBDatabase) => void;
}

export const MIGRATIONS: readonly Migration[] = [
  {
    version: 1,
    apply(db) {
      db.createObjectStore("meta", { keyPath: "key" });
    }
  },
  {
    version: 2,
    apply(db) {
      const history = db.createObjectStore("history", { keyPath: "id" });
      history.createIndex("recordedAt", "recordedAt");
    }
  }
];

export const DB_VERSION = MIGRATIONS.reduce(
  (highest, migration) => Math.max(highest, migration.version),
  1
);

export const STORE_NAMES: readonly StoreName[] = ["meta", "history"];
