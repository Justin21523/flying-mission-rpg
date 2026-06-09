import { getWorldArea } from '../../stores/editorWorldStore';
import { useEditorLayoutStore } from '../../stores/editorLayoutStore';
import { useEditorNpcStore } from '../../stores/editorNpcStore';
import { useEditorLandmarkStore } from '../../stores/editorLandmarkStore';
import { useEditorPortalStore } from '../../stores/editorPortalStore';
import { useEditorIncidentStore } from '../../stores/editorIncidentStore';
import { useSceneEditStore, addedForArea } from '../../stores/sceneEditStore';
import { objKey } from '../edit/sceneEditMerge';

// POLI — an area's EFFECTIVE playable half-extent = the edge-transition boundary. It sits a margin BEYOND the
// farthest placed object so you always finish exploring before walking off into the connected neighbour. Counts
// EVERY placed thing (layout pieces, kit set-pieces, NPCs, landmarks, map points, portals, incident markers),
// using each object's live gizmo position (override ⊕ base). Never below the area's manual `size`;
// `autoExpand: false` keeps the manual size. Cheap (a few array scans).
// Smallest boundary when an area has little/no content, so an empty area isn't a claustrophobic box.
const MIN_EXTENT = 12;

export function getEffectiveAreaSize(areaId: string): number {
  const area = getWorldArea(areaId);
  if (area?.autoExpand === false) return area?.size ?? 40; // manual fixed size
  const margin = area?.sizeMargin ?? 28; // a clear gap past the farthest object before the boundary
  const overrides = useSceneEditStore.getState().overrides;

  let far = 0;
  const bump = (x: number, z: number) => { const m = Math.max(Math.abs(x), Math.abs(z)); if (m > far) far = m; };
  // Use the live gizmo position (sceneEditStore override) when present, else the stored base position.
  const bumpKeyed = (kind: Parameters<typeof objKey>[1], id: string, bx: number, bz: number) => {
    const ov = overrides[objKey(areaId, kind, id)]?.position;
    bump(ov ? ov[0] : bx, ov ? ov[2] : bz);
  };

  const lay = useEditorLayoutStore.getState();
  const presets = lay.presets[areaId];
  const active = presets?.find((p) => p.id === lay.activePresetId[areaId]) ?? presets?.[0];
  active?.pieces.forEach((p) => bumpKeyed('setpiece', `layout_${p.id}`, p.position[0], p.position[2]));

  addedForArea(areaId, useSceneEditStore.getState().added).forEach((a) => bump(a.position[0], a.position[2]));
  useEditorNpcStore.getState().addedNpcs.forEach((n) => { if (n.areaId === areaId) bumpKeyed('npc', n.id, n.position[0], n.position[2]); });
  useEditorLandmarkStore.getState().landmarks.forEach((l) => { if (l.areaId === areaId) bumpKeyed('landmark', l.id, l.position[0], l.position[2]); });
  (area?.points ?? []).forEach((pt) => bumpKeyed('landmark', pt.id, pt.position[0], pt.position[2]));
  useEditorPortalStore.getState().portals.forEach((p) => { if (p.areaId === areaId) bumpKeyed('landmark', p.id, p.position[0], p.position[2]); });
  useEditorIncidentStore.getState().incidents.forEach((i) => { if (i.spawnAreaId === areaId) bump(i.markerPosition[0], i.markerPosition[2]); });

  // Boundary = farthest placed object + a margin ("a bit past the edge object") — content-driven, not fixed.
  return Math.max(MIN_EXTENT, far + margin);
}
