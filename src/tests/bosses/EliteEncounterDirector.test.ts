import { describe, it, expect, beforeEach } from 'vitest';
import { startElite, isEliteCleared, reset } from '../../game/bosses/EliteEncounterDirector';
import { useEditorEnemyStore } from '../../stores/game/editorCombatStore';
import { useEliteEncounterStore } from '../../stores/game/useBossEditorStore';
import { useCombatTargetStore } from '../../stores/game/combatTargetStore';
import { SEED_ENEMIES } from '../../data/combat/enemyDefinitions';
import { SEED_ELITE_ENCOUNTERS } from '../../data/bosses/eliteEncounterDefinitions';

const base = SEED_ENEMIES.find((e) => e.id === 'shield_carrier')!;
const elite = SEED_ELITE_ENCOUNTERS[0];

beforeEach(() => {
  useEditorEnemyStore.getState().importState({ items: SEED_ENEMIES, seeded: true });
  useEliteEncounterStore.getState().importState({ items: SEED_ELITE_ENCOUNTERS, seeded: true });
  useCombatTargetStore.getState().reset();
  reset();
});

describe('EliteEncounterDirector', () => {
  it('spawns a beefed-up base enemy', () => {
    const t = startElite('elite_shield_carrier', 0, 0)!;
    expect(t).toBeTruthy();
    expect(t.maxHp).toBe(Math.round(base.maxHp * elite.hpMultiplier));
    const baseShield = base.maxShield ?? base.shield?.shieldHp ?? 0;
    expect(t.maxShield).toBe(Math.round(baseShield * elite.shieldMultiplier));
  });

  it('is cleared when its target is defeated', () => {
    const t = startElite('elite_shield_carrier', 0, 0)!;
    expect(isEliteCleared()).toBe(false);
    t.defeatedAt = 1;
    expect(isEliteCleared()).toBe(true);
  });
});
