import { useEffect, useState } from 'react';
import { GLTFLoader } from 'three-stdlib';

// Imperatively read a GLB's animation-clip names for the editor's clip pickers (DOM-side, no Suspense /
// Canvas needed). Cached per path so re-opening a tab doesn't reload. The browser already has the GLB
// cached from the 3D scene, so this is cheap on a cache hit. setState only happens in the async callback.
const cache = new Map<string, string[]>();
const loader = new GLTFLoader();

export function useGltfClipNames(path?: string): string[] {
  const [loaded, setLoaded] = useState<{ path: string; names: string[] } | null>(null);

  useEffect(() => {
    if (!path || cache.has(path)) return; // cached / nothing to load → derived synchronously below
    let alive = true;
    loader.load(
      encodeURI(path),
      (g) => {
        const names = g.animations.map((a) => a.name);
        cache.set(path, names);
        if (alive) setLoaded({ path, names });
      },
      undefined,
      () => { if (alive) setLoaded({ path, names: [] }); },
    );
    return () => { alive = false; };
  }, [path]);

  if (path && cache.has(path)) return cache.get(path)!;
  if (loaded && loaded.path === path) return loaded.names;
  return [];
}
