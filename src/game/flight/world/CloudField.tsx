import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Object3D, type InstancedMesh } from 'three';
import { flightHandle } from '../flightHandle';
import { useEditorFlightStore } from '../../../stores/game/editorFlightStore';

// Recycled cloud floor — a FIXED instanced pool of soft puffs that sits WELL BELOW the craft, so the craft
// cruises through open blue sky (WorldSkyAmbience) with a distinct cloud floor far beneath and stays clearly
// visible against the sky. As it flies, puffs that fall behind are repositioned ahead (chunk recycling) →
// constant object count for unlimited flight, no memory growth, a strong sense of speed as clouds stream
// past below. Count is editable (🛩 Flight → World cloud count).
const MAX_CLOUDS = 260;
const AHEAD = 560;
const SPAWN_MIN = 60;
const LATERAL = 260; // wide spread to the sides → reads as a horizon-wide floor
const DROP_MIN = 75; // clouds sit at least this far below the craft (clear gap → sky + craft visible)
const DROP_RANGE = 55; // …down to this much below (a deck of depth)
const BEHIND = 80;

// Module-level reusable buffers (never render-owned → no per-frame allocations).
const _dummy = new Object3D();
const _fwd = new Vector3();
const _rel = new Vector3();
const POS: Vector3[] = Array.from({ length: MAX_CLOUDS }, () => new Vector3());
const SCALE = new Float32Array(MAX_CLOUDS);

// Place puff i ahead of the craft along `fwd`, spread to the sides and dropped well below the flight path.
function place(i: number, ahead: number): void {
  const lat = (Math.random() * 2 - 1) * LATERAL;
  const p = POS[i];
  p.copy(flightHandle.pos).addScaledVector(_fwd, ahead);
  p.x += -_fwd.z * lat;
  p.z += _fwd.x * lat;
  p.y = flightHandle.pos.y - (DROP_MIN + Math.random() * DROP_RANGE);
  SCALE[i] = 7 + Math.random() * 12;
}

const CloudFieldInner = ({ count }: { count: number }) => {
  const mesh = useRef<InstancedMesh>(null);

  useEffect(() => {
    _fwd.set(0, 0, -1).applyQuaternion(flightHandle.quat);
    for (let i = 0; i < count; i++) place(i, (Math.random() * 2 - 1) * AHEAD);
  }, [count]);

  useFrame(() => {
    const m = mesh.current;
    if (!m) return;
    _fwd.set(0, 0, -1).applyQuaternion(flightHandle.quat);
    for (let i = 0; i < count; i++) {
      _rel.copy(POS[i]).sub(flightHandle.pos);
      if (_rel.dot(_fwd) < -BEHIND || _rel.length() > AHEAD + 240) place(i, SPAWN_MIN + Math.random() * AHEAD);
      _dummy.position.copy(POS[i]);
      _dummy.scale.setScalar(SCALE[i]);
      _dummy.updateMatrix();
      m.setMatrixAt(i, _dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} frustumCulled={false}>
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial color="#ffffff" transparent opacity={0.7} depthWrite={false} roughness={1} flatShading />
    </instancedMesh>
  );
};

export const CloudField = () => {
  const count = useEditorFlightStore((s) => Math.min(MAX_CLOUDS, Math.max(8, Math.round(s.tuning.worldCloudCount))));
  // Key by count so changing it in the Flight tab rebuilds the instanced pool cleanly.
  return <CloudFieldInner key={count} count={count} />;
};
