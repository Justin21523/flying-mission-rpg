import { Suspense, useEffect, useRef } from 'react';
import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { useEditorWorldStore } from '../../stores/editorWorldStore';
import type { MapPoint } from '../../types/world';
import { MAP_POINT_COLOR, MAP_POINT_ICON } from '../../types/world';
import { useUiStore } from '../../stores/uiStore';
import { usePlayerStore } from '../../stores/playerStore';
import { useMergedTransform, useIsDeleted } from '../../stores/sceneEditStore';
import { objKey } from '../edit/sceneEditMerge';
import { EditableObject } from '../edit/EditableObject';
import { markEditHelper } from '../edit/markEditHelper';
import { SceneGlbModel } from './SceneGlbModel';

// POLI — per-area named map points (POI / spawn / teleport / objective / vendor / danger). Edit Mode: each is
// an EditableObject (gizmo moves it, numbers follow in the 🗺 World tab). Play Mode: a coloured marker (or its
// GLB) with a floating icon + name; teleport points warp the player on proximity. Plotted on the radar + map.
// Authored in the 🗺 World tab (editorWorldStore points[]).
export const MapPointLayer = ({ areaId }: { areaId: string }) => {
  const areas = useEditorWorldStore((s) => s.areas);
  const here = areas.find((a) => a.id === areaId)?.points ?? [];
  if (here.length === 0) return null;
  return <>{here.map((p) => <MapPointEntity key={p.id} areaId={areaId} pt={p} />)}</>;
};

// Decorative bits (flat ring + floating label) are excluded from raycasting so they never occlude the
// Edit-Mode gizmo handles; the solid octahedron + EditableObject's grab box remain clickable for selection.
const NO_RAYCAST = () => null;

const Marker = ({ color }: { color: string }) => (
  <group>
    <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={NO_RAYCAST}>
      <ringGeometry args={[0.7, 1.0, 24]} />
      <meshBasicMaterial color={color} transparent opacity={0.5} />
    </mesh>
    <mesh castShadow position={[0, 1.0, 0]}>
      <octahedronGeometry args={[0.45, 0]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} roughness={0.4} />
    </mesh>
  </group>
);

const MapPointVisual = ({ pt }: { pt: MapPoint }) => {
  const color = pt.color || MAP_POINT_COLOR[pt.type];
  return (
    <>
      {pt.modelAssetId
        ? <Suspense fallback={<Marker color={color} />}><SceneGlbModel assetId={pt.modelAssetId} /></Suspense>
        : <Marker color={color} />}
      <Text ref={markEditHelper} raycast={NO_RAYCAST} position={[0, 2.0, 0]} fontSize={0.4} color="#e2e8f0" anchorX="center" anchorY="middle" outlineWidth={0.035} outlineColor="#000" renderOrder={1}>
        {`${MAP_POINT_ICON[pt.type]} ${pt.name}`}
      </Text>
    </>
  );
};

const MapPointEntity = ({ areaId, pt }: { areaId: string; pt: MapPoint }) => {
  const editMode = useUiStore((s) => s.editMode);
  const key = objKey(areaId, 'landmark', pt.id);
  const base = { position: pt.position, rotation: [0, 0, 0] as [number, number, number], scale: 1 };
  const m = useMergedTransform(key, base);
  const deleted = useIsDeleted(key);
  if (deleted) return null; // Edit-Mode Delete (kit soft-delete) hides it

  if (editMode) {
    return <EditableObject objKey={key} base={base}><MapPointVisual pt={pt} /></EditableObject>;
  }
  if (pt.type === 'teleport') {
    return <TeleportPoint pt={pt} pos={m.position} />;
  }
  return (
    <group position={m.position} rotation={m.rotation} scale={m.scale}>
      <MapPointVisual pt={pt} />
    </group>
  );
};

// Play Mode teleport — the player must press [E] while in range (no auto-trigger). Shows an "[E] Teleport"
// prompt when nearby. No per-frame allocation.
const TeleportPoint = ({ pt, pos }: { pt: MapPoint; pos: [number, number, number] }) => {
  const inRange = useRef(false);
  const promptRef = useRef<Group>(null);
  const r = pt.radius ?? 2;
  useFrame(() => {
    const pp = usePlayerStore.getState().position;
    if (!pp) return;
    const within = Math.hypot(pp.x - pos[0], pp.z - pos[2]) < r;
    inRange.current = within;
    if (promptRef.current) promptRef.current.visible = within;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'KeyE' || e.repeat || !inRange.current) return;
      const tag = (document.activeElement?.tagName ?? '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      const dest = resolveTeleportTarget(pt);
      if (dest) {
        if (dest.areaId) usePlayerStore.getState().travelToArea(dest.areaId, dest.pos);
        else usePlayerStore.getState().requestSpawn(dest.pos);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pt]);
  return (
    <group position={pos}>
      <MapPointVisual pt={pt} />
      <group ref={promptRef} visible={false}>
        <Text raycast={() => null} position={[0, 0.5, 0]} fontSize={0.3} color="#c4b5fd" anchorX="center" anchorY="middle" outlineWidth={0.025} outlineColor="#000" renderOrder={2}>[E] Teleport</Text>
      </group>
    </group>
  );
};

// Resolve a teleport's destination position (and area, when cross-area). Falls back to the area's spawn point.
function resolveTeleportTarget(pt: MapPoint): { areaId?: string; pos: { x: number; y: number; z: number } } | null {
  const cur = usePlayerStore.getState().currentAreaId;
  const targetAreaId = pt.targetAreaId && pt.targetAreaId !== cur ? pt.targetAreaId : undefined;
  const lookupArea = pt.targetAreaId || cur;
  const area = useEditorWorldStore.getState().areas.find((a) => a.id === lookupArea);
  let pos: { x: number; y: number; z: number } | null = null;
  if (pt.targetPointId) {
    const tp = area?.points?.find((p) => p.id === pt.targetPointId);
    if (tp) pos = { x: tp.position[0], y: tp.position[1] + 1, z: tp.position[2] };
  }
  if (!pos) {
    const sp = area?.spawnPoint;
    pos = sp ? { x: sp.x, y: sp.y, z: sp.z } : { x: 0, y: 3, z: 0 };
  }
  return { areaId: targetAreaId, pos };
}
