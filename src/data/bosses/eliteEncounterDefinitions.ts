import type { EliteEncounterDefinition } from '../../types/game/boss';

// Elite encounter placeholder (Batch F) — a beefed-up Shield Carrier (Batch C archetype) usable as a
// mid-zone mini-boss. Runtime placeholder only (EliteEncounterDirector.startElite); not heavily seeded.
export const SEED_ELITE_ENCOUNTERS: EliteEncounterDefinition[] = [
  {
    id: 'elite_shield_carrier',
    name: 'Elite Shield Carrier',
    baseEnemyDefinitionId: 'shield_carrier',
    zoneId: 'zone_sunny_harbor_advanced_foundation',
    segmentId: 'seg_signal_yard',
    hpMultiplier: 2.5,
    shieldMultiplier: 2,
    stunOnShieldBreakSeconds: 3,
    editorMeta: { notes: 'Higher HP/shield Shield Carrier; shield-break → long stun. Mini-boss placeholder.' },
    enabled: true,
  },
];
