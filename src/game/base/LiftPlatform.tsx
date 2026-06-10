import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { useGameStore } from '../../stores/game/useGameStore';
import { usePlayerStore } from '../../stores/playerStore';
import { useEditorBaseLayoutStore } from '../../stores/game/editorBaseLayoutStore';
import { useBaseRuntimeStore } from '../../stores/game/baseRuntimeStore';
import { useMergedTransform } from '../../stores/sceneEditStore';
import { vehicleHandle } from './vehicleHandle';
import { withinRadius } from './platformAlign';
import { basePartKey } from './basePartKey';

// Owns the lift platform in PLAY mode: proximity/alignment detection (HANGAR) → lock + cinematic descent
// (PLATFORM_ALIGNMENT) → LAUNCH_PREPARATION. The reused FollowCamera follows the vehicle down automatically
// (BaseVehicle publishes its position), and the lift "rides" the vehicle body via vehicleHandle.

const IN_RANGE = 3.6;
const ALIGNED = 1.7;
const AUTO_DWELL = 2.0; // s aligned before auto-locking (also press E)
const LIFT_DURATION = 4.5;
const LIFT_DEPTH = 5;

const _trans = { x: 0, y: 0, z: 0 };
const easeInOut = (t: number) => t * t * (3 - 2 * t);

export const LiftPlatform = () => {
  const part = useEditorBaseLayoutStore((s) => s.items.find((p) => p.kind === 'lift_platform'));
  // Honour gizmo moves: read the merged (base ⊕ override) platform transform.
  const merged = useMergedTransform(part ? basePartKey(part.id) : 'base#structure#none', {
    position: part ? part.position : [0, 0, 0],
    rotation: part ? part.rotation : [0, 0, 0],
    scale: part ? part.scale : 1,
  });
  const platformRef = useRef<Group>(null);
  const gateLeftRef = useRef<Group>(null);
  const gateRightRef = useRef<Group>(null);
  const elapsed = useRef(0);
  const dwell = useRef(0);
  const prevPhase = useRef<string>('');
  const confirm = useRef(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'KeyE' || e.code === 'Enter') confirm.current = true;
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      useBaseRuntimeStore.getState().reset();
    };
  }, []);

  useFrame((_, dtRaw) => {
    if (!part) return;
    const dt = Math.min(dtRaw, 0.05);
    const cx = merged.position[0];
    const startY = merged.position[1];
    const cz = merged.position[2];
    const phase = useGameStore.getState().phase;
    const plat = platformRef.current;

    // Phase edge handling.
    if (phase !== prevPhase.current) {
      if (phase === 'PLATFORM_ALIGNMENT') {
        elapsed.current = 0;
        useBaseRuntimeStore.getState().setLocked(true);
        useBaseRuntimeStore.getState().setLift('descending', Math.ceil(LIFT_DURATION));
        // setLocked(true) switches the vehicle body to kinematic (BaseVehicle's typed prop), so this
        // setTranslation sinks it cleanly through the shaft without the solver fighting the floor.
        const body = vehicleHandle.body;
        if (body) {
          _trans.x = cx; _trans.y = startY + 0.6; _trans.z = cz;
          body.setTranslation(_trans, true);
        }
      } else if (phase === 'HANGAR') {
        useBaseRuntimeStore.getState().setLocked(false);
        useBaseRuntimeStore.getState().setLift('idle', 0);
        if (plat) plat.position.y = startY;
      }
      prevPhase.current = phase;
    }

    if (phase === 'HANGAR') {
      if (plat) plat.position.y = startY;
      const p = usePlayerStore.getState().position;
      if (p) {
        const inRange = withinRadius(p.x, p.z, cx, cz, IN_RANGE);
        const aligned = withinRadius(p.x, p.z, cx, cz, ALIGNED);
        useBaseRuntimeStore.getState().setProximity(inRange, aligned);
        if (aligned) {
          dwell.current += dt;
          if (dwell.current >= AUTO_DWELL || confirm.current) {
            confirm.current = false;
            useGameStore.getState().requestTransition('PLATFORM_ALIGNMENT');
          }
        } else {
          dwell.current = 0;
        }
      }
      confirm.current = false;
      return;
    }

    if (phase === 'PLATFORM_ALIGNMENT') {
      elapsed.current += dt;
      const t = Math.min(1, elapsed.current / LIFT_DURATION);
      const e = easeInOut(t);
      const y = startY - LIFT_DEPTH * e;
      if (plat) plat.position.y = y;
      // Gate floor-doors slide apart as the platform sinks.
      const open = 2.4 * e;
      if (gateLeftRef.current) gateLeftRef.current.position.x = cx - open;
      if (gateRightRef.current) gateRightRef.current.position.x = cx + open;
      // Ride the vehicle down with the platform.
      const body = vehicleHandle.body;
      if (body) {
        _trans.x = cx; _trans.y = y + 0.6; _trans.z = cz;
        body.setTranslation(_trans, true);
      }
      useBaseRuntimeStore.getState().setLift('descending', Math.max(0, Math.ceil(LIFT_DURATION - elapsed.current)));
      if (t >= 1) {
        useBaseRuntimeStore.getState().setLift('done', 0);
        useGameStore.getState().requestTransition('LAUNCH_PREPARATION');
      }
      return;
    }

    // LAUNCH_PREPARATION and beyond — platform stays at the bottom.
    if (plat) plat.position.y = startY - LIFT_DEPTH;
  });

  if (!part) return null;
  const [sx, sy, sz] = part.size;
  const cx = merged.position[0];
  const startY = merged.position[1];
  const cz = merged.position[2];

  return (
    <group>
      {/* Floor doors (gate) around the shaft. */}
      <group ref={gateLeftRef} position={[cx - 2.4, startY, cz]}>
        <mesh receiveShadow>
          <boxGeometry args={[sx * 0.9, 0.25, sz + 1.5]} />
          <meshStandardMaterial color="#3a4456" />
        </mesh>
      </group>
      <group ref={gateRightRef} position={[cx + 2.4, startY, cz]}>
        <mesh receiveShadow>
          <boxGeometry args={[sx * 0.9, 0.25, sz + 1.5]} />
          <meshStandardMaterial color="#3a4456" />
        </mesh>
      </group>

      {/* The platform itself (animated in Y). */}
      <group ref={platformRef} position={[cx, startY, cz]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[Math.max(sx, sz) / 2, Math.max(sx, sz) / 2, sy, 32]} />
          <meshStandardMaterial color={part.color} metalness={0.3} roughness={0.6} />
        </mesh>
        <mesh position={[0, sy / 2 + 0.02, 0]}>
          <torusGeometry args={[Math.max(sx, sz) / 2 - 0.1, 0.08, 12, 40]} />
          <meshStandardMaterial color="#ff8a3c" emissive="#ff6a2c" emissiveIntensity={0.8} />
        </mesh>
      </group>
    </group>
  );
};
