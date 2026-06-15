import type { DamageableDefinition } from '../../types/game/combat';

// Dummy damageable targets for testing the Combat Runtime (weakness / resistance / shield / shield-break).
export const SEED_DAMAGEABLES: DamageableDefinition[] = [
  {
    id: 'combat_dummy_light',
    maxHp: 60,
    weaknessTags: [],
    resistanceTags: [],
    armorType: 'light',
    onHpZero: 'destroy',
    editorMeta: { displayName: 'Light Dummy', color: '#94a3b8' },
  },
  {
    id: 'combat_dummy_shielded',
    maxHp: 80,
    maxShield: 60,
    weaknessTags: [],
    resistanceTags: ['impact'],
    armorType: 'shielded',
    shieldRules: { enabled: true, shieldHp: 60, shieldWeaknessTags: ['shield-break', 'energy'], shieldBreakStaggerSeconds: 1.5 },
    onHpZero: 'destroy',
    editorMeta: { displayName: 'Shielded Dummy', color: '#38bdf8' },
  },
  {
    id: 'combat_dummy_weak_to_energy',
    maxHp: 70,
    weaknessTags: ['energy'],
    resistanceTags: ['impact'],
    immuneTags: ['repair'],
    armorType: 'medium',
    onHpZero: 'destroy',
    editorMeta: { displayName: 'Energy-Weak Dummy', color: '#fbbf24' },
  },
];
