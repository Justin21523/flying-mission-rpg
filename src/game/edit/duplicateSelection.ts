import { useSceneEditStore } from '../../stores/sceneEditStore';
import { useEditorNpcStore, getEditorNpc } from '../../stores/editorNpcStore';
import { useEditorLandmarkStore } from '../../stores/editorLandmarkStore';
import { useEditorPortalStore, getPortal } from '../../stores/editorPortalStore';
import { useEditorWorldStore } from '../../stores/editorWorldStore';

// POLI — duplicate the current Edit-Mode selection. Set-pieces (GLB, assetId-backed) are cloned by the kit's
// sceneEditStore.duplicateSelected; store-backed POLI objects (NPC / landmark / map point / portal, all
// EditableObjects) are cloned here into their own stores via add+update, offset a couple of units. Called
// together so a mixed batch copies in one action.
const OFF = 2;

function duplicatePoliSelection(): void {
  const s = useSceneEditStore.getState();
  const keys = [s.selectedKey, ...s.extraSelected.map((e) => e.key)].filter((k): k is string => !!k);
  for (const key of keys) {
    const [area, kind, id] = key.split('#');
    if (kind === 'npc') {
      const src = getEditorNpc(id);
      if (!src) continue;
      const { id: _i, areaId: _a, position: _p, dialogueTreeId: _d, ...rest } = src;
      void _i; void _a; void _p; void _d;
      const nid = useEditorNpcStore.getState().addNpc(area, [src.position[0] + OFF, src.position[1], src.position[2] + OFF]);
      useEditorNpcStore.getState().updateNpc(nid, rest);
    } else if (kind === 'landmark') {
      // 'landmark' kind is shared by landmarks, map points and portals — resolve by looking up the id.
      const lm = useEditorLandmarkStore.getState().landmarks.find((l) => l.id === id);
      if (lm) {
        const nid = useEditorLandmarkStore.getState().addLandmark(area, [lm.position[0] + OFF, lm.position[1], lm.position[2] + OFF]);
        useEditorLandmarkStore.getState().updateLandmark(nid, { name: `${lm.name} copy`, modelAssetId: lm.modelAssetId });
        continue;
      }
      const portal = getPortal(id);
      if (portal) {
        const { id: _i, ...rest } = portal; void _i;
        const nid = useEditorPortalStore.getState().addPortal(area);
        useEditorPortalStore.getState().updatePortal(nid, { ...rest, name: `${portal.name} copy`, position: [portal.position[0] + OFF, portal.position[1], portal.position[2] + OFF] });
        continue;
      }
      const w = useEditorWorldStore.getState();
      const pt = w.areas.find((a) => a.id === area)?.points?.find((p) => p.id === id);
      if (pt) {
        const { id: _i, position: _p, ...rest } = pt; void _i; void _p;
        const nid = w.addPoint(area, pt.type);
        w.updatePoint(area, nid, { ...rest, name: `${pt.name} copy`, position: [pt.position[0] + OFF, pt.position[1], pt.position[2] + OFF] });
      }
    }
  }
}

// Duplicate EVERYTHING selected (POLI store objects + kit set-pieces). POLI first (reads the selection before
// duplicateSelected clears it).
export function duplicateAllSelected(): void {
  duplicatePoliSelection();
  useSceneEditStore.getState().duplicateSelected();
}
