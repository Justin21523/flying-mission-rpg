import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { usePlayerStore } from '../../stores/playerStore';
import { useEditorWorldStore, getWorldArea } from '../../stores/editorWorldStore';
import { useEditorLayoutStore } from '../../stores/editorLayoutStore';
import { useTransitionStore } from '../../stores/transitionStore';
import { getEffectiveAreaSize } from './areaExtent';
import { OPPOSITE_EDGE, type EdgeDir } from '../../types/world';

// POLI seam #1 — walk-between-areas. When the player crosses an area's edge that has a neighbour, fade +
// travel to that neighbour, arriving just inside its opposite edge. The map is otherwise OPEN — there are NO
// invisible boundary walls; only connected edges do anything special (the transition). Map size + edge links
// are editable in the 🗺 World tab.

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
  // Subscribe to areas + layout presets so the boundary grows live as content is placed / edited.
  const areas = useEditorWorldStore((s) => s.areas);
  useEditorLayoutStore((s) => s.presets[areaId]);
  const area = areas.find((a) => a.id === areaId);
  const size = getEffectiveAreaSize(areaId);
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
    const spawn = spawnAtEdge(OPPOSITE_EDGE[edge], getEffectiveAreaSize(neighbour));
    const go = () => usePlayerStore.getState().travelToArea(neighbour, spawn);
    if (useEditorWorldStore.getState().fadeEnabled) useTransitionStore.getState().begin(go, getWorldArea(neighbour)?.name ?? neighbour);
    else go();
  });

  // No invisible boundary walls — the world is open. Only connected edges act (the transition above); every
  // other direction is free to roam. (This component is purely the edge-transition driver now.)
  return null;
};
