import { Suspense, useEffect, useRef } from 'react';
import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { useEditorPortalStore, getPortal, getPortals } from '../../stores/editorPortalStore';
import type { PortalDef } from '../../types/portal';
import { useUiStore } from '../../stores/uiStore';
import { usePlayerStore } from '../../stores/playerStore';
import { useInventoryStore } from '../../stores/inventoryStore';
import { useFlagStore } from '../../stores/flagStore';
import { getWorldArea } from '../../stores/editorWorldStore';
import { useMergedTransform, useIsDeleted, useSceneEditStore } from '../../stores/sceneEditStore';
import { arrivalNearBoundary } from './boundaryArrival';
import { objKey } from '../edit/sceneEditMerge';
import { EditableObject } from '../edit/EditableObject';
import { SceneGlbModel } from './SceneGlbModel';
import { markEditHelper } from '../edit/markEditHelper';
import { playSfx } from '../audio/sfx';

// POLI — portals/doors authored in the 🚪 Portals tab. Edit Mode: each is an EditableObject (gizmo-movable;
// numbers follow in the tab). Play Mode: a glowing arch (or its GLB) that travels the player to the target
// area — proximity (walk in) or interact ([E]) — when open. Locked portals show 🔒 and won't fire until their
// item/flag requirement is met. Self-contained (no kit-core interaction edits).

type Vec3 = { x: number; y: number; z: number };

// Decorative bits (label / glow plane) are excluded from raycasting so they never occlude the gizmo handles.
const NO_RAYCAST = () => null;

// Is the portal currently passable? Item/flag requirements gate it when present; otherwise `locked` decides.
function isPortalOpen(p: PortalDef): boolean {
  const gated = !!p.requiresItemId || !!p.requiresFlag;
  if (gated) {
    const item = !p.requiresItemId || useInventoryStore.getState().hasItem(p.requiresItemId);
    const flag = !p.requiresFlag || useFlagStore.getState().hasFlag(p.requiresFlag);
    return item && flag;
  }
  return !p.locked;
}

// A portal's LIVE position = its gizmo override (where you dragged it) ⊕ its stored base position. The arrival
// must use this so you come out at the door's CURRENT spot, not where it was originally authored.
function portalPos(q: PortalDef): [number, number, number] {
  const ov = useSceneEditStore.getState().overrides[objKey(q.areaId, 'landmark', q.id)]?.position;
  return (ov ?? q.position) as [number, number, number];
}

// Arrive standing just OUTSIDE a portal's trigger radius, in front of it (so you don't instantly re-trigger).
function inFrontOf(q: PortalDef): Vec3 {
  const f = q.rotation ?? 0;
  const offset = (q.radius ?? 2.5) + 1.5;
  const [px, py, pz] = portalPos(q);
  return { x: px + Math.sin(f) * offset, y: py + 1, z: pz + Math.cos(f) * offset };
}

// Resolve where this portal drops the player: explicit map point / paired portal / spawn → else the RECIPROCAL
// door (a portal in the target area that leads back here) → else the target area's spawn point.
function resolveDest(p: PortalDef): { areaId: string; spawn: Vec3 } {
  if (p.targetPointId) {
    const pt = getWorldArea(p.targetAreaId)?.points?.find((x) => x.id === p.targetPointId);
    if (pt) {
      const ov = useSceneEditStore.getState().overrides[objKey(p.targetAreaId, 'landmark', pt.id)]?.position;
      const [x, y, z] = (ov ?? pt.position) as [number, number, number];
      return { areaId: p.targetAreaId, spawn: { x, y: y + 1, z } };
    }
  }
  if (p.targetPortalId) {
    const tp = getPortal(p.targetPortalId);
    if (tp) return { areaId: p.targetAreaId, spawn: inFrontOf(tp) };
  }
  if (p.targetSpawn) return { areaId: p.targetAreaId, spawn: { x: p.targetSpawn[0], y: p.targetSpawn[1] + 1, z: p.targetSpawn[2] } };
  // Auto-pair: come out at a door on the other side. Prefer the one that points back here (true pair); else
  // ANY door in the target area — so you always exit beside a door, never dumped at the area centre.
  const inTarget = getPortals().filter((q) => q.areaId === p.targetAreaId && q.id !== p.id);
  const door = inTarget.find((q) => q.targetAreaId === p.areaId) ?? inTarget[0];
  if (door) return { areaId: p.targetAreaId, spawn: inFrontOf(door) };
  // No paired door at all → arrive in the OPEN near a boundary edge, not the centre (where set-pieces block /
  // hide you). Prefer the target edge that links back to this area (you walk in from there); else south.
  return { areaId: p.targetAreaId, spawn: arrivalNearBoundary(p.targetAreaId, p.areaId) };
}

