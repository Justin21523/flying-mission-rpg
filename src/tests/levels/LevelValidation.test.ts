import { describe, expect, it } from 'vitest';
import { validateLevelLayout } from '../../game/levels/LevelValidation';
import { SEED_LEVEL_LAYOUTS } from '../../data/levels/levelLayouts';

describe('LevelValidation', () => {
  it('validates all seed layouts', () => expect(SEED_LEVEL_LAYOUTS.every((layout) => validateLevelLayout(layout).ok)).toBe(true));
});
