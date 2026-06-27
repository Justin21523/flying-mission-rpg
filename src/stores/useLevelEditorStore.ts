import { nanoid } from 'nanoid';
import { createEditorCollection } from './game/createEditorCollection';
import type { LevelLayoutDefinition, LevelSegmentDefinition } from '../types/levelTypes';
import { SEED_LEVEL_LAYOUTS } from '../data/levels/levelLayouts';
import { SEED_LEVEL_SEGMENTS } from '../data/levels/levelSegments';

export const useLevelLayoutStore = createEditorCollection<LevelLayoutDefinition>({
  storageKey: 'aero-rescue-editor-level-layouts-v1',
  seed: SEED_LEVEL_LAYOUTS,
  makeId: () => `layout_${nanoid(6)}`,
});

export const useLevelSegmentStore = createEditorCollection<LevelSegmentDefinition>({
  storageKey: 'aero-rescue-editor-level-segments-v1',
  seed: SEED_LEVEL_SEGMENTS,
  makeId: () => `level_seg_${nanoid(6)}`,
});

export function getLevelLayout(id: string): LevelLayoutDefinition | undefined {
  return useLevelLayoutStore.getState().items.find((layout) => layout.id === id);
}

export function getLevelLayouts(): LevelLayoutDefinition[] {
  return useLevelLayoutStore.getState().items;
}

export function getLevelSegmentsForLayout(layoutId: string): LevelSegmentDefinition[] {
  return useLevelSegmentStore.getState().items
    .filter((segment) => segment.layoutId === layoutId)
    .sort((a, b) => a.order - b.order);
}
