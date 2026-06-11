import { objKey } from '../edit/sceneEditMerge';

// sceneEditStore key for a transformation part anchor (area 'transform', kit 'structure' EditKind) — used by
// the edit-mode gizmo anchors + the ✨ Transform Parts sub-tab so drag and form edits stay in sync.
export const transformPartKey = (timelineId: string, partKey: string) => objKey('transform', 'structure', `${timelineId}__${partKey}`);
