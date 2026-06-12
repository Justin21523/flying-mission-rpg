import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Object3D, type InstancedMesh } from 'three';
import { flightHandle } from '../flightHandle';
import { getFlightEffectConfig, onFlightEffectConfigChange } from '../effects/FlightEffectQualityController';
import { reportStat } from '../../performance/RuntimeStatsCollector';

// Recycled speed streaks — a FIXED instanced pool of thin shards close around the craft, oriented along
// the flight direction. They sit still in the world while the craft rushes past, so they whip by as motion
// lines; recycled behind→ahead each frame (constant count, no allocations). Length + opacity scale with
// speed, so the streak effect strengthens when going fast and fades when slow.
const COUNT = 90;
const AHEAD = 200;
const RADIUS = 26;
const VERT = 16;
const BEHIND = 24;

const _dummy = new Object3D();
const _fwd = new Vector3();
const _rel = new Vector3();
const positions: Vector3[] = Array.from({ length: COUNT }, () => new Vector3());

function place(i: number, base: Vector3, fwd: Vector3, ahead: number): void {
  const ang = Math.random() * Math.PI * 2;
  const rad = Math.random() * RADIUS;
  const p = positions[i];
  p.copy(base).addScaledVector(fwd, ahead);
  p.x += -fwd.z * Math.cos(ang) * rad;
  p.z += fwd.x * Math.cos(ang) * rad;
  p.y += Math.sin(ang) * VERT;
}

export const SpeedField = () => {
  const mesh = useRef<InstancedMesh>(null);
  // Batch 12 — quality/reduce-motion gate (updated only when settings change, not per frame).
  const enabled = useRef(getFlightEffectConfig().speedLines);

  useEffect(() => {
    _fwd.set(0, 0, -1).applyQuaternion(flightHandle.quat);
    for (let i = 0; i < COUNT; i++) place(i, flightHandle.pos, _fwd, (Math.random() * 2 - 1) * AHEAD);
    return onFlightEffectConfigChange(() => { enabled.current = getFlightEffectConfig().speedLines; });
  }, []);

  useFrame(() => {
    const m = mesh.current;
    if (!m) return;
    if (!enabled.current) {
      if (m.visible) { m.visible = false; reportStat('particles', 0); }
      return;
    }
    m.visible = true;
    reportStat('particles', COUNT);
    _fwd.set(0, 0, -1).applyQuaternion(flightHandle.quat);
    // streak length grows with speed (0 at rest → long at cruise) for a dynamic speed sensation
    const stretch = 1 + Math.min(6, flightHandle.speed / 6);
    for (let i = 0; i < COUNT; i++) {
      _rel.copy(positions[i]).sub(flightHandle.pos);
      if (_rel.dot(_fwd) < -BEHIND || _rel.length() > AHEAD + 80) place(i, flightHandle.pos, _fwd, 40 + Math.random() * AHEAD);
      _dummy.position.copy(positions[i]);
      _dummy.quaternion.copy(flightHandle.quat);
      _dummy.scale.set(1, 1, stretch);
      _dummy.updateMatrix();
      m.setMatrixAt(i, _dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]} frustumCulled={false}>
      <boxGeometry args={[0.12, 0.12, 5]} />
      <meshStandardMaterial color="#bae6fd" emissive="#7dd3fc" emissiveIntensity={0.8} transparent opacity={0.5} depthWrite={false} />
    </instancedMesh>
  );
};
