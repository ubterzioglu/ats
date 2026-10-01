import type { ResumeData, JobContext, ATSScore, OptimizationSuggestion } from '@/types/resume';

const DB_NAME = 'ats-optimizer';
const DB_VERSION = 1;

export interface SavedSession {
  id: string;
  createdAt: string;
  updatedAt: string;
  resume: ResumeData;
  jobContext?: JobContext;
  score?: ATSScore;
  suggestions?: OptimizationSuggestion[];
  label?: string;
}

let db: IDBDatabase | null = null;

async function getDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      if (!database.objectStoreNames.contains('sessions')) {
        const store = database.createObjectStore('sessions', { keyPath: 'id' });
        store.createIndex('updatedAt', 'updatedAt');
      }
      if (!database.objectStoreNames.contains('settings')) {
        database.createObjectStore('settings', { keyPath: 'key' });
      }
    };
  });
}

export async function saveSession(session: Omit<SavedSession, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const database = await getDB();
  const id = `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const fullSession: SavedSession = {
    ...session,
    id,
    createdAt: now,
    updatedAt: now,
  };

  return new Promise((resolve, reject) => {
    const tx = database.transaction('sessions', 'readwrite');
    const store = tx.objectStore('sessions');
    const request = store.put(fullSession);
    request.onsuccess = () => resolve(id);
    request.onerror = () => reject(request.error);
  });
}

export async function updateSession(id: string, updates: Partial<SavedSession>): Promise<void> {
  const database = await getDB();
  const existing = await getSession(id);
  if (!existing) throw new Error(`Session ${id} not found`);

  const updated: SavedSession = {
    ...existing,
    ...updates,
    id,
    updatedAt: new Date().toISOString(),
  };

  return new Promise((resolve, reject) => {
    const tx = database.transaction('sessions', 'readwrite');
    const store = tx.objectStore('sessions');
    const request = store.put(updated);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getSession(id: string): Promise<SavedSession | null> {
  const database = await getDB();

  return new Promise((resolve, reject) => {
    const tx = database.transaction('sessions', 'readonly');
    const store = tx.objectStore('sessions');
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function listSessions(): Promise<SavedSession[]> {
  const database = await getDB();

  return new Promise((resolve, reject) => {
    const tx = database.transaction('sessions', 'readonly');
    const store = tx.objectStore('sessions');
    const request = store.getAll();
    request.onsuccess = () => {
      const sessions = request.result as SavedSession[];
      resolve(sessions.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
    };
    request.onerror = () => reject(request.error);
  });
}

export async function deleteSession(id: string): Promise<void> {
  const database = await getDB();

  return new Promise((resolve, reject) => {
    const tx = database.transaction('sessions', 'readwrite');
    const store = tx.objectStore('sessions');
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function saveSetting(key: string, value: unknown): Promise<void> {
  const database = await getDB();

  return new Promise((resolve, reject) => {
    const tx = database.transaction('settings', 'readwrite');
    const store = tx.objectStore('settings');
    const request = store.put({ key, value });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getSetting<T>(key: string): Promise<T | null> {
  const database = await getDB();

  return new Promise((resolve, reject) => {
    const tx = database.transaction('settings', 'readonly');
    const store = tx.objectStore('settings');
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result?.value ?? null);
    request.onerror = () => reject(request.error);
  });
}
