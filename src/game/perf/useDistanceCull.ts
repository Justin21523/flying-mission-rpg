import { useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, type Object3D } from 'three';
import { usePlayerStore } from '../../stores/playerStore';
import { useUiStore } from '../../stores/uiStore';
import { useGraphicsSettingsStore } from '../../stores/graphicsSettingsStore';
import { qualityCullRadius, incCulled, decCulled } from './lod';

// POLI perf — distance culling for a single object. Attach the returned ref to a <group>; a throttled frame
// loop toggles `group.visible` based on the player's distance, so far-away content is not rendered (big-map
// perf). Hysteresis (hide beyond radius+MARGIN, show within radius) avoids edge flicker / abrupt pop. Imperative
// (no React re-render). Disabled culling or Edit Mode → always visible (you always see/select everything while
// editing). Radius + on/off come from graphicsSettingsStore (tunable, not hardcoded).

const CHECK_INTERVAL = 0.15; // seconds between checks
const MARGIN = 10;           // show a bit before the hard radius so nothing visibly snaps in
const _tmp = new Vector3();

export function useDistanceCull<T extends Object3D>(): RefObject<T | null> {
  const ref = useRef<T | null>(null);
  const acc = useRef(0);
  useFrame((_, dt) => {
    acc.current += dt;
    if (acc.current < CHECK_INTERVAL) return;
    acc.current = 0;
    const g = ref.current;
    if (!g) return;
    const gs = useGraphicsSettingsStore.getState();
    // Never cull while editing or when culling is off — always show everything.
    if (!gs.cullEnabled || useUiStore.getState().editMode) { if (!g.visible) { g.visible = true; decCulled(); } return; }
    const p = usePlayerStore.getState().position;
    if (!p) return;
    g.getWorldPosition(_tmp);
    const dx = _tmp.x - p.x;
    const dz = _tmp.z - p.z;
    const d2 = dx * dx + dz * dz;
    // Quality-scaled radius — lower quality culls distant objects sooner (distance LOD).
    const r = qualityCullRadius(gs.cullRadius);
    if (g.visible) { if (d2 > (r + MARGIN) * (r + MARGIN)) { g.visible = false; incCulled(); } }
    else if (d2 < r * r) { g.visible = true; decCulled(); }
  });
  return ref;
}