function travel(p: PortalDef): void {
  const dest = resolveDest(p);
  playSfx('ui');
  if (dest.areaId !== usePlayerStore.getState().currentAreaId) usePlayerStore.getState().travelToArea(dest.areaId, dest.spawn);
  else usePlayerStore.getState().requestSpawn(dest.spawn);
}

const PortalVisual = ({ portal, open }: { portal: PortalDef; open: boolean }) => {
  const color = open ? (portal.color || '#f97316') : '#6b7280';
  return (
    <>
      {portal.modelAssetId
        ? <Suspense fallback={null}><SceneGlbModel assetId={portal.modelAssetId} /></Suspense>
        : (
          <group>
            {/* simple glowing arch (two posts + lintel) */}
            {[[-1.1, 0], [1.1, 0]].map(([x], i) => (
              <mesh key={i} position={[x, 1.4, 0]} castShadow>
                <boxGeometry args={[0.35, 2.8, 0.35]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={open ? 0.5 : 0.1} />
              </mesh>
            ))}
            <mesh position={[0, 2.9, 0]} castShadow>
              <boxGeometry args={[2.6, 0.4, 0.35]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={open ? 0.5 : 0.1} />
            </mesh>
            <mesh position={[0, 1.4, 0]} raycast={NO_RAYCAST}>
              <planeGeometry args={[1.8, 2.6]} />
              <meshBasicMaterial color={color} transparent opacity={open ? 0.32 : 0.12} side={2} />
            </mesh>
          </group>
        )}
      <Text ref={markEditHelper} raycast={NO_RAYCAST} position={[0, 3.4, 0]} fontSize={0.4} color={open ? '#fed7aa' : '#9ca3af'} anchorX="center" anchorY="middle" outlineWidth={0.03} outlineColor="#000" renderOrder={1}>
        {`${open ? (portal.interior ? '🚪 ' : '➜ ') : '🔒 '}${portal.name}`}
      </Text>
    </>
  );
};

// Play-Mode portal: proximity auto-travel or [E] interact, with a re-arm guard so it fires once per approach.
const ActivePortal = ({ portal, pos }: { portal: PortalDef; pos: [number, number, number] }) => {
  const inRange = useRef(false);
  // Start DISARMED so arriving in front of a portal (e.g. a paired return door) doesn't instantly re-trigger.
  // Proximity portals arm once the player steps outside the radius, then fire on the next entry.
  const armed = useRef(false);
  const promptRef = useRef<Group>(null);
  const r = portal.radius ?? 2.5;

  useFrame(() => {
    const ps = usePlayerStore.getState();
    const pp = ps.position;
    if (!pp) return;
    const d = Math.hypot(pp.x - pos[0], pp.z - pos[2]);
    const within = d < r;
    const open = isPortalOpen(portal);
    const guarded = Date.now() < ps.travelGuardUntil; // just teleported → don't fire / prompt yet
    inRange.current = within && open && !guarded;
    if (promptRef.current) promptRef.current.visible = portal.activation === 'interact' && within && open && !guarded;
    if (d > r + 1.2) armed.current = true; // armed once the player is clear of the portal
    if (portal.activation === 'proximity' && armed.current && within && open && !guarded) { armed.current = false; travel(portal); }
  });

  // Interact ([E]) — travel when the player is in range of an open portal (keypress is the gate; no loop risk).
  useEffect(() => {
    if (portal.activation !== 'interact') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'KeyE' || e.repeat) return;
      const tag = (document.activeElement?.tagName ?? '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (inRange.current) travel(portal);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [portal]);

  return (
    <group position={pos} rotation={[0, portal.rotation ?? 0, 0]}>
      <PortalVisual portal={portal} open={isPortalOpen(portal)} />
      <group ref={promptRef} visible={false}>
        <Text position={[0, 0.4, 0]} fontSize={0.3} color="#fdba74" anchorX="center" anchorY="middle" outlineWidth={0.025} outlineColor="#000" renderOrder={2}>[E] Enter</Text>
      </group>
    </group>
  );
};

const PortalEntity = ({ portal }: { portal: PortalDef }) => {
  const editMode = useUiStore((s) => s.editMode);
  const key = objKey(portal.areaId, 'landmark', portal.id);
  const base = { position: portal.position, rotation: [0, portal.rotation ?? 0, 0] as [number, number, number], scale: 1 };
  const m = useMergedTransform(key, base);
  const deleted = useIsDeleted(key);
  if (deleted) return null; // Edit-Mode Delete (kit soft-delete) hides it

  if (editMode) {
    return <EditableObject objKey={key} base={base}><PortalVisual portal={portal} open /></EditableObject>;
  }
  return <ActivePortal portal={portal} pos={m.position} />;
};

export const PortalLayer = ({ areaId }: { areaId: string }) => {
  const portals = useEditorPortalStore((s) => s.portals).filter((p) => p.areaId === areaId);
  if (portals.length === 0) return null;
  return <>{portals.map((p) => <PortalEntity key={p.id} portal={p} />)}</>;
};
