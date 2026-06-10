import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import type { Group, MeshBasicMaterial } from 'three';
import { subscribeGameEvent, type GameEvent } from '../collision/gameEventBus';
import { usePlayerStore } from '../../stores/playerStore';

// POLI (Phase C) — guaranteed visible feedback for collision reactions. Subscribes to the game-event bus and
// pops a brief floating label + sphere at the reaction's anchor, so every classified collision shows a
// distinct, readable result even when the placeholder player model lacks the named reaction clip. Bounded to a
// handful of concurrent pops (oldest dropped); each pop animates + removes itself. Sibling in AreaRenderer.
const MAX_POPS = 6;
const LIFE = 1.2; // seconds

interface Pop { key: number; label: string; color: string; x: number; y: number; z: number }

const COLOR: Record<GameEvent['kind'], string> = {
  reaction: '#fbbf24', gameEvent: '#38bdf8', changeState: '#f472b6', npcReaction: '#34d399', spawnEffect: '#a855f7',
};

const ReactionPop = ({ pop }: { pop: Pop }) => {
  const ref = useRef<Group>(null);
  const matRef = useRef<MeshBasicMaterial>(null);
  const born = useRef(0);
  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    const t = performance.now() / 1000;
    if (born.current === 0) born.current = t; // set on first frame (purity: not in render)
    const k = (t - born.current) / LIFE; // 0..1
    g.position.y = pop.y + 1.2 + k * 1.4;     // rise
    const s = 0.6 + k * 0.6; g.scale.set(s, s, s);
    if (matRef.current) matRef.current.opacity = Math.max(0, 1 - k);
  });
  return (
    <group ref={ref} position={[pop.x, pop.y + 1.2, pop.z]}>
      <mesh raycast={() => null}>
        <sphereGeometry args={[0.22, 12, 10]} />
        <meshBasicMaterial ref={matRef} color={pop.color} transparent opacity={1} depthWrite={false} />
      </mesh>
      <Text position={[0, 0.5, 0]} fontSize={0.34} color={pop.color} anchorX="center" anchorY="middle" outlineWidth={0.03} outlineColor="#000" raycast={() => null}>
        {pop.label}
      </Text>
    </group>
  );
};

export const CollisionReactionFx = () => {
  const [pops, setPops] = useState<Pop[]>([]);
  const nextKey = useRef(0);

  useEffect(() => {
    return subscribeGameEvent((e) => {
      // Only surface player-facing reactions/effects (skip low-level sound fallbacks).
      if (e.kind === 'gameEvent' && e.payload.startsWith('sound:')) return;
      const pp = usePlayerStore.getState().position;
      const key = nextKey.current++;
      const pop: Pop = {
        key,
        label: e.payload,
        color: COLOR[e.kind] ?? '#e2e8f0',
        x: e.x ?? pp?.x ?? 0,
        y: e.y ?? pp?.y ?? 0,
        z: e.z ?? pp?.z ?? 0,
      };
      setPops((cur) => [...cur, pop].slice(-MAX_POPS));
      window.setTimeout(() => setPops((cur) => cur.filter((p) => p.key !== key)), LIFE * 1000);
    });
  }, []);

  if (pops.length === 0) return null;
  return <>{pops.map((p) => <ReactionPop key={p.key} pop={p} />)}</>;
};
