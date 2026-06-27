import { describe, expect, it } from 'vitest';
import { deriveSkillPhases } from './skillToTimeline';
import type { CombatSkillDefinition } from '../../types/game/combat';

const baseSkill = (over: Partial<CombatSkillDefinition>): CombatSkillDefinition => ({
  id: 's1', name: 'S', skillType: 'basic', inputBinding: 'KeyJ', energyCost: 0, cooldownSeconds: 1,
  hitVolume: { id: 'hv', shape: 'sphere', origin: 'character-forward', activeDurationSeconds: 0.5 },
  targetRules: { validTargetTypes: ['enemy'] },
  ...over,
});

describe('deriveSkillPhases', () => {
  it('uses activeDelaySeconds for windup and stacks the active window', () => {
    const p = deriveSkillPhases(baseSkill({ hitVolume: { id: 'hv', shape: 'sphere', origin: 'character-forward', activeDelaySeconds: 0.3, activeDurationSeconds: 0.5 } }));
    expect(p.windupEnd).toBe(0.3);
    expect(p.activeEnd).toBeCloseTo(0.8);
    expect(p.damageStart).toBe(0.3);
    expect(p.total).toBeCloseTo(0.8);
  });

  it('falls back to castTimeSeconds for windup when no activeDelay', () => {
    const p = deriveSkillPhases(baseSkill({ castTimeSeconds: 0.4 }));
    expect(p.windupEnd).toBe(0.4);
    expect(p.activeEnd).toBeCloseTo(0.9);
  });

  it('extends total to cover durationSeconds and the latest event', () => {
    const p = deriveSkillPhases(baseSkill({
      durationSeconds: 1.2,
      timelineEvents: [
        { eventId: 'a', name: 'late', timeSeconds: 2.5, kind: 'sound', soundId: 'boost', enabled: true },
        { eventId: 'b', name: 'early', timeSeconds: 0.1, kind: 'effect', enabled: true },
      ],
    }));
    expect(p.total).toBeCloseTo(2.5); // latest event dominates
    expect(p.eventTimes).toEqual([0.1, 2.5]); // sorted
  });

  it('never returns a degenerate (zero) total', () => {
    const p = deriveSkillPhases(baseSkill({ hitVolume: { id: 'hv', shape: 'sphere', origin: 'character-forward', activeDurationSeconds: 0 } }));
    expect(p.total).toBeGreaterThanOrEqual(0.1);
  });
});
