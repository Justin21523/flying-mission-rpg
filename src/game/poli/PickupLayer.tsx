import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { usePlayerStore } from '../../stores/playerStore';
import { useBoostStore, isAttracting } from '../../stores/boostStore';
import { useEditorBoostStore } from '../../stores/editorBoostStore';
import { getAreaSize } from '../../stores/editorWorldStore';
import { NormalizedGlbModel } from '../world/NormalizedGlbModel';

// POLI seam #1 — ground pickups that fill the boost meter. Scattered deterministically within the area
// bounds; collected on proximity (and drawn toward the player while an attract ability is active). All
// config (model / value / count / spread) is editable in the ⭐ Boost tab. Respawns on area re-entry.

const COLLECT_R = 1.7;

// Deterministic pseudo-random in [0,1).
const rand = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

const Pickup = ({ pos, value, model }: { pos: [number, number, number]; value: number; model: string }) => {
  const ref = useRef<Group>(null);
  const taken = useRef(false);
  useFrame((state) => {
    const g = ref.current;
    if (!g || taken.current) return;
    g.rotation.y += 0.04;
    g.position.y = pos[1] + 0.6 + Math.sin(state.clock.elapsedTime * 2 + pos[0]) * 0.15;
    const pp = usePlayerStore.getState().position;
    if (!pp) return;
    const dx = pp.x - g.position.x;
    const dz = pp.z - g.position.z;
    const d = Math.hypot(dx, dz);
    const att = isAttracting();
    if (att.on && d < att.radius && d > 0.001) { g.position.x += dx * 0.08; g.position.z += dz * 0.08; }
    if (d < COLLECT_R) { taken.current = true; g.visible = false; useBoostStore.getState().collect(value); }
  });
  return (
    <group ref={ref} position={pos}>
      {model
        ? <NormalizedGlbModel assetId={model} target={1.2} />
        : (
          <mesh castShadow>
            <icosahedronGeometry args={[0.4, 0]} />
            <meshStandardMaterial color="#fde047" emissive="#f59e0b" emissiveIntensity={0.9} roughness={0.3} metalness={0.4} />
          </mesh>
        )}
    </group>
  );
};

export const PickupLayer = ({ areaId }: { areaId: string }) => {
  const count = useEditorBoostStore((s) => s.pickupCount);
  const spread = useEditorBoostStore((s) => s.pickupSpread);
  const value = useEditorBoostStore((s) => s.pickupValue);
  const model = useEditorBoostStore((s) => s.pickupModelAssetId);

  const positions = useMemo(() => {
    const lim = Math.min(spread, getAreaSize(areaId) - 4);
    // Hash the areaId so each area gets a stable but distinct scatter.
    let h = 0;
    for (let i = 0; i < areaId.length; i++) h = (h * 31 + areaId.charCodeAt(i)) >>> 0;
    const out: [number, number, number][] = [];
    for (let i = 0; i < count; i++) {
      const x = (rand(h + i * 2 + 1) - 0.5) * 2 * lim;
      const z = (rand(h + i * 2 + 2) - 0.5) * 2 * lim;
      out.push([Math.round(x), 0, Math.round(z)]);
    }
    return out;
  }, [areaId, count, spread]);

  if (count <= 0) return null;
  return <>{positions.map((p, i) => <Pickup key={`${areaId}-${i}`} pos={p} value={value} model={model} />)}</>;
};
