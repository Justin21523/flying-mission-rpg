import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { usePlayerStore } from '../../stores/playerStore';
import { useEditorWorldStore, getAreaSize, getWorldArea } from '../../stores/editorWorldStore';
import { useTransitionStore } from '../../stores/transitionStore';
import { OPPOSITE_EDGE, type EdgeDir } from '../../types/world';

// POLI seam #1 — walk-between-areas. When the player crosses an area's edge that has a neighbour, fade +
// travel to that neighbour, arriving just inside its opposite edge. Edges without a neighbour get an
// invisible wall so the player can't leave the map. A faint frame shows the playable bounds (open edges
// glow green, walled edges red). Map size + edge links are editable in the 🗺 World tab.

const MARGIN = 3; // how far inside the arrival edge the player lands

// Arrival position just inside `edge` of an area of half-extent `size`. north=-z, south=+z, east=+x, west=-x.
function spawnAtEdge(edge: EdgeDir, size: number): { x: number; y: number; z: number } {
  const d = Math.max(2, size - MARGIN);
  switch (edge) {
    case 'east': return { x: d, y: 3, z: 0 };
    case 'west': return { x: -d, y: 3, z: 0 };
    case 'south': return { x: 0, y: 3, z: d };
    case 'north': return { x: 0, y: 3, z: -d };
  }
}

export const EdgeTransitionLayer = ({ areaId }: { areaId: string }) => {
  // Subscribe to areas so size/edge edits update the walls + frame live in Edit Mode.
  const areas = useEditorWorldStore((s) => s.areas);
  const area = areas.find((a) => a.id === areaId);
  const size = area?.size ?? 40;
  const edges = area?.edges ?? {};
  const firedRef = useRef(false);

  useFrame(() => {
    if (useTransitionStore.getState().covering) return;
    const pos = usePlayerStore.getState().position;
    if (!pos) return;
    let edge: EdgeDir | null = null;
    if (pos.x > size && edges.east) edge = 'east';
    else if (pos.x < -size && edges.west) edge = 'west';
    else if (pos.z > size && edges.south) edge = 'south';
    else if (pos.z < -size && edges.north) edge = 'north';
    if (!edge) { firedRef.current = false; return; }
    if (firedRef.current) return;
    firedRef.current = true;
    const neighbour = edges[edge]!;
    const spawn = spawnAtEdge(OPPOSITE_EDGE[edge], getAreaSize(neighbour));
    const go = () => usePlayerStore.getState().travelToArea(neighbour, spawn);
    if (useEditorWorldStore.getState().fadeEnabled) useTransitionStore.getState().begin(go, getWorldArea(neighbour)?.name ?? neighbour);
    else go();
  });

  // Invisible walls ONLY on closed edges (no visible boundary line — the player just can't leave there).
  // Open edges have no wall: walking off them triggers the transition above.
  const WALL_H = 8;
  const t = 1;
  const sides: { dir: EdgeDir; pos: [number, number, number]; horizontal: boolean }[] = [
    { dir: 'north', pos: [0, WALL_H / 2, -size], horizontal: true },
    { dir: 'south', pos: [0, WALL_H / 2, size], horizontal: true },
    { dir: 'east', pos: [size, WALL_H / 2, 0], horizontal: false },
    { dir: 'west', pos: [-size, WALL_H / 2, 0], horizontal: false },
  ];
  return (
    <>
      {sides.filter(({ dir }) => !edges[dir]).map(({ dir, pos, horizontal }) => (
        <RigidBody key={dir} type="fixed" colliders={false} position={pos}>
          <CuboidCollider args={horizontal ? [size, WALL_H / 2, t] : [t, WALL_H / 2, size]} />
        </RigidBody>
      ))}
    </>
  );
};
