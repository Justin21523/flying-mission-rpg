import { objKey } from '../edit/sceneEditMerge';

// sceneEditStore key for a base layout part (reuses the kit's 'structure' EditKind). Shared by the
// renderer, the lift platform, and the editor tab so all three agree on selection/override keys.
export const basePartKey = (id: string) => objKey('base', 'structure', id);
