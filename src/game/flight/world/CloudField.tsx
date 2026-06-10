import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Object3D, type InstancedMesh } from 'three';
import { flightHandle } from '../flightHandle';

// Recycled cloud field — a FIXED instanced pool of soft puffs around the craft. As the craft flies, any
// puff that falls behind (or too far) is repositioned ahead (chunk recycling) → constant object count for
// unlimited flight, no memory growth, and a strong sense of speed as clouds stream past. No per-frame
// allocations (reused dummy + vectors; instanceMatrix updated in place).
const COUNT = 64;
const AHEAD = 520; // max distance ahead a recycled puff is placed
const SPAWN_MIN = 60;
const LATERAL = 150;
const VERT = 70;
const BEHIND = 70; // recycle once a puff is this far behind the nose

const _dummy = new Object3D();
const _fwd = new Vector3();
const _rel = new Vector3();
const positions: Vector3[] = Array.from({ length: COUNT }, () => new Vector3());
const scales: number[] = new Array(COUNT).fill(8);

// Place puff i ahead of `base` along `fwd`, with a random lateral (perpendicular in XZ) + vertical spread.
function place(i: number, base: Vector3, fwd: Vector3, ahead: number): void {
  const lat = (Math.random() * 2 - 1) * LATERAL;
  const vert = (Math.random() * 2 - 1) * VERT;
  const p = positions[i];
  p.copy(base).addScaledVector(fwd, ahead);
  p.x += -fwd.z * lat; // perpendicular (in XZ) lateral spread
  p.z += fwd.x * lat;
  p.y += vert;
  scales[i] = 7 + Math.random() * 12;
}

export const CloudField = () => {
  const mesh = useRef<InstancedMesh>(null);

  useEffect(() => {
    _fwd.set(0, 0, -1).applyQuaternion(flightHandle.quat);
    // initial scatter all around the craft (front and back), so the field is full immediately
    for (let i = 0; i < COUNT; i++) place(i, flightHandle.pos, _fwd, (Math.random() * 2 - 1) * AHEAD);
  }, []);

  useFrame(() => {
    const m = mesh.current;
    if (!m) return;
    _fwd.set(0, 0, -1).applyQuaternion(flightHandle.quat);
    for (let i = 0; i < COUNT; i++) {
      _rel.copy(positions[i]).sub(flightHandle.pos);
      const along = _rel.dot(_fwd);
      if (along < -BEHIND || _rel.length() > AHEAD + 200) place(i, flightHandle.pos, _fwd, SPAWN_MIN + Math.random() * AHEAD);
      _dummy.position.copy(positions[i]);
      _dummy.scale.setScalar(scales[i]);
      _dummy.updateMatrix();
      m.setMatrixAt(i, _dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]} frustumCulled={false}>
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial color="#f1f5f9" transparent opacity={0.5} depthWrite={false} roughness={1} flatShading />
    </instancedMesh>
  );
};
