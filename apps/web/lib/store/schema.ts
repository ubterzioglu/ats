export const DB_NAME = "ats-local";

/**
 * One store per kind of record. Adding a store means appending a migration
 * below and raising `DB_VERSION`; never edit a migration that has shipped,
 * because browsers that already ran it will not run it again.
 */
export interface StoreSchema {
  readonly meta: MetaRecord;
}

export type StoreName = keyof StoreSchema;

/** Small named values: schema bookkeeping, user preferences, counters. */
export interface MetaRecord {
  readonly key: string;
  readonly value: string | number | boolean;
  readonly updatedAt: number;
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
  }
];

export const DB_VERSION = MIGRATIONS.reduce(
  (highest, migration) => Math.max(highest, migration.version),
  1
);

export const STORE_NAMES: readonly StoreName[] = ["meta"];
