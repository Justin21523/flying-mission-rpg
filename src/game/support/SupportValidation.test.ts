import { describe, expect, it } from 'vitest';
import { SEED_SUPPORT_AI_PROFILES, SEED_SUPPORT_PROFILES, DEFAULT_MULTI_CHARACTER_LIMITS } from '../../data/game/support';
import { validateLimitConfig, validateSupportAiProfile, validateSupportProfile } from './SupportValidation';

const ctx = {
  characterIds: new Set(['char_jett', 'char_paul', 'char_donnie']),
  aiProfileIds: new Set(SEED_SUPPORT_AI_PROFILES.map((p) => p.id)),
  objectiveTypes: new Set(['find', 'reach', 'talk', 'carry', 'activate']),
};

describe('support validation', () => {
  it('accepts a valid support profile', () => {
    expect(validateSupportProfile(SEED_SUPPORT_PROFILES[0], ctx)).toEqual([]);
  });

  it('rejects a missing character id', () => {
    const errors = validateSupportProfile({ ...SEED_SUPPORT_PROFILES[0], characterId: 'missing_character' }, ctx);
    expect(errors.some((e) => e.includes('Character does not exist'))).toBe(true);
  });

  it('rejects negative durations', () => {
    const errors = validateSupportProfile({ ...SEED_SUPPORT_PROFILES[0], flightDurationSeconds: -1 }, ctx);
    expect(errors.some((e) => e.includes('Flight duration'))).toBe(true);
  });

  it('rejects a missing ai profile id', () => {
    const errors = validateSupportProfile({ ...SEED_SUPPORT_PROFILES[0], aiProfileId: 'missing_ai' }, ctx);
    expect(errors.some((e) => e.includes('AI profile does not exist'))).toBe(true);
  });

  it('rejects invalid ai and limit configs', () => {
    expect(validateSupportAiProfile({ ...SEED_SUPPORT_AI_PROFILES[0], followDistance: 0 })).toContain('Follow distance must be greater than 0');
    expect(validateLimitConfig({ ...DEFAULT_MULTI_CHARACTER_LIMITS, maxActiveCharacters: 0 })).toContain('Max active characters must be at least 1');
  });
});
