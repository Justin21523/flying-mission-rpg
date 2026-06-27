import { describe, expect, it, beforeEach } from 'vitest';
import { seedGameContent } from '../../game/boot/seedGameContent';
import { applyEnvironmentTheme, getActiveEnvironmentTheme } from '../../game/environments/EnvironmentThemeDirector';

describe('EnvironmentThemeDirector', () => {
  beforeEach(() => { localStorage.clear(); seedGameContent(); });
  it('applies a theme', () => {
    applyEnvironmentTheme('env_factory_core_smoke');
    expect(getActiveEnvironmentTheme()?.themeType).toBe('factory-core');
  });
});
