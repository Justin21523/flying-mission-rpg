import { useSceneEditStore } from '../../stores/sceneEditStore';
import { useEditorNpcStore, getEditorNpc } from '../../stores/editorNpcStore';
import { useEditorLandmarkStore } from '../../stores/editorLandmarkStore';
import { useEditorPortalStore, getPortal } from '../../stores/editorPortalStore';
import { useEditorWorldStore } from '../../stores/editorWorldStore';
import { objKey, type Vec3 } from './sceneEditMerge';

// POLI — duplicate the current Edit-Mode selection. Set-pieces (GLB, assetId-backed) are cloned by the kit's
// sceneEditStore.duplicateSelected; store-backed POLI objects (NPC / landmark / map point / portal, all
// EditableObjects) are cloned here into their own stores via add+update, offset a couple of units. Each clone
// also copies the source's gizmo override (rotation + per-axis scale) so the copy is EXACTLY the same, and the
// whole copied batch ends up selected together (primary + extras) so you can move/edit it as one group.
const OFF = 2;

// Copy the source's gizmo override (offset position + same rotation + same per-axis scale) onto the new key,
// so the duplicate matches the original exactly.
function copyOverride(area: string, kind: Parameters<typeof objKey>[1], srcId: string, newId: string, baseSrcPos: Vec3): void {
  const st = useSceneEditStore.getState();
  const ov = st.overrides[objKey(area, kind, srcId)];
  const srcPos = ov?.position ?? baseSrcPos;
  st.setOverride(objKey(area, kind, newId), {
    position: [srcPos[0] + OFF, srcPos[1], srcPos[2] + OFF],
    rotation: ov?.rotation,
    scale: ov?.scale,
  });
}

function duplicatePoliSelection(): string[] {
  const s = useSceneEditStore.getState();
  const keys = [s.selectedKey, ...s.extraSelected.map((e) => e.key)].filter((k): k is string => !!k);
  const newKeys: string[] = [];
  for (const key of keys) {
    const [area, kind, id] = key.split('#');
    if (kind === 'npc') {
      const src = getEditorNpc(id);
      if (!src) continue;
      const { id: _i, areaId: _a, position: _p, dialogueTreeId: _d, ...rest } = src;
      void _i; void _a; void _p; void _d;
      const nid = useEditorNpcStore.getState().addNpc(area, [src.position[0] + OFF, src.position[1], src.position[2] + OFF]);
      useEditorNpcStore.getState().updateNpc(nid, rest);
      copyOverride(area, 'npc', id, nid, src.position);
      newKeys.push(objKey(area, 'npc', nid));
    } else if (kind === 'landmark') {
      // 'landmark' kind is shared by landmarks, map points and portals — resolve by looking up the id.
      const lm = useEditorLandmarkStore.getState().landmarks.find((l) => l.id === id);
      if (lm) {
        const nid = useEditorLandmarkStore.getState().addLandmark(area, [lm.position[0] + OFF, lm.position[1], lm.position[2] + OFF]);
        useEditorLandmarkStore.getState().updateLandmark(nid, { name: `${lm.name} copy`, modelAssetId: lm.modelAssetId });
        copyOverride(area, 'landmark', id, nid, lm.position);
        newKeys.push(objKey(area, 'landmark', nid));
        continue;
      }
      const portal = getPortal(id);
      if (portal) {
        const { id: _i, ...rest } = portal; void _i;
        const nid = useEditorPortalStore.getState().addPortal(area);
        useEditorPortalStore.getState().updatePortal(nid, { ...rest, name: `${portal.name} copy`, position: [portal.position[0] + OFF, portal.position[1], portal.position[2] + OFF] });
        copyOverride(area, 'landmark', id, nid, portal.position);
        newKeys.push(objKey(area, 'landmark', nid));
        continue;
      }
      const w = useEditorWorldStore.getState();
      const pt = w.areas.find((a) => a.id === area)?.points?.find((p) => p.id === id);
      if (pt) {
        const { id: _i, position: _p, ...rest } = pt; void _i; void _p;
        const nid = w.addPoint(area, pt.type);
        w.updatePoint(area, nid, { ...rest, name: `${pt.name} copy`, position: [pt.position[0] + OFF, pt.position[1], pt.position[2] + OFF] });
        copyOverride(area, 'landmark', id, nid, pt.position);
        newKeys.push(objKey(area, 'landmark', nid));
      }
    }
  }
  return newKeys;
}

// Duplicate EVERYTHING selected (POLI store objects + kit set-pieces), then select the whole copied batch so it
// moves / edits as one group.
export function duplicateAllSelected(): void {
  const poliKeys = duplicatePoliSelection();        // POLI first (reads selection before duplicateSelected clears it)
  useSceneEditStore.getState().duplicateSelected(); // set-pieces → sets pendingSelect/pendingExtra to its copies
  const st = useSceneEditStore.getState();
  const setpieceKeys = [st.pendingSelectKey, ...st.pendingExtraKeys].filter((k): k is string => !!k);
  const all = [...poliKeys, ...setpieceKeys];
  if (all.length > 0) {
    useSceneEditStore.setState({ pendingSelectKey: all[0], pendingExtraKeys: all.slice(1) });
  }
}
