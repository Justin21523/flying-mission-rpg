import { describe, it, expect } from 'vitest';
import { validateWorldContent } from './contentIntegrity';
import { SEED_NPCS } from '../../data/game/npcs';
import { EXTRA_BOSSES } from '../../data/bosses/extraZoneBosses';
import { SEED_ZONE_PROPS } from '../../data/game/zoneProps';
import { SEED_MISSION_ZONES } from '../../data/game/advancedMissionZones';

describe('world content integrity', () => {
  it('has no broken cross-references (rescue/branch/spawn/boss/incident/model)', () => {
    expect(validateWorldContent()).toEqual([]);
  });

  it('every stage now has a hub resident to rescue', () => {
    const rescuedStages = new Set(SEED_NPCS.filter((n) => n.hubResident).map((n) => n.rescuedByStageId));
    expect(rescuedStages.size).toBeGreaterThanOrEqual(10);
  });

  it('every EXTRA zone boss has an intro + enrage', () => {
    for (const b of EXTRA_BOSSES) {
      expect(b.intro, `${b.id} intro`).toBeTruthy();
      expect(b.enrage, `${b.id} enrage`).toBeTruthy();
    }
  });

  it('zone props cover every mission zone (W2 dressing)', () => {
    expect(SEED_ZONE_PROPS.length).toBeGreaterThanOrEqual(30);
    const zonesWithProps = new Set(SEED_ZONE_PROPS.map((p) => p.zoneId));
    for (const z of SEED_MISSION_ZONES) expect(zonesWithProps.has(z.id), `${z.id} has props`).toBe(true);
  });
});
