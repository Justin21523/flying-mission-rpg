import { useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { HERO_MODELS, THEME_MODELS } from '../../data/cinematic-vfx/vfxModelCatalog';
import { resolveModelAsset } from '../../stores/modelStudioStore';

// The VFX GLBs (hero aircraft, lions, barriers…) are 5–12 MB each and aren't otherwise preloaded — so the
// first cast that references one would start loading it mid-effect and the <1s effect can expire before it
// finishes (model never appears). This warms drei's GLTF cache in the background when combat is near, so casts
// render their models immediately. useGLTF.preload is non-blocking (fires fetches; never throws here).
function vfxModelIds(): string[] {
  const ids = new Set<string>();
  for (const set of Object.values(HERO_MODELS)) {
    if (set.airplane) ids.add(set.airplane);
    if (set.transformer) ids.add(set.transformer);
    set.poses.slice(0, 3).forEach((p) => ids.add(p)); // dance troupe / giant use the first few poses
  }
  for (const group of Object.values(THEME_MODELS)) {
    for (const v of Object.values(group)) {
      if (Array.isArray(v)) v.forEach((x) => x && ids.add(x));
      else if (v) ids.add(v);
    }
  }
  return [...ids];
}

let warmed = false;

function warmVfxModelCache(): void {
  if (warmed) return;
  warmed = true;
  for (const id of vfxModelIds()) {
    const asset = resolveModelAsset(id);
    if (asset?.path) {
      try { useGLTF.preload(encodeURI(asset.path)); } catch { /* preload best-effort */ }
    }
  }
}

// Fire at MODULE level (import time, before the component tree renders) like PlayerMesh — so the GLB fetches
// start as early as possible and are cached well before the first cast. The component mount is a safety net.
if (typeof window !== 'undefined') warmVfxModelCache();

export const VfxModelPreloader = () => {
  useEffect(() => { warmVfxModelCache(); }, []);
  return null;
};
