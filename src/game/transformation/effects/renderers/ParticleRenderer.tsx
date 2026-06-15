import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, Color, type BufferAttribute, type Points, type PointsMaterial } from 'three';
import { anchorPosition, fadeEnvelope, liveV2, makeSoftTexture } from '../effectAnchor';
import type { ActiveEffectV2, ParticleEffectParameters } from '../../../../types/game/transformationEffects';

// One configurable, deterministic particle system (THREE.Points). Particle positions are an analytic function
// of the effect progress + a per-particle seed (NOT per-frame integration), so timeline scrubbing shows the
// exact state and there is no accumulation. `particleShape` selects the spatial pattern.
const DEFAULTS: ParticleEffectParameters = {
  particleCount: 120, spawnRate: 0, particleLifetime: 1.4, particleSize: 0.5, particleSizeOverTime: 0.4,
  particleSpeed: 8, particleAcceleration: 0, particleGravity: 0, particleDrag: 0, particleSpreadRadius: 6,
  particleDirection: [0, 1, 0], particleRandomness: 1, particleColorStart: '#ffe7a8', particleColorEnd: '#ff7a3c',
  particleOpacityStart: 1, particleOpacityEnd: 0, particleShape: 'starburst', particleOrbitRadius: 4,
  particleOrbitSpeed: 2, particleBurstAmount: 1, particleTrailLength: 0,
};

const seeded = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

function particlePos(i: number, count: number, p: ParticleEffectParameters, prog: number, out: Float32Array, o: number): void {
  const t = prog * p.particleLifetime;
  const a = (i / count) * Math.PI * 2;
  const rnd = (seeded(i) - 0.5) * 2 * p.particleRandomness;
  const dist = (p.particleSpeed * t + 0.5 * p.particleAcceleration * t * t) * (1 + rnd * 0.2);
  const set = (x: number, y: number, z: number) => { out[o] = x; out[o + 1] = y; out[o + 2] = z; };
  switch (p.particleShape) {
    case 'ring': set(Math.cos(a) * dist, 0.3 + rnd * 0.2, Math.sin(a) * dist); break;
    case 'spiral': { const ang = a + prog * 6; set(Math.cos(ang) * dist, prog * p.particleSpreadRadius, Math.sin(ang) * dist); break; }
    case 'orbit': { const ang = a + prog * p.particleOrbitSpeed * Math.PI * 2; set(Math.cos(ang) * p.particleOrbitRadius, 0.5 + Math.sin(ang * 2) * 0.6, Math.sin(ang) * p.particleOrbitRadius); break; }
    case 'beam': set(rnd * 0.6, prog * p.particleSpreadRadius * 2, (seeded(i * 2) - 0.5) * 1.2); break;
    case 'rising': set((seeded(i) - 0.5) * p.particleSpreadRadius, prog * p.particleSpreadRadius * 1.5, (seeded(i * 3) - 0.5) * p.particleSpreadRadius); break;
    case 'ground': { const r = dist * 0.6; set(Math.cos(a) * r, Math.max(0, 0.2 - prog * 0.2), Math.sin(a) * r); break; }
    case 'dome': { const phi = (i / count) * Math.PI; const r = p.particleSpreadRadius * prog; set(Math.cos(a) * Math.sin(phi) * r, Math.cos(phi) * r, Math.sin(a) * Math.sin(phi) * r); break; }
    case 'magic_circle': set(Math.cos(a) * p.particleOrbitRadius, 0.1, Math.sin(a) * p.particleOrbitRadius); break;
    default: { // 'burst' / 'starburst' — radial sphere
      const phi = Math.acos(2 * seeded(i * 5) - 1);
      set(Math.sin(phi) * Math.cos(a) * dist, Math.cos(phi) * dist + p.particleGravity * -0.5 * t * t, Math.sin(phi) * Math.sin(a) * dist);
    }
  }
}

export const ParticleRenderer = ({ fx }: { fx: ActiveEffectV2 }) => {
  const params = useMemo<ParticleEffectParameters>(() => ({ ...DEFAULTS, ...(fx.config.parameters as Partial<ParticleEffectParameters>) }), [fx]);
  const count = Math.max(4, Math.min(600, Math.round(params.particleCount)));
  const positions = useMemo(() => new Float32Array(count * 3), [count]);
  const texture = useMemo(() => makeSoftTexture(), []);
  useEffect(() => () => texture.dispose(), [texture]);
  const ptsRef = useRef<Points>(null);
  const cStart = useMemo(() => new Color(params.particleColorStart), [params.particleColorStart]);
  const cEnd = useMemo(() => new Color(params.particleColorEnd), [params.particleColorEnd]);

  useFrame(() => {
    const pts = ptsRef.current;
    if (!pts) return;
    const live = liveV2(fx.config.effectId, fx);
    const base = anchorPosition(live.config);
    pts.position.set(base[0], base[1], base[2]);
    const attr = pts.geometry.attributes.position as BufferAttribute;
    const arr = attr.array as Float32Array; // THREE-owned buffer (same data we seeded) — mutate this, not the memo
    for (let i = 0; i < count; i += 1) particlePos(i, count, params, live.progress, arr, i * 3);
    attr.needsUpdate = true;
    const mat = pts.material as PointsMaterial;
    mat.color.copy(cStart).lerp(cEnd, live.progress);
    mat.opacity = (params.particleOpacityStart + (params.particleOpacityEnd - params.particleOpacityStart) * live.progress) * fadeEnvelope(live.config, live.progress, live.config.duration) * (live.config.intensity ?? 1);
    mat.size = params.particleSize * (1 + (params.particleSizeOverTime - 1) * live.progress);
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
