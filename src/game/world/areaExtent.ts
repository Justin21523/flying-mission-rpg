import { getWorldArea } from '../../stores/editorWorldStore';
import { useEditorLayoutStore } from '../../stores/editorLayoutStore';
import { useEditorNpcStore } from '../../stores/editorNpcStore';
import { useEditorLandmarkStore } from '../../stores/editorLandmarkStore';
import { useSceneEditStore, addedForArea } from '../../stores/sceneEditStore';

// POLI — an area's EFFECTIVE playable half-extent. The transition boundary grows with placed content: it
// sits a margin BEYOND the farthest placed object (layout pieces, kit set-pieces, NPCs, landmarks), but never
// below the area's manual `size`. `autoExpand: false` keeps the manual size. So areas auto-resize as you add
// models, and each can differ. Cheap (a few array scans); call where the old getAreaSize was used.
export function getEffectiveAreaSize(areaId: string): number {
  const area = getWorldArea(areaId);
  const minSize = area?.size ?? 40;
  if (area?.autoExpand === false) return minSize;
  const margin = area?.sizeMargin ?? 10;

  let far = 0;
  const bump = (x: number, z: number) => { const m = Math.max(Math.abs(x), Math.abs(z)); if (m > far) far = m; };

  const lay = useEditorLayoutStore.getState();
  const presets = lay.presets[areaId];
  const active = presets?.find((p) => p.id === lay.activePresetId[areaId]) ?? presets?.[0];
  active?.pieces.forEach((p) => bump(p.position[0], p.position[2]));

  addedForArea(areaId, useSceneEditStore.getState().added).forEach((a) => bump(a.position[0], a.position[2]));
  useEditorNpcStore.getState().addedNpcs.forEach((n) => { if (n.areaId === areaId) bump(n.position[0], n.position[2]); });
  useEditorLandmarkStore.getState().landmarks.forEach((l) => { if (l.areaId === areaId) bump(l.position[0], l.position[2]); });

  return Math.max(minSize, far + margin);
}
