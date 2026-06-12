import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, type BufferAttribute, CanvasTexture, type BufferGeometry, type Points } from 'three';
import { flightHandle } from '../flightHandle';
import { getFlightEffectConfig, onFlightEffectConfigChange, type FlightEffectConfig } from './FlightEffectQualityController';
import { reportStat } from '../../performance/RuntimeStatsCollector';
import { shouldTick } from '../../performance/SceneVisibilityController';
import { getAudioManager } from '../../audio/AudioManager';

// Batch 12 — "breaking through clouds" burst. A FIXED-capacity puff pool (never `new` per frame) emits a
// soft white fog burst near the craft when flying fast through dense cloud; intensity scales with speed.
// Quality-gated (off when particles off / reduce-motion) and released as puffs fade, so long flights
// don't accumulate. Reports its active count to the perf panel and fires the cloud-break audio cue.

const CAPACITY = 48;
const LIFE = 0.9;

function makeSoftTexture(): CanvasTexture {
  const s = 64;
  const cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const ctx = cv.getContext('2d')!;
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, 'rgba(255,255,255,0.9)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.35)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  return new CanvasTexture(cv);
}

const rnd = (a: number, b: number): number => a + Math.random() * (b - a);

// Module-scope particle state + buffers (single mounted instance; mutated in useFrame without per-frame
// allocation — mirrors SpeedField's module-level arrays so the hooks lint stays clean).
const state = {
  px: new Float32Array(CAPACITY),
  py: new Float32Array(CAPACITY),
  pz: new Float32Array(CAPACITY),
  vx: new Float32Array(CAPACITY),
  vy: new Float32Array(CAPACITY),
  vz: new Float32Array(CAPACITY),
  life: new Float32Array(CAPACITY),
};
const geo = { positions: new Float32Array(CAPACITY * 3), sizes: new Float32Array(CAPACITY) };

export const CloudBreakEffect = () => {
  const points = useRef<Points>(null);
  const tex = useMemo(() => makeSoftTexture(), []);
  const cfg = useRef<FlightEffectConfig>(getFlightEffectConfig());
  const cooldown = useRef(0);
  const audioCooldown = useRef(0);

  useEffect(() => {
    const off = onFlightEffectConfigChange(() => { cfg.current = getFlightEffectConfig(); });
    return off;
  }, []);

  useFrame((_, dtRaw) => {
    const pts = points.current;
    if (!pts) return;
    const dt = Math.min(0.05, dtRaw);
    const c = cfg.current;
    const geometry = pts.geometry as BufferGeometry;
    const posAttr = geometry.getAttribute('position') as BufferAttribute;
    const sizeAttr = geometry.getAttribute('size') as BufferAttribute;

    // Emit bursts when allowed and flying fast through dense cloud.
    cooldown.current -= dt;
    audioCooldown.current -= dt;
    const speed = flightHandle.speedNorm;
    const canEmit = c.cloudBreak && shouldTick() && speed > 0.5 && c.cloudDensityMultiplier > 0.8 && c.cloudBreakParticles > 0;
    if (canEmit && cooldown.current <= 0) {
      cooldown.current = rnd(0.5, 1.1);
      const burst = Math.min(c.cloudBreakParticles, Math.round(8 + speed * 10));
      let spawned = 0;
      for (let i = 0; i < CAPACITY && spawned < burst; i += 1) {
        if (state.life[i] > 0) continue;
        state.px[i] = flightHandle.pos.x + rnd(-8, 8);
        state.py[i] = flightHandle.pos.y + rnd(-4, 4);
        state.pz[i] = flightHandle.pos.z + rnd(-8, 8);
        state.vx[i] = rnd(-6, 6);
        state.vy[i] = rnd(-2, 2);
        state.vz[i] = rnd(-6, 6);
        state.life[i] = LIFE;
        spawned += 1;
      }
      // Throttled audio cue tied to the visual burst.
      if (audioCooldown.current <= 0) {
        audioCooldown.current = 0.8;
        getAudioManager().play('flight.cloudBreak');
      }
    }

    // Integrate + write buffers.
    let active = 0;
    for (let i = 0; i < CAPACITY; i += 1) {
      let s = state.life[i];
      const o = i * 3;
      if (s > 0) {
        s -= dt;
        state.life[i] = s;
        state.px[i] += state.vx[i] * dt;
        state.py[i] += state.vy[i] * dt;
        state.pz[i] += state.vz[i] * dt;
        const k = s / LIFE; // 1→0
        geo.positions[o] = state.px[i];
        geo.positions[o + 1] = state.py[i];
        geo.positions[o + 2] = state.pz[i];
        geo.sizes[i] = (1 - k) * 14 + 4; // expand as it fades
        if (s > 0) active += 1;
      } else {
        geo.sizes[i] = 0;
        geo.positions[o + 1] = -100000; // park off-screen
      }
    }
    posAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
    pts.visible = c.cloudBreak;
    reportStat('effects', active);
  });

  return (
    <points ref={points} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[geo.positions, 3]} />
        <bufferAttribute attach="attributes-size" args={[geo.sizes, 1]} />
      </bufferGeometry>
      <pointsMaterial
        map={tex}
        size={10}
        sizeAttenuation
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
        opacity={0.5}
      />
    </points>
  );
};
