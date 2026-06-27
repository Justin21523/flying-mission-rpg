import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, Color, type BufferAttribute, type Points, type PointsMaterial } from 'three';
import { anchorPosition, fadeEnvelope, liveV2, makeSoftTexture } from '../effectAnchor';
import { txCameraFx, resetCameraFx } from '../cameraFx';
import type { ActiveEffectV2, PhysicsEffectParameters } from '../../../../types/game/transformationEffects';

// Pseudo-physics field — deterministic from progress (so scrub works): bodies expand by outward/radial force,
// are pulled by inward force, orbit, and fall under gravity. Rendered as additive points.
const PDEFAULTS: PhysicsEffectParameters = {
  initialVelocity: [0, 0, 0], acceleration: [0, 0, 0], gravity: 6, drag: 0.1, angularVelocity: 1.5,
  radialForce: 0, outwardForce: 10, inwardForce: 0, orbitSpeed: 1.2, orbitRadius: 3, springStrength: 0,
  damping: 0.1, boundaryRadius: 18, collisionEnabled: false, bounceFactor: 0.3, lifetime: 1.6, randomSeed: 1, bodyCount: 80,
};
const seeded = (n: number) => { const x = Math.sin(n * 91.7 + 13.3) * 43758.5453; return x - Math.floor(x); };

export const PhysicsRenderer = ({ fx }: { fx: ActiveEffectV2 }) => {
  const p = useMemo<PhysicsEffectParameters>(() => ({ ...PDEFAULTS, ...(fx.config.parameters as Partial<PhysicsEffectParameters>) }), [fx]);
  const count = Math.max(4, Math.min(500, Math.round(p.bodyCount)));
  const positions = useMemo(() => new Float32Array(count * 3), [count]);
  const texture = useMemo(() => makeSoftTexture(), []);
  useEffect(() => () => texture.dispose(), [texture]);
  const ptsRef = useRef<Points>(null);
  const color = useMemo(() => new Color(fx.config.color || '#aee7ff'), [fx.config.color]);

  useFrame(() => {
    const pts = ptsRef.current;
    if (!pts) return;
    const live = liveV2(fx.config.effectId, fx);
    const base = anchorPosition(live.config);
    pts.position.set(base[0], base[1] + 0.6, base[2]);
    const t = live.progress * p.lifetime;
    const attr = pts.geometry.attributes.position as BufferAttribute;
    const arr = attr.array as Float32Array; // THREE-owned buffer — mutate this, not the memo
    const rs = p.randomSeed + (fx.config.seed ?? 0) * 1013; // top-level seed folds into the param seed (seed 0 = unchanged)
    for (let i = 0; i < count; i += 1) {
      const a = (i / count) * Math.PI * 2 + seeded(i + rs) * 0.6;
      const phi = Math.acos(2 * seeded(i * 3 + rs) - 1);
      const raw = (p.outwardForce + p.radialForce) * t - p.inwardForce * t - 0.5 * p.drag * p.outwardForce * t * t;
      const r = Math.max(0, Math.min(p.boundaryRadius, raw)) + Math.sin(t * p.orbitSpeed) * (p.orbitRadius * 0.1);
      const ang = a + t * p.angularVelocity;
      const o = i * 3;
      arr[o] = Math.sin(phi) * Math.cos(ang) * r;
      arr[o + 1] = Math.cos(phi) * r - 0.5 * p.gravity * t * t * 0.15;
      arr[o + 2] = Math.sin(phi) * Math.sin(ang) * r;
    }
    attr.needsUpdate = true;
    const mat = pts.material as PointsMaterial;
    mat.color.copy(color);
    mat.opacity = Math.max(0, 1 - live.progress) * fadeEnvelope(live.config, live.progress, live.config.duration) * (live.config.intensity ?? 1);
    mat.size = 0.3 + live.progress * 0.4;
  });

  return (
    <points ref={ptsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={count} />
      </bufferGeometry>
      <pointsMaterial map={texture} transparent opacity={0} depthWrite={false} depthTest={false} blending={AdditiveBlending} sizeAttenuation toneMapped={false} />
    </points>
  );
};

// Camera FX — writes additive shake / fov / time-scale that TransformationCameraController applies on top of
// the authored shot. Renders nothing in 3D. Resets on unmount so the camera returns to the authored shot.
export const CameraEffectRenderer = ({ fx }: { fx: ActiveEffectV2 }) => {
  useEffect(() => () => resetCameraFx(), []);
  useFrame(() => {
    const live = liveV2(fx.config.effectId, fx);
    const k = Math.sin(Math.min(1, live.progress) * Math.PI); // ramp up then down
    const type = live.config.effectType;
    const i = live.config.intensity ?? 1;
    if (type.includes('shake')) txCameraFx.shake = 0.35 * k * i;
    else if (type.includes('zoom')) txCameraFx.fovDelta = -18 * k * i;
    else if (type.includes('pull_back') || type.includes('transition')) txCameraFx.fovDelta = 12 * k * i;
    else if (type.includes('time_slow') || type.includes('slow')) txCameraFx.timeScale = 1 - 0.6 * k;
    else txCameraFx.fovDelta = -6 * k * i; // closeup / orbit / low-angle / focus — gentle push-in
  });
  return null;
};
