import { create } from 'zustand';

// POLI — records the animation clip names discovered in each player model GLB (keyed by model path), so the
// POLI tab's animation-rule editor can offer a dropdown of the model's real clips. Filled by PlayerMesh when
// a model loads. Session-only (re-derived on load); not persisted.
interface AnimClipState {
  clipsByPath: Record<string, string[]>;
  setClips: (path: string, names: string[]) => void;
}

export const useAnimClipStore = create<AnimClipState>((set, get) => ({
  clipsByPath: {},
  setClips: (path, names) => {
    const prev = get().clipsByPath[path];
    if (prev && prev.length === names.length && prev.every((n, i) => n === names[i])) return; // unchanged
    set({ clipsByPath: { ...get().clipsByPath, [path]: names } });
  },
}));

// Non-hook union of clip names across the given model paths (for the rule-editor dropdown).
export function getClipsForPaths(paths: (string | undefined)[]): string[] {
  const map = useAnimClipStore.getState().clipsByPath;
  const out = new Set<string>();
  for (const p of paths) if (p) for (const n of map[p] ?? []) out.add(n);
  return [...out];
}
