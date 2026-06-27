import type { PartnerFusionDefinition } from '../../types/game/supportCombat';

// Seed Partner Fusions (Batch I) — primary hero + Active/Standby support partner. cinematicEffectId reuses an
// existing arsenal ultimate effect (`<skill>_fx`). Limited charges per zone + a sync gauge keep them special.
export const SEED_PARTNER_FUSIONS: PartnerFusionDefinition[] = [
  {
    id: 'fusion_jett_chase_recon_strike',
    primaryCharacterId: 'char_jett', supportCharacterId: 'char_chase',
    name: 'Recon Overdrive', description: 'Chase marks the field while Jett streaks through every target.',
    requiredSupportStatus: 'standby', chargesPerZone: 2, cooldownSeconds: 14,
    sync: { requiredGauge: 100, gaugeMax: 100 },
    combo: { damage: 60, radius: 9, damageType: 'energy', attackTags: ['fusion', 'speed', 'weakpoint'], statusTags: ['marked'], cinematicEffectId: 'jett_overdrive_fx' },
    editorMeta: { notes: 'Recon + speed fusion. Best vs. shielded packs.', themeColor: '#e8442c' }, enabled: true,
  },
  {
    id: 'fusion_donnie_paul_guard_hammer',
    primaryCharacterId: 'char_donnie', supportCharacterId: 'char_paul',
    name: 'Guarded Titan Hammer', description: 'Paul shields the wind-up while Donnie slams a giant hammer down.',
    requiredSupportStatus: 'standby', chargesPerZone: 2, cooldownSeconds: 16,
    sync: { requiredGauge: 100, gaugeMax: 100 },
    combo: { damage: 80, radius: 7, damageType: 'impact', attackTags: ['fusion', 'heavy-impact', 'shield-break'], statusTags: ['stagger'], cinematicEffectId: 'donnie_titan_hammer_fx' },
    editorMeta: { notes: 'Heavy break fusion. Strips boss shields.', themeColor: '#f5b21e' }, enabled: true,
  },
  {
    id: 'fusion_todd_jett_quake_rush',
    primaryCharacterId: 'char_todd', supportCharacterId: 'char_jett',
    name: 'Seismic Rush', description: 'Jett rushes Todd in for a ground-shattering quake.',
    requiredSupportStatus: 'standby', chargesPerZone: 1, cooldownSeconds: 18,
    sync: { requiredGauge: 100, gaugeMax: 100 },
    combo: { damage: 70, radius: 8, damageType: 'impact', attackTags: ['fusion', 'aoe', 'drill'], statusTags: ['stagger'], cinematicEffectId: 'todd_earth_core_breaker_fx' },
    editorMeta: { notes: 'AOE ground fusion. Clears swarms.', themeColor: '#b5793a' }, enabled: true,
  },
  // Wave 2 — fusions for the newly-kitted heroes (reuse their ultimate cinematic effects).
  {
    id: 'fusion_jerome_bello_rhythm_wild',
    primaryCharacterId: 'char_jerome', supportCharacterId: 'char_bello',
    name: 'Rhythm of the Wild', description: 'Bello calls the pack while Jerome conducts a stage-shaking finale.',
    requiredSupportStatus: 'standby', chargesPerZone: 2, cooldownSeconds: 15,
    sync: { requiredGauge: 100, gaugeMax: 100 },
    combo: { damage: 65, radius: 8, damageType: 'electric', attackTags: ['fusion', 'sound', 'aoe', 'shock'], statusTags: ['shocked'], cinematicEffectId: 'jerome_grand_performance_fx' },
    editorMeta: { notes: 'Sound AOE fusion; shocks packs.', themeColor: '#2f6fd6' }, enabled: true,
  },
  {
    id: 'fusion_flip_jett_ricochet_rush',
    primaryCharacterId: 'char_flip', supportCharacterId: 'char_jett',
    name: 'Ricochet Rush', description: 'Jett slingshots Flip through the field for a bouncing meteor barrage.',
    requiredSupportStatus: 'standby', chargesPerZone: 2, cooldownSeconds: 15,
    sync: { requiredGauge: 100, gaugeMax: 100 },
    combo: { damage: 70, radius: 8, damageType: 'impact', attackTags: ['fusion', 'speed', 'bounce', 'aoe'], statusTags: ['stagger'], cinematicEffectId: 'flip_goal_meteor_fx' },
    editorMeta: { notes: 'Mobile burst fusion.', themeColor: '#e23b2e' }, enabled: true,
  },
  {
    id: 'fusion_bello_chase_predator_recon',
    primaryCharacterId: 'char_bello', supportCharacterId: 'char_chase',
    name: 'Predator Recon', description: 'Chase marks the prey and Bello unleashes the wild to finish them.',
    requiredSupportStatus: 'standby', chargesPerZone: 2, cooldownSeconds: 16,
    sync: { requiredGauge: 100, gaugeMax: 100 },
    combo: { damage: 60, radius: 9, damageType: 'energy', attackTags: ['fusion', 'scan', 'weakpoint'], statusTags: ['marked'], cinematicEffectId: 'bello_call_of_wild_fx' },
    editorMeta: { notes: 'Recon + wild fusion vs. shielded packs.', themeColor: '#8a6240' }, enabled: true,
  },
];

export function getPartnerFusion(id: string | undefined): PartnerFusionDefinition | undefined {
  return id ? SEED_PARTNER_FUSIONS.find((f) => f.id === id) : undefined;
}
