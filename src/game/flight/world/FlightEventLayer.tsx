import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, type Group, type Mesh, type MeshStandardMaterial } from 'three';
import { getPath } from '../../../stores/editorPathStore';
import { getCurve, samplePos, sampleTangent } from '../../path/pathCurve';
import { getActivePathId, getActiveEventPool } from './worldRoute';
import { pickEvent } from './flightEventModel';
import { flightHandle } from '../flightHandle';
import { useWorldFlightRuntimeStore } from '../../../stores/game/worldFlightRuntimeStore';
import { FLIGHT_EVENT_POOL as POOL, FLIGHT_EVENT_POOL_SIZE as POOL_SIZE, SHAPE_BY_KIND, resetFlightEventPool } from './flightEventPool';

// Object-pooled flight-event director + renderer. A FIXED pool of slots is reused forever (never grows),
// so flying for 10+ min keeps the object count flat. The director (one useFrame) spawns events ahead on
// the route respecting per-event cooldowns + a global gap (no overlap), recycling expired/passed slots.
// Each slot is a self-contained EventSlot that reads its slot data every frame — no per-frame allocations
// and no React reconciliation while flying. The pool itself lives in flightEventPool.ts (the sonar reads it).
const AHEAD_U = 0.018; // how far ahead on the route (0..1) to place a new event
const GLOBAL_GAP = 1.6; // min seconds between any two spawns
const EVENT_CLEAR_SEC = 2.5; // how long a resolved event's label lingers in the HUD

const _pos = new Vector3();
const _tan = new Vector3();
const _perp = new Vector3();

// One slot's visuals — three toggleable primitives; only the active shape is shown. Reads POOL[index]
// each frame (cheap), spins/pulses for life, and never allocates.
const EventSlot = ({ index }: { index: number }) => {
  const group = useRef<Group>(null);
  const ring = useRef<Mesh>(null);
  const orb = useRef<Mesh>(null);
  const column = useRef<Mesh>(null);
  const ringMat = useRef<MeshStandardMaterial>(null);
  const orbMat = useRef<MeshStandardMaterial>(null);
  const colMat = useRef<MeshStandardMaterial>(null);

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    const s = POOL[index];
    g.visible = s.active;
    if (!s.active || !s.def) return;
    g.position.copy(s.pos);
    const sz = s.def.size;
    const showRing = s.shape === 'ring';
    const showOrb = s.shape === 'orb';
    const showCol = s.shape === 'column';
    if (ring.current) {
      ring.current.visible = showRing;
      if (showRing) {
        ring.current.rotation.z += dt * 0.6;
        ring.current.scale.setScalar(sz);
      }
    }
    if (orb.current) {
      orb.current.visible = showOrb;
      if (showOrb) {
        orb.current.rotation.y += dt * 1.4;
        const pulse = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.12;
        orb.current.scale.setScalar(sz * pulse);
      }
    }
    if (column.current) {
      column.current.visible = showCol;
      if (showCol) column.current.scale.set(sz, 1, sz);
    }
    if (ringMat.current) ringMat.current.color.set(s.def.color);
    if (orbMat.current) orbMat.current.color.set(s.def.color);
    if (colMat.current) colMat.current.color.set(s.def.color);
  });

  return (
    <group ref={group} visible={false}>
      <mesh ref={ring} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1, 0.12, 10, 36]} />
        <meshStandardMaterial ref={ringMat} color="#ffffff" emissive="#ffffff" emissiveIntensity={0.7} transparent opacity={0.85} />
      </mesh>
      <mesh ref={orb}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial ref={orbMat} color="#ffffff" emissive="#ffffff" emissiveIntensity={0.9} />
      </mesh>
      <mesh ref={column}>
        <cylinderGeometry args={[1, 1, 40, 14, 1, true]} />
        <meshStandardMaterial ref={colMat} color="#ffffff" emissive="#ffffff" emissiveIntensity={0.35} transparent opacity={0.32} side={2} />
      </mesh>
    </group>
  );
};

export const FlightEventLayer = () => {
  const lastSpawn = useRef<Record<string, number>>({});
  const globalTimer = useRef(0);
  const elapsed = useRef(0);
  const clearTimer = useRef(0);
  const slots = useMemo(() => Array.from({ length: POOL_SIZE }, (_, i) => i), []);

  useEffect(() => {
    resetFlightEventPool();
    lastSpawn.current = {};
    globalTimer.current = 0;
    elapsed.current = 0;
    return () => resetFlightEventPool();
  }, []);

  // Director — pick + place events, recycle, resolve. Single useFrame (the slots only read).
  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    elapsed.current += dt;
    globalTimer.current += dt;

    const def = getPath(getActivePathId());
    const cc = def ? getCurve(def) : null;
    if (!cc) return;
    const routeU = flightHandle.routeU;

    // recycle / resolve existing slots
    const rt = useWorldFlightRuntimeStore.getState();
    for (const s of POOL) {
      if (!s.active) continue;
      const age = elapsed.current - s.bornAt;
      if (!s.resolved) {
        const reach = (s.def?.size ?? 2) + 4;
        if (_pos.copy(s.pos).distanceTo(flightHandle.pos) < reach) {
          s.resolved = true;
          const d = s.def!;
          if (d.kind === 'collectible') rt.addCollectible(d.value ?? 1);
          else if (d.kind === 'energy_refill') rt.addEnergy(d.value ?? 20);
          else if (d.kind === 'radio' && d.radioText) rt.setRadio(d.radioText);
          rt.setActiveEvent(d.label);
          clearTimer.current = EVENT_CLEAR_SEC;
        }
      }
      if (age > s.def!.durationSec || routeU > s.spawnU + 0.01) s.active = false;
    }

    // clear stale HUD label
    if (clearTimer.current > 0) {
      clearTimer.current -= dt;
      if (clearTimer.current <= 0) {
        rt.setActiveEvent(null);
        rt.setRadio(null);
      }
    }

    // spawn (gated by global gap + free slot)
    if (globalTimer.current >= GLOBAL_GAP && routeU < 0.985) {
      const free = POOL.find((s) => !s.active);
      if (free) {
        const pool = getActiveEventPool();
        const chosen = pickEvent(pool, elapsed.current, lastSpawn.current, Math.random);
        if (chosen) {
          const aheadU = Math.min(0.999, routeU + AHEAD_U);
          samplePos(cc.curve, aheadU, _pos);
          sampleTangent(cc.curve, aheadU, _tan);
          _perp.set(_tan.z, 0, -_tan.x).normalize();
          const lateral = (Math.random() * 2 - 1) * chosen.lateralRange;
          free.pos.copy(_pos).addScaledVector(_perp, lateral);
          free.pos.y += (Math.random() - 0.5) * 4;
          free.active = true;
          free.resolved = false;
          free.def = chosen;
          free.shape = SHAPE_BY_KIND[chosen.kind];
          free.spawnU = aheadU;
          free.bornAt = elapsed.current;
          lastSpawn.current[chosen.id] = elapsed.current;
          globalTimer.current = 0;
        }
      }
    }
  });

  return (
    <>
      {slots.map((i) => (
        <EventSlot key={i} index={i} />
      ))}
    </>
  );
};
