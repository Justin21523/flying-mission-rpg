import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CanvasTexture, RepeatWrapping, SRGBColorSpace, DoubleSide, type Group, type MeshStandardMaterial } from 'three';
import { useGameStore } from '../../stores/game/useGameStore';
import { usePlayerStore } from '../../stores/playerStore';
import { useEditorBaseLayoutStore } from '../../stores/game/editorBaseLayoutStore';
import { useBaseRuntimeStore } from '../../stores/game/baseRuntimeStore';
import { useMergedTransform } from '../../stores/sceneEditStore';
import { vehicleHandle } from './vehicleHandle';
import { withinRadius } from './platformAlign';
import { basePartKey } from './basePartKey';

// Lift platform (PLAY mode): proximity/alignment (HANGAR) → lock + cinematic descent (PLATFORM_ALIGNMENT)
// → LAUNCH_PREPARATION. The descent reads as a real drop because a STATIC textured shaft (with bright
// light bands) stays put while the elevator car + vehicle + camera sink past it. The reused FollowCamera
// follows the vehicle down (BaseVehicle publishes its position); the car "rides" the vehicle via
// vehicleHandle. Warning ring pulses; gate floor-doors slide open; deep, accelerating drop.
const IN_RANGE = 3.6;
const ALIGNED = 1.9;
const AUTO_DWELL = 1.6; // s aligned before auto-locking (also press E)
const LIFT_DURATION = 5;
const LIFT_DEPTH = 12;
const SHAFT_BELOW = 4; // shaft extends this far past the platform's lowest point

const _trans = { x: 0, y: 0, z: 0 };
const easeInOut = (t: number) => t * t * (3 - 2 * t);

// One static shaft wall (module-level component so it isn't re-created during render).
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

// ── self-made textures (no external art) ──────────────────────────────────────
function makeHazardTexture(): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#caa53a';
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = '#1b1b1b';
  ctx.lineWidth = 16;
  for (let i = -128; i < 256; i += 40) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 128, 128);
    ctx.stroke();
  }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

function makeShaftTexture(): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#0c1018';
  ctx.fillRect(0, 0, 64, 256);
  // vertical ribs
  ctx.fillStyle = '#1a2130';
  ctx.fillRect(2, 0, 6, 256);
  ctx.fillRect(56, 0, 6, 256);
  // bright horizontal light band (glows via emissiveMap) — one per tile → many passing bands.
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
  const platformRef = useRef<Group>(null);
  const gateLeftRef = useRef<Group>(null);
  const gateRightRef = useRef<Group>(null);
  const ringMat = useRef<MeshStandardMaterial>(null);
  const elapsed = useRef(0);
  const dwell = useRef(0);
  const prevPhase = useRef<string>('');
  const confirm = useRef(false);

  const hazardTex = useMemo(() => makeHazardTexture(), []);
  const shaftTex = useMemo(() => {
    const t = makeShaftTexture();
    t.repeat.set(1, (LIFT_DEPTH + SHAFT_BELOW) / 2);
    return t;
  }, []);

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

  useFrame((state, dtRaw) => {
    if (!part) return;
    const dt = Math.min(dtRaw, 0.05);
    const cx = merged.position[0];
    const startY = merged.position[1];
    const cz = merged.position[2];
    const phase = useGameStore.getState().phase;
    const plat = platformRef.current;

    // Pulse the warning ring while locked/descending.
    if (ringMat.current) {
      const descending = useBaseRuntimeStore.getState().liftPhase === 'descending';
      ringMat.current.emissiveIntensity = descending ? 0.5 + Math.abs(Math.sin(state.clock.elapsedTime * 7)) * 1.4 : 0.7;
    }

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
      // Gate floor-doors slide apart early in the drop.
      const open = 2.4 + 2.6 * Math.min(1, e * 2);
      if (gateLeftRef.current) gateLeftRef.current.position.x = cx - open;
      if (gateRightRef.current) gateRightRef.current.position.x = cx + open;
      // Ride the vehicle down with the car (kinematic — set by BaseVehicle's locked type).
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

    // LAUNCH_PREPARATION and beyond — car rests at the bottom.
    if (plat) plat.position.y = startY - LIFT_DEPTH;
  });

  if (!part) return null;
  const [sx, sy, sz] = part.size;
  const cx = merged.position[0];
  const startY = merged.position[1];
  const cz = merged.position[2];
  const r = Math.max(sx, sz) / 2;
  const shaftHalf = r + 0.5;
  const shaftTop = 0.05;
  const shaftH = LIFT_DEPTH + SHAFT_BELOW;
  const shaftMidY = shaftTop - shaftH / 2;

  return (
    <group>
      {/* STATIC shaft below the platform — stays put while the car sinks past it (the drop you feel). */}
      <group position={[cx, 0, cz]}>
        <ShaftWall pos={[0, shaftMidY, -shaftHalf]} rot={[0, 0, 0]} half={shaftHalf} h={shaftH} tex={shaftTex} />
        <ShaftWall pos={[0, shaftMidY, shaftHalf]} rot={[0, Math.PI, 0]} half={shaftHalf} h={shaftH} tex={shaftTex} />
        <ShaftWall pos={[-shaftHalf, shaftMidY, 0]} rot={[0, Math.PI / 2, 0]} half={shaftHalf} h={shaftH} tex={shaftTex} />
        <ShaftWall pos={[shaftHalf, shaftMidY, 0]} rot={[0, -Math.PI / 2, 0]} half={shaftHalf} h={shaftH} tex={shaftTex} />
        {/* shaft floor (where the car lands) */}
        <mesh position={[0, shaftTop - shaftH, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[shaftHalf * 2, shaftHalf * 2]} />
          <meshStandardMaterial color="#0a0e15" />
        </mesh>
      </group>

      {/* Gate floor-doors around the shaft mouth. */}
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

      {/* The elevator CAR (animated in Y) — descends with the vehicle. */}
      <group ref={platformRef} position={[cx, startY, cz]}>
        {/* textured deck */}
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[r, r, sy, 40]} />
          <meshStandardMaterial map={hazardTex} metalness={0.2} roughness={0.7} />
        </mesh>
        {/* pulsing warning ring */}
        <mesh position={[0, sy / 2 + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[r - 0.12, 0.1, 12, 48]} />
          <meshStandardMaterial ref={ringMat} color="#ff7a2c" emissive="#ff5a1c" emissiveIntensity={0.7} />
        </mesh>
        {/* corner posts (the "car" frame, rides down with the deck) */}
        {([[-1, -1], [1, -1], [-1, 1], [1, 1]] as const).map(([ax, az], i) => (
          <mesh key={i} position={[ax * (r - 0.3), 1.0, az * (r - 0.3)]} castShadow>
            <boxGeometry args={[0.18, 2.0, 0.18]} />
            <meshStandardMaterial color="#8b93a6" metalness={0.5} roughness={0.4} />
          </mesh>
        ))}
      </group>
    </group>
  );
};
