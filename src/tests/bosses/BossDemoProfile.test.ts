import { describe, expect, it } from 'vitest';
import { BOSS_DEMO_PROFILES } from '../../data/bosses/bossDemoProfiles';
import { SEED_BOSSES } from '../../data/bosses/bossDefinitions';
import { SEED_BOSS_PHASES } from '../../data/bosses/bossPhaseDefinitions';
import { SEED_BOSS_WEAKPOINTS } from '../../data/bosses/bossWeakpointDefinitions';
import { SEED_STAGES } from '../../data/campaigns/stageDefinitions';

describe('Boss demo profiles', () => {
  it('reference valid boss, stage, phases, weakpoints and attack hints', () => {
    const bosses = new Set(SEED_BOSSES.map((boss) => boss.id));
    const stages = new Set(SEED_STAGES.map((stage) => stage.id));
    const phases = new Set(SEED_BOSS_PHASES.map((phase) => phase.id));
    const weakpointPhaseIds = new Set(SEED_BOSS_WEAKPOINTS.flatMap((weakpoint) => weakpoint.activeInPhaseIds));
    const attackPatternTypes = new Set(BOSS_PATTERN_TYPES);

    for (const profile of BOSS_DEMO_PROFILES) {
      expect(bosses.has(profile.bossId)).toBe(true);
      expect(stages.has(profile.stageId)).toBe(true);
      expect(profile.phaseOrder.length).toBeGreaterThan(0);
      for (const phaseId of profile.phaseOrder) {
        expect(phases.has(phaseId)).toBe(true);
        expect(weakpointPhaseIds.has(phaseId) || profile.phaseHints.some((hint) => hint.phaseId === phaseId)).toBe(true);
      }
      for (const hint of profile.phaseHints) expect(profile.phaseOrder).toContain(hint.phaseId);
      for (const hint of profile.attackHints) expect(attackPatternTypes.has(hint.patternType)).toBe(true);
    }
  });
});
import { BOSS_PATTERN_TYPES } from '../../types/game/boss';
