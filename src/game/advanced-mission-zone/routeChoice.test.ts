import { describe, it, expect, beforeEach } from 'vitest';
import { transitionToNextSegment, chooseSegmentRoute } from './AdvancedMissionZoneDirector';
import { useAdvancedMissionZoneStore } from '../../stores/game/useAdvancedMissionZoneStore';
import { useEditorZoneSegmentStore } from '../../stores/game/editorZoneSegmentStore';
import type { ZoneSegmentDefinition } from '../../types/game/advancedMissionZone';

const seg = (id: string): ZoneSegmentDefinition => ({
  id, zoneId: 'z', name: id, order: 1, segmentType: 'exploration',
  entryConditions: [], completionConditions: [], nextSegmentIds: [], enabled: true,
});

beforeEach(() => {
  useAdvancedMissionZoneStore.getState().resetZone();
  useEditorZoneSegmentStore.getState().importState({ items: [seg('seg_a'), seg('seg_b')] });
});

describe('Wave 3 route choice', () => {
  it('does not auto-advance when more than one next segment is pending', () => {
    const store = useAdvancedMissionZoneStore.getState();
    store.setPendingNext(['seg_a', 'seg_b']);
    const before = useAdvancedMissionZoneStore.getState().activeSegmentId;
    transitionToNextSegment();
    expect(useAdvancedMissionZoneStore.getState().activeSegmentId).toBe(before); // stayed put
    expect(useAdvancedMissionZoneStore.getState().pendingNextSegmentIds).toEqual(['seg_a', 'seg_b']);
  });

  it('ignores a route id that was not offered', () => {
    useAdvancedMissionZoneStore.getState().setPendingNext(['seg_a', 'seg_b']);
    chooseSegmentRoute('seg_zzz');
    expect(useAdvancedMissionZoneStore.getState().pendingNextSegmentIds).toEqual(['seg_a', 'seg_b']);
  });

  it('collapses to the picked path and enters it', () => {
    useAdvancedMissionZoneStore.getState().setPendingNext(['seg_a', 'seg_b']);
    chooseSegmentRoute('seg_b');
    expect(useAdvancedMissionZoneStore.getState().activeSegmentId).toBe('seg_b');
  });
});
