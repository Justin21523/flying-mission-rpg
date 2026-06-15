import type { CombatSkillDefinition } from '../../types/game/combat';
import { skill, hv } from './skillBuilders';

// Enemy + boss faction skills (model-driven). faction 'enemy'/'boss' → their spawns target the PLAYER.
export const SEED_ENEMY_SKILLS: CombatSkillDefinition[] = [
  // --- generic enemy skills ---
  skill({ id: 'en_charge', name: 'Charge Slam', faction: 'enemy', attackType: 'charge', cooldownSeconds: 3, speed: 8,
    damageEvents: [{ amount: 12, damageType: 'impact', attackTags: ['melee'] }], hitVolume: hv({ shape: 'cone', radius: 3, angleDegrees: 100 }),
    targetRules: { validTargetTypes: ['player'] }, editorMeta: { displayName: 'Charge Slam', themeColor: '#ef4444' } }),
  skill({ id: 'en_fireball', name: 'Ember Shot', faction: 'enemy', attackType: 'projectile', cooldownSeconds: 2.4,
    projectile: { modelAssetId: 'others/flaming sigil 3d model', speed: 12, lifetimeSeconds: 2.5, movement: 'linear', radius: 2 },
    damageEvents: [{ amount: 10, damageType: 'fire', attackTags: ['fire'] }], targetRules: { validTargetTypes: ['player'] },
    editorMeta: { displayName: 'Ember Shot', themeColor: '#fb923c' } }),
  skill({ id: 'en_homing_orb', name: 'Seeker Orb', faction: 'enemy', attackType: 'homing', cooldownSeconds: 4,
    projectile: { modelAssetId: 'decor/glowing flower 3d model', speed: 7, lifetimeSeconds: 4, movement: 'homing', radius: 2 },
    damageEvents: [{ amount: 9, damageType: 'energy', attackTags: ['energy'] }], targetRules: { validTargetTypes: ['player'] },
    editorMeta: { displayName: 'Seeker Orb', themeColor: '#a78bfa' } }),
  skill({ id: 'en_quake', name: 'Ground Quake', faction: 'enemy', attackType: 'shockwave', cooldownSeconds: 5,
    damageEvents: [{ amount: 14, damageType: 'impact', attackTags: ['aoe', 'quake'] }], hitVolume: hv({ shape: 'sphere', origin: 'character-root', radius: 5 }),
    targetRules: { validTargetTypes: ['player'] }, editorMeta: { displayName: 'Ground Quake', themeColor: '#a16207' } }),
  skill({ id: 'en_summon_swarm', name: 'Summon Swarm', faction: 'enemy', attackType: 'summon', cooldownSeconds: 10,
    summon: { modelAssetId: 'yokais/japanese+ninja+3d+model', count: 2, lifetimeSeconds: 12, behavior: 'seek', attackIntervalSeconds: 1.4, attackDamage: 5, attackRadius: 2 },
    targetRules: { validTargetTypes: ['player'] }, editorMeta: { displayName: 'Summon Swarm', themeColor: '#84cc16' } }),

  // --- boss skills (faction boss) ---
  skill({ id: 'boss_barrage', name: 'Crystal Barrage', faction: 'boss', attackType: 'projectile', cooldownSeconds: 3,
    projectile: { modelAssetId: 'decor/glowing flower 3d model', speed: 13, lifetimeSeconds: 3, movement: 'linear', radius: 2, count: 5, spreadDeg: 50 },
    damageEvents: [{ amount: 8, damageType: 'energy', attackTags: ['energy'] }], targetRules: { validTargetTypes: ['player'] },
    editorMeta: { displayName: 'Crystal Barrage', themeColor: '#c084fc' } }),
  skill({ id: 'boss_quake', name: 'Seismic Crash', faction: 'boss', attackType: 'shockwave', cooldownSeconds: 5,
    damageEvents: [{ amount: 18, damageType: 'impact', attackTags: ['aoe'] }], hitVolume: hv({ shape: 'sphere', origin: 'character-root', radius: 7 }),
    targetRules: { validTargetTypes: ['player'] }, editorMeta: { displayName: 'Seismic Crash', themeColor: '#7c3aed' } }),
  skill({ id: 'boss_summon', name: 'Summon Shards', faction: 'boss', attackType: 'summon', cooldownSeconds: 9,
    summon: { modelAssetId: 'yokais/stylized+robot+3d+model', count: 2, lifetimeSeconds: 14, behavior: 'seek', attackIntervalSeconds: 1.5, attackDamage: 6, attackRadius: 2 },
    targetRules: { validTargetTypes: ['player'] }, editorMeta: { displayName: 'Summon Shards', themeColor: '#22d3ee' } }),
  skill({ id: 'boss_beam', name: 'Prism Lance', faction: 'boss', attackType: 'line-pierce', cooldownSeconds: 6,
    damageEvents: [{ amount: 22, damageType: 'energy', attackTags: ['pierce', 'energy'] }], hitVolume: hv({ shape: 'line', length: 22, width: 2.4, activeDurationSeconds: 0.4 }),
    targetRules: { validTargetTypes: ['player'] }, editorMeta: { displayName: 'Prism Lance', themeColor: '#60a5fa' } }),
  skill({ id: 'boss_meteor', name: 'Crystal Rain', faction: 'boss', attackType: 'lobbed', cooldownSeconds: 7,
    projectile: { modelAssetId: 'decor/rock boulder 3d model', speed: 9, lifetimeSeconds: 3, movement: 'lobbed', radius: 3, count: 3, spreadDeg: 40 },
    damageEvents: [{ amount: 16, damageType: 'impact', attackTags: ['aoe'] }], targetRules: { validTargetTypes: ['player'] },
    editorMeta: { displayName: 'Crystal Rain', themeColor: '#f472b6' } }),
];
