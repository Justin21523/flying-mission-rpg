import { objKey } from '../edit/sceneEditMerge';
import type { ModelSlot } from '../../types/game/transformation';

// sceneEditStore key for a transformation part anchor (area 'transform', kit 'structure' EditKind) — used by
// the edit-mode gizmo anchors + the ✨ Transform Parts sub-tab so drag and form edits stay in sync.
export const transformPartKey = (timelineId: string, partKey: string) => objKey('transform', 'structure', `${timelineId}__${partKey}`);

export const transformModelSlotKey = (timelineId: string, slot: ModelSlot) => objKey('transform', 'structure', `${timelineId}__model_slot__${slot}`);

export const transformStageModelKey = (timelineId: string, stageId: string) => objKey('transform', 'structure', `${timelineId}__stage_model__${stageId}`);
