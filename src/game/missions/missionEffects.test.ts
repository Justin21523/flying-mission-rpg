import { describe, it, expect } from 'vitest';
import { runEffects } from './missionEffects';
import type { DialogueEffect } from '../../types/dialogue';

describe('runEffects', () => {
  it('applies each effect once, in order', () => {
    const seen: string[] = [];
    const effects: DialogueEffect[] = [
      { type: 'setWorldFlag', flag: 'rescued' },
      { type: 'unlockTool', toolId: 'crane' },
      { type: 'increaseTrust', characterId: 'mina', amount: 2 },
    ];
    runEffects(effects, (e) => seen.push(e.type));
    expect(seen).toEqual(['setWorldFlag', 'unlockTool', 'increaseTrust']);
  });
  it('undefined / empty → no-op', () => {
    const seen: string[] = [];
    runEffects(undefined, (e) => seen.push(e.type));
    runEffects([], (e) => seen.push(e.type));
    expect(seen).toEqual([]);
  });
});
