import { classify, failed, ok, type StoreResult } from "./failure";
import { DB_NAME, DB_VERSION, MIGRATIONS, type StoreName, type StoreSchema } from "./schema";

/**
 * Browser-only. Nothing here may be imported from a server component: the
 * server holds accounts and share links, never the user's own work.
 */

export interface StoreHandle {
  get<K extends StoreName>(store: K, key: IDBValidKey): Promise<StoreResult<StoreSchema[K] | null>>;
  getAll<K extends StoreName>(store: K): Promise<StoreResult<readonly StoreSchema[K][]>>;
  put<K extends StoreName>(store: K, record: StoreSchema[K]): Promise<StoreResult<void>>;
  remove(store: StoreName, key: IDBValidKey): Promise<StoreResult<void>>;
  count(store: StoreName): Promise<StoreResult<number>>;
  clear(store: StoreName): Promise<StoreResult<void>>;
  close(): void;
}

function request<T>(source: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    source.onsuccess = () => resolve(source.result);
    source.onerror = () => reject(source.error);
  });
}

/** Resolves once the transaction has actually committed, not once it was queued. */
function committed(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open(DB_NAME, DB_VERSION);

    open.onupgradeneeded = (event) => {
      const from = event.oldVersion;
      for (const migration of MIGRATIONS) {
        if (migration.version > from) migration.apply(open.result);
      }
    };

    // Another tab still holds the old version open, so the upgrade cannot run.
    open.onblocked = () => reject(new DOMException("upgrade blocked", "VersionError"));
    open.onsuccess = () => resolve(open.result);
    open.onerror = () => reject(open.error);
  });
}

export async function openStore(): Promise<StoreResult<StoreHandle>> {
  if (typeof indexedDB === "undefined") return failed("unsupported");

  let db: IDBDatabase;
  try {
    db = await openDatabase();
  } catch (cause) {
    return failed(classify(cause));
  }

  async function run<T>(
    store: StoreName,
    mode: IDBTransactionMode,
    work: (objectStore: IDBObjectStore) => Promise<T>
  ): Promise<StoreResult<T>> {
    try {
      const transaction = db.transaction(store, mode);
      const value = await work(transaction.objectStore(store));
      await committed(transaction);
      return ok(value);
    } catch (cause) {
      return failed(classify(cause));
    }
  }

  return ok({
    async get(store, key) {
      const result = await run(store, "readonly", (objectStore) => request(objectStore.get(key)));
      if (!result.ok) return result;
      return ok(result.value ?? null);
    },

    getAll(store) {
      return run(store, "readonly", async (objectStore) => {
        const rows = await request(objectStore.getAll());
        return rows as readonly StoreSchema[typeof store][];
      });
    },

    async put(store, record) {
      const result = await run(store, "readwrite", async (objectStore) => {
        await request(objectStore.put(record));
      });
      return result;
    },

    remove(store, key) {
      return run(store, "readwrite", async (objectStore) => {
        await request(objectStore.delete(key));
      });
    },

    count(store) {
      return run(store, "readonly", (objectStore) => request(objectStore.count()));
    },

    clear(store) {
      return run(store, "readwrite", async (objectStore) => {
        await request(objectStore.clear());
      });
    },

    close() {
      db.close();
    }
  });
}
