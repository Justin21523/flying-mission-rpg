import { objKey } from '../edit/sceneEditMerge';

// sceneEditStore key for an exterior part (kit 'structure' EditKind, 'exterior' area). Shared by the
// renderer + editor tab so selection/override keys agree.
export const exteriorPartKey = (id: string) => objKey('exterior', 'structure', id);
