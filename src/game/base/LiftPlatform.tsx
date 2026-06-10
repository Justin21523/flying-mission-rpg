import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CanvasTexture, RepeatWrapping, SRGBColorSpace, DoubleSide, type Group } from 'three';
import { useGameStore } from '../../stores/game/useGameStore';
import { usePlayerStore } from '../../stores/playerStore';
import { useEditorBaseLayoutStore } from '../../stores/game/editorBaseLayoutStore';
import { useBaseRuntimeStore } from '../../stores/game/baseRuntimeStore';
import { useMergedTransform } from '../../stores/sceneEditStore';
import { vehicleHandle } from './vehicleHandle';
import { withinRadius } from './platformAlign';
import { basePartKey } from './basePartKey';
import { LiftDeck } from './LiftDeck';

// Lift platform (PLAY mode): proximity/alignment (HANGAR) → lock + descent (PLATFORM_ALIGNMENT) →
// LAUNCH_PREPARATION. A STATIC textured shaft (bright light bands) stays put while the deck + vehicle +
// camera sink past it (the drop). The deck visual is the SHARED LiftDeck (identical in edit + play). Lift
// depth/duration are editable per-part (🏗 Base tab). Gate floor-doors slide open; deep accelerating drop.
const IN_RANGE = 3.6;
const ALIGNED = 1.9;
const AUTO_DWELL = 1.6;
const DEFAULT_LIFT_DURATION = 5;
const DEFAULT_LIFT_DEPTH = 12;
const SHAFT_BELOW = 4;

const _trans = { x: 0, y: 0, z: 0 };
const easeInOut = (t: number) => t * t * (3 - 2 * t);

const ShaftWall = ({ pos, rot, half, h, tex }: {
  pos: [number, number, number];
  rot: [number, number, number];
  half: number;
  h: number;
  tex: CanvasTexture;
}) => (
  <mesh position={pos} rotation={rot}>
    <planeGeometry args={[half * 2, h]} />
    <meshStandardMaterial map={tex} emissiveMap={tex} emissive="#3aa0d0" emissiveIntensity={0.6} side={DoubleSide} roughness={0.8} />
  </mesh>
);

function makeShaftTexture(): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#0c1018';
  ctx.fillRect(0, 0, 64, 256);
  ctx.fillStyle = '#1a2130';
  ctx.fillRect(2, 0, 6, 256);
  ctx.fillRect(56, 0, 6, 256);
  ctx.fillStyle = '#5fd0ff';
  ctx.fillRect(0, 24, 64, 14);
  ctx.fillStyle = '#aef0ff';
  ctx.fillRect(0, 28, 64, 6);
  const t = new CanvasTexture(c);
  t.wrapS = t.wrapT = RepeatWrapping;
  t.colorSpace = SRGBColorSpace;
  return t;
}

export const LiftPlatform = () => {
  const part = useEditorBaseLayoutStore((s) => s.items.find((p) => p.kind === 'lift_platform'));
  const merged = useMergedTransform(part ? basePartKey(part.id) : 'base#structure#none', {
    position: part ? part.position : [0, 0, 0],
    rotation: part ? part.rotation : [0, 0, 0],
    scale: part ? part.scale : 1,
  });
  const LIFT_DEPTH = part?.liftDepth ?? DEFAULT_LIFT_DEPTH;
  const LIFT_DURATION = part?.liftDurationSec ?? DEFAULT_LIFT_DURATION;
  const platformRef = useRef<Group>(null);
  const gateLeftRef = useRef<Group>(null);
  const gateRightRef = useRef<Group>(null);
  const elapsed = useRef(0);
  const dwell = useRef(0);
  const prevPhase = useRef<string>('');
  const confirm = useRef(false);

  const shaftTex = useMemo(() => {
    const t = makeShaftTexture();
    t.repeat.set(1, (LIFT_DEPTH + SHAFT_BELOW) / 2);
    return t;
  }, [LIFT_DEPTH]);

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

    if (phase !== prevPhase.current) {
      if (phase === 'PLATFORM_ALIGNMENT') {
        elapsed.current = 0;
        useBaseRuntimeStore.getState().setLocked(true);
        useBaseRuntimeStore.getState().setLift('descending', Math.ceil(LIFT_DURATION));
        const body = vehicleHandle.body;
        if (body) {
          _trans.x = cx; _trans.y = startY + 0.6; _trans.z = cz;
          body.setTranslation(_trans, true);
        }
      } else if (phase === 'HANGAR') {
        useBaseRuntimeStore.getState().setLocked(false);
        useBaseRuntimeStore.getState().setLift('idle', 0);
        if (plat) plat.position.y = startY;
        if (gateLeftRef.current) gateLeftRef.current.position.x = cx - 2.4;
        if (gateRightRef.current) gateRightRef.current.position.x = cx + 2.4;
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
      const open = 2.4 + 2.6 * Math.min(1, e * 2);
      if (gateLeftRef.current) gateLeftRef.current.position.x = cx - open;
      if (gateRightRef.current) gateRightRef.current.position.x = cx + open;
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

    if (plat) plat.position.y = startY - LIFT_DEPTH;
  });

  if (!part) return null;
  const [sx, , sz] = part.size;
  const cx = merged.position[0];
  const startY = merged.position[1];
  const cz = merged.position[2];
  const r = Math.max(sx, sz) / 2;
  const shaftHalf = r + 0.5;
  const shaftH = LIFT_DEPTH + SHAFT_BELOW;
  const shaftMidY = 0.05 - shaftH / 2;

  return (
    <group>
      <group position={[cx, 0, cz]}>
        <ShaftWall pos={[0, shaftMidY, -shaftHalf]} rot={[0, 0, 0]} half={shaftHalf} h={shaftH} tex={shaftTex} />
        <ShaftWall pos={[0, shaftMidY, shaftHalf]} rot={[0, Math.PI, 0]} half={shaftHalf} h={shaftH} tex={shaftTex} />
        <ShaftWall pos={[-shaftHalf, shaftMidY, 0]} rot={[0, Math.PI / 2, 0]} half={shaftHalf} h={shaftH} tex={shaftTex} />
        <ShaftWall pos={[shaftHalf, shaftMidY, 0]} rot={[0, -Math.PI / 2, 0]} half={shaftHalf} h={shaftH} tex={shaftTex} />
        <mesh position={[0, 0.05 - shaftH, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[shaftHalf * 2, shaftHalf * 2]} />
          <meshStandardMaterial color="#0a0e15" />
        </mesh>
      </group>

      <group ref={gateLeftRef} position={[cx - 2.4, startY, cz]}>
        <mesh receiveShadow>
          <boxGeometry args={[sx * 0.9, 0.25, sz + 1.5]} />
          <meshStandardMaterial color="#3a4456" metalness={0.4} roughness={0.6} />
        </mesh>
      </group>
      <group ref={gateRightRef} position={[cx + 2.4, startY, cz]}>
        <mesh receiveShadow>
          <boxGeometry args={[sx * 0.9, 0.25, sz + 1.5]} />
          <meshStandardMaterial color="#3a4456" metalness={0.4} roughness={0.6} />
        </mesh>
      </group>

      {/* The deck — SHARED LiftDeck (identical to Edit Mode). */}
      <group ref={platformRef} position={[cx, startY, cz]}>
        <LiftDeck size={part.size} color={part.color} />
      </group>
    </group>
  );
};
