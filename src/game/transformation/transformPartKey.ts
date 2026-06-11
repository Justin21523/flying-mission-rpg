import { objKey } from '../edit/sceneEditMerge';
import type { ModelSlot } from '../../types/game/transformation';

// sceneEditStore key for a transformation part anchor (area 'transform', kit 'structure' EditKind) — used by
// the edit-mode gizmo anchors + the ✨ Transform Parts sub-tab so drag and form edits stay in sync.
export const transformPartKey = (timelineId: string, partKey: string) => objKey('transform', 'structure', `${timelineId}__${partKey}`);

export const transformModelSlotKey = (timelineId: string, slot: ModelSlot) => objKey('transform', 'structure', `${timelineId}__model_slot__${slot}`);

export const transformStageModelKey = (timelineId: string, stageId: string) => objKey('transform', 'structure', `${timelineId}__stage_model__${stageId}`);

// Gizmo anchors for the virtual / time-series items (effect spawn points, model-move targets, camera shots).
export const transformEffectKey = (timelineId: string, fxId: string) => objKey('transform', 'structure', `${timelineId}__effect__${fxId}`);
export const transformStageMoveKey = (timelineId: string, stageId: string) => objKey('transform', 'structure', `${timelineId}__stage_move__${stageId}`);
export const transformCameraShotKey = (timelineId: string, shotId: string) => objKey('transform', 'structure', `${timelineId}__camera_shot__${shotId}`);
