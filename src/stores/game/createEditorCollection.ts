import { create } from 'zustand';
import type { StoreApi, UseBoundStore } from 'zustand';
import { moveItem } from '../../game/editor/arrayMove';

// Shared Edit-Mode authoring store for any `{ id }` collection. Mirrors the inherited editor paradigm
// (localStorage-backed, tolerant load, importState / reset / mergeMissingFromSeed) so each new data
// domain is one tiny factory call instead of ~80 lines of copy-paste. 3D placements (which need gizmo
// keys) keep their bespoke stores; abstract game data uses this.
export interface EditorCollectionState<T extends { id: string }> {
  items: T[];
  seeded: boolean;
  upsert: (item: T) => void;
  update: (id: string, patch: Partial<T>) => void;
  duplicate: (id: string) => string | null;
  remove: (id: string) => void;
  reorder: (id: string, dir: -1 | 1) => void; // move an item up/down in the list (order is authored)
  importState: (data: { items?: T[]; seeded?: boolean }) => void;
  mergeMissingFromSeed: () => void;
  // Version-gated reseed: when cfg.seedVersion changes, REFRESH all seed-owned items (ids present in the seed)
  // with the new shipped content, while keeping the user's OWN added items (ids not in the seed). Use this for
  // stores whose shipped seed content evolves (e.g. authored VFX effects) so returning users see the update.
  reconcileFromSeed: () => void;
  reset: () => void;
}

export interface EditorCollectionConfig<T extends { id: string }> {
  storageKey: string;
  seed: T[];
  makeId: () => string;
  // Bump this when the shipped seed CONTENT changes (not just additions) so reconcileFromSeed refreshes it.
  seedVersion?: string;
}

export type EditorCollectionStore<T extends { id: string }> = UseBoundStore<StoreApi<EditorCollectionState<T>>>;

function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object';
}

export function createEditorCollection<T extends { id: string }>(
  cfg: EditorCollectionConfig<T>,
): EditorCollectionStore<T> {
  function persist(items: T[], seeded: boolean): void {
    try {
      localStorage.setItem(cfg.storageKey, JSON.stringify({ items, seeded, v: cfg.seedVersion }));
    } catch {
      /* ignore localStorage quota / unavailable */
    }
  }

  function load(): { items: T[]; seeded: boolean; v?: string } {
    try {
      const raw = localStorage.getItem(cfg.storageKey);
      if (!raw) return { items: [], seeded: false };
      const p: unknown = JSON.parse(raw);
      if (isObj(p) && Array.isArray(p.items)) return { items: p.items as T[], seeded: !!p.seeded, v: typeof p.v === 'string' ? p.v : undefined };
      return { items: [], seeded: false };
    } catch {
      return { items: [], seeded: false }; // corrupt entry → start empty, re-seeded at boot
    }
  }

  // Version persisted alongside the items at the time of the last save (undefined for never-seeded / old data).
  const initial = load();
  let loadedVersion = initial.v;

  return create<EditorCollectionState<T>>((set, get) => ({
    items: initial.items,
    seeded: initial.seeded,

    upsert: (item) => {
      const exists = get().items.some((i) => i.id === item.id);
      const items = exists ? get().items.map((i) => (i.id === item.id ? item : i)) : [...get().items, item];
      set({ items });
      persist(items, get().seeded);
    },

    update: (id, patch) => {
      const items = get().items.map((i) => (i.id === id ? { ...i, ...patch } : i));
      set({ items });
      persist(items, get().seeded);
    },

    duplicate: (id) => {
      const src = get().items.find((i) => i.id === id);
      if (!src) return null;
      const copy = { ...src, id: cfg.makeId() } as T;
      const items = [...get().items, copy];
      set({ items });
      persist(items, get().seeded);
      return copy.id;
    },

    remove: (id) => {
      const items = get().items.filter((i) => i.id !== id);
      set({ items });
      persist(items, get().seeded);
    },

    reorder: (id, dir) => {
      const cur = get().items;
      const i = cur.findIndex((it) => it.id === id);
      if (i < 0) return;
      const items = moveItem(cur, i, dir);
      if (items === cur) return; // bounds no-op
      set({ items });
      persist(items, get().seeded);
    },

    importState: (data) => {
      const items = Array.isArray(data.items) ? data.items : [];
      set({ items, seeded: true });
      persist(items, true);
    },

    // Idempotent: add any seed item whose id is absent (never clobbers user edits). Safe every boot.
    mergeMissingFromSeed: () => {
      const have = new Set(get().items.map((i) => i.id));
      const missing = cfg.seed.filter((s) => !have.has(s.id));
      if (missing.length === 0 && get().seeded) return;
      const items = [...get().items, ...missing];
      set({ items, seeded: true });
      persist(items, true);
    },

    reconcileFromSeed: () => {
      // No seedVersion configured → behave exactly like add-missing (no overwrite).
      if (cfg.seedVersion == null) { get().mergeMissingFromSeed(); return; }
      // Up to date → just add any genuinely new ids.
      if (loadedVersion === cfg.seedVersion && get().seeded) { get().mergeMissingFromSeed(); return; }
      // Seed content changed: refresh every seed-owned id with the fresh shipped content; keep user-only items.
      const seedIds = new Set(cfg.seed.map((s) => s.id));
      const userOnly = get().items.filter((i) => !seedIds.has(i.id));
      const items = [...cfg.seed.map((s) => ({ ...s })), ...userOnly];
      loadedVersion = cfg.seedVersion;
      set({ items, seeded: true });
      persist(items, true);
    },

    reset: () => {
      set({ items: [], seeded: false });
      persist([], false);
    },
  }));
}
