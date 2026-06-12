// Batch 13 — storage abstraction behind the save system. localStorage today; swappable for IndexedDB later
// without touching SaveManager. All methods are crash-safe (private mode / quota / SSR → no throw).

export interface SaveStorage {
  available(): boolean;
  read(key: string): string | null;
  write(key: string, value: string): boolean;
  remove(key: string): void;
}

export const localStorageSaveStorage: SaveStorage = {
  available(): boolean {
    try {
      if (typeof localStorage === 'undefined') return false;
      const probe = '__save_probe__';
      localStorage.setItem(probe, '1');
      localStorage.removeItem(probe);
      return true;
    } catch {
      return false;
    }
  },
  read(key) {
    try { return typeof localStorage === 'undefined' ? null : localStorage.getItem(key); } catch { return null; }
  },
  write(key, value) {
    try { localStorage.setItem(key, value); return true; } catch { return false; }
  },
  remove(key) {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  },
};

// In-memory storage (tests / SSR fallback).
export function createMemorySaveStorage(): SaveStorage {
  const map = new Map<string, string>();
  return {
    available: () => true,
    read: (k) => map.get(k) ?? null,
    write: (k, v) => { map.set(k, v); return true; },
    remove: (k) => { map.delete(k); },
  };
}
