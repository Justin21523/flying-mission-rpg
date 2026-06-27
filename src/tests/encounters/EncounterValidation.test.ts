import { describe, expect, it, beforeEach } from 'vitest';
import { seedGameContent } from '../../game/boot/seedGameContent';
import { validateEncounter } from '../../game/encounters/EncounterValidation';
import { SEED_ENEMY_ENCOUNTERS } from '../../data/encounters/enemyEncounterDefinitions';

describe('EncounterValidation', () => {
  beforeEach(() => { localStorage.clear(); seedGameContent(); });
  it('validates seed encounters', () => expect(SEED_ENEMY_ENCOUNTERS.every((encounter) => validateEncounter(encounter).ok)).toBe(true));
});
