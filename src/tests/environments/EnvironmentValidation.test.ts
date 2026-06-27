import { describe, expect, it, beforeEach } from 'vitest';
import { seedGameContent } from '../../game/boot/seedGameContent';
import { validateEnvironmentTheme } from '../../game/environments/EnvironmentValidation';
import { SEED_ENVIRONMENT_THEMES } from '../../data/environments/environmentThemes';

describe('EnvironmentValidation', () => {
  beforeEach(() => { localStorage.clear(); seedGameContent(); });
  it('validates seed themes', () => expect(SEED_ENVIRONMENT_THEMES.every((theme) => validateEnvironmentTheme(theme).ok)).toBe(true));
});
