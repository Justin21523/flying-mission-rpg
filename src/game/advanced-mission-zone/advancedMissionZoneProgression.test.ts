import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../../stores/game/useGameStore';
import { useAdvancedMissionZoneStore } from '../../stores/game/useAdvancedMissionZoneStore';
import { useEditorMissionZoneStore } from '../../stores/game/editorMissionZoneStore';
import { useEditorZoneSegmentStore } from '../../stores/game/editorZoneSegmentStore';
import { SEED_MISSION_ZONES, SEED_ZONE_SEGMENTS } from '../../data/game/advancedMissionZones';
import {
  startMissionZone,
  beginFirstSegment,
  completeCurrentSegment,
  transitionToNextSegment,
  debugCompleteCurrentSegment,
  debugJumpToSegment,
} from './AdvancedMissionZoneDirector';

const ZONE_ID = 'zone_sunny_harbor_advanced_foundation';

beforeEach(() => {
  // Make the seed zone + segments available to the director (editor stores read from these collections).
  useEditorMissionZoneStore.getState().importState({ items: SEED_MISSION_ZONES });
  useEditorZoneSegmentStore.getState().importState({ items: SEED_ZONE_SEGMENTS });
  useAdvancedMissionZoneStore.getState().resetZone();
  useGameStore.getState().reset();
});

describe('Advanced Mission Zone progression', () => {
  it('startMissionZone activates the zone at its start segment', () => {
    expect(startMissionZone(ZONE_ID)).toBe(true);
    const s = useAdvancedMissionZoneStore.getState();
    expect(s.activeZoneId).toBe(ZONE_ID);
    expect(s.activeSegmentId).toBe('seg_landing_dock');
    expect(s.missionZoneStatus).toBe('active');
  });

  it('returns false for an unknown zone', () => {
    expect(startMissionZone('does_not_exist')).toBe(false);
  });

  it('completing a segment unlocks the next and advances on transition', () => {
    useGameStore.getState().jumpTo('ADVANCED_MISSION_ZONE');
    startMissionZone(ZONE_ID);
    beginFirstSegment();
    expect(useGameStore.getState().phase).toBe('ZONE_SEGMENT_GAMEPLAY');

    completeCurrentSegment();
    const s = useAdvancedMissionZoneStore.getState();
    expect(s.completedSegmentIds).toContain('seg_landing_dock');
    expect(s.unlockedSegmentIds).toContain('seg_cargo_street');
    expect(useGameStore.getState().phase).toBe('ZONE_COMPLETE');

    transitionToNextSegment();
    expect(useAdvancedMissionZoneStore.getState().activeSegmentId).toBe('seg_cargo_street');
    expect(useGameStore.getState().phase).toBe('ZONE_SEGMENT_GAMEPLAY');
  });

  it('completing the final segment finishes the zone and goes to MISSION_COMPLETE', () => {
    useGameStore.getState().jumpTo('ADVANCED_MISSION_ZONE');
    startMissionZone(ZONE_ID);
    beginFirstSegment();
    // Walk all five segments via debug-complete + advance.
    for (let i = 0; i < SEED_ZONE_SEGMENTS.length; i++) {
      completeCurrentSegment();
      transitionToNextSegment();
    }
    expect(useAdvancedMissionZoneStore.getState().missionZoneStatus).toBe('complete');
    expect(useGameStore.getState().phase).toBe('MISSION_COMPLETE');
  });

  it('debugCompleteCurrentSegment only works in ZONE_SEGMENT_GAMEPLAY', () => {
    useGameStore.getState().jumpTo('ADVANCED_MISSION_ZONE');
    startMissionZone(ZONE_ID);
    beginFirstSegment();
    debugCompleteCurrentSegment();
    expect(useAdvancedMissionZoneStore.getState().completedSegmentIds).toContain('seg_landing_dock');
  });

  it('debugJumpToSegment only jumps to a segment of the active zone', () => {
    useGameStore.getState().jumpTo('ADVANCED_MISSION_ZONE');
    startMissionZone(ZONE_ID);
    beginFirstSegment();
    debugJumpToSegment('seg_repair_plaza');
    expect(useAdvancedMissionZoneStore.getState().activeSegmentId).toBe('seg_repair_plaza');
    // A foreign segment id is ignored.
    debugJumpToSegment('seg_not_in_zone');
    expect(useAdvancedMissionZoneStore.getState().activeSegmentId).toBe('seg_repair_plaza');
  });
});
