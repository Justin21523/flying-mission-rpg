import { describe, expect, it } from 'vitest';
import type { CharacterDefinition } from '../../types/game/character';
import { getGroundAbilityConfig } from './groundAbilityConfig';
import { getGroundAbilityLibrary, validateGroundAbilityLibrary } from './groundAbilityLibrary';

const character = (overrides: Partial<CharacterDefinition> = {}): CharacterDefinition => ({
  id: 'char_test',
  codename: 'Test',
  name: 'Test Hero',
  role: '',
  description: '',
  sourceConfidence: 'GameAdaptation',
  color: '#38bdf8',
  defaultForm: 'robot',
  stats: { flightSpeed: 5, agility: 5, controlDifficulty: 5, durability: 5 },
  abilities: [],
  missionSuitability: [],
  ...overrides,
});

describe('groundAbilityLibrary', () => {
  it('adapts legacy groundAbility into library definitions', () => {
    const library = getGroundAbilityLibrary(character());

    expect(library.some((ability) => ability.kind === 'cloud-rally-shockwave' && ability.keyCode === 'KeyQ')).toBe(true);
    expect(library.some((ability) => ability.kind === 'forward-dash-afterimage' && ability.keyCode === 'KeyR')).toBe(true);
  });

  it('maps library definitions back into runtime Q/R config', () => {
    const config = getGroundAbilityConfig(character({
      groundAbilityLibrary: [
        { id: 'cloud', name: 'Hero Cloud', kind: 'cloud-rally-shockwave', keyCode: 'KeyQ', durationSec: 2, cooldownSec: 6, color: '#ffffff', radius: 12, strength: 1.6, animationPool: ['Wave'], aiUsable: true },
        { id: 'surge', name: 'Hero Surge', kind: 'forward-dash-afterimage', keyCode: 'KeyR', durationSec: 1.2, cooldownSec: 5, color: '#22d3ee', radius: 0, strength: 1, speed: 48, afterimageCount: 24, aiUsable: false },
      ],
    }));

    expect(config.cloudRally.name).toBe('Hero Cloud');
    expect(config.cloudRally.radius).toBe(12);
    expect(config.rescueSurge.speed).toBe(48);
    expect(config.rescueSurge.afterimageCount).toBe(24);
  });

  it('validates duplicate keys and invalid tuning', () => {
    const errors = validateGroundAbilityLibrary([
      { id: 'a', name: 'A', kind: 'scan-wave', keyCode: 'KeyQ', durationSec: 1, cooldownSec: 0, color: '#fff', radius: 1, strength: 1 },
      { id: 'b', name: 'B', kind: 'repair-beam', keyCode: 'KeyQ', durationSec: 0, cooldownSec: -1, color: '#fff', radius: -1, strength: -1 },
    ]);

    expect(errors.some((error) => error.includes('duplicate keyCode'))).toBe(true);
    expect(errors.some((error) => error.includes('duration'))).toBe(true);
    expect(errors.some((error) => error.includes('cooldown'))).toBe(true);
  });
});
