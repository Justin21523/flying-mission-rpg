import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorMissionZoneStore, getMissionZoneForLocation } from './editorMissionZoneStore';
import { useEditorZoneSegmentStore, getSegmentsForZone } from './editorZoneSegmentStore';
import { SEED_MISSION_ZONES } from '../../data/game/advancedMissionZones';

beforeEach(() => {
  useEditorMissionZoneStore.getState().reset();
  useEditorZoneSegmentStore.getState().reset();
});

describe('editorMissionZoneStore', () => {
  it('seed-merge is idempotent', () => {
    const s = useEditorMissionZoneStore.getState();
    s.mergeMissingFromSeed();
    const count = useEditorMissionZoneStore.getState().items.length;
    expect(count).toBe(SEED_MISSION_ZONES.length);
    useEditorMissionZoneStore.getState().mergeMissingFromSeed();
    expect(useEditorMissionZoneStore.getState().items.length).toBe(count);
  });

  it('create / update / duplicate / remove a zone', () => {
    const s = useEditorMissionZoneStore.getState();
    s.upsert({ id: 'mz_test', locationId: 'loc_x', name: 'Z', segmentIds: [], startSegmentId: '', finalSegmentIds: [], zoneMode: 'linear', allowBacktracking: false, enabled: true });
    expect(useEditorMissionZoneStore.getState().items.find((z) => z.id === 'mz_test')?.name).toBe('Z');

    useEditorMissionZoneStore.getState().update('mz_test', { name: 'Renamed' });
    expect(useEditorMissionZoneStore.getState().items.find((z) => z.id === 'mz_test')?.name).toBe('Renamed');

    const dupId = useEditorMissionZoneStore.getState().duplicate('mz_test');
    expect(dupId).toBeTruthy();
    expect(useEditorMissionZoneStore.getState().items).toHaveLength(2);

    useEditorMissionZoneStore.getState().remove('mz_test');
    expect(useEditorMissionZoneStore.getState().items.find((z) => z.id === 'mz_test')).toBeUndefined();
  });

  it('getMissionZoneForLocation only returns an enabled zone for the location', () => {
    useEditorMissionZoneStore.getState().mergeMissingFromSeed();
    expect(getMissionZoneForLocation('loc_sunnyharbor')?.id).toBe('zone_sunny_harbor_advanced_foundation');
    expect(getMissionZoneForLocation('loc_nowhere')).toBeUndefined();
    expect(getMissionZoneForLocation(null)).toBeUndefined();
  });

  it('getSegmentsForZone returns segments in authored order', () => {
    const s = useEditorZoneSegmentStore.getState();
    s.upsert({ id: 'b', zoneId: 'z', name: 'B', order: 2, segmentType: 'exploration', entryConditions: [], completionConditions: [{ id: 'c', type: 'debug-complete' }], nextSegmentIds: [], markers: [], enabled: true });
    s.upsert({ id: 'a', zoneId: 'z', name: 'A', order: 1, segmentType: 'exploration', entryConditions: [], completionConditions: [{ id: 'c', type: 'debug-complete' }], nextSegmentIds: [], markers: [], enabled: true });
    expect(getSegmentsForZone('z').map((x) => x.id)).toEqual(['a', 'b']);
  });
});
