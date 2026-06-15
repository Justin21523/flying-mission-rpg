import type { CombatSkillDefinition, DamageType, DamageEventTemplate } from '../../types/game/combat';
import { skill, hv } from '../combat/skillBuilders';

// MVP character-kit skills (Batch D-kits) — re-authored named-slot loadouts for Jett / Donnie / Paul / Chase,
// registered into the same skill registry. slot 1..6 = z/x/y/h/b/n. faction defaults to 'player'. Utility
// behaviour is tag-driven (scan / stun / repair / speed-gate) and applied by CharacterUtilityResolver from
// the cast hit ids — model-first effects via characterSkillEffects.
const dmg = (amount: number, type: DamageType, tags: string[]): DamageEventTemplate[] => [{ amount, damageType: type, attackTags: tags }];

// ---------------- Jett — speed / rescue / burst ----------------
const JETT: CombatSkillDefinition[] = [
  skill({ id: 'jett_kit_basic', ownerCharacterId: 'char_jett', slot: 1, name: 'Jet Dash Slash', attackType: 'charge', cooldownSeconds: 0.5, energyCost: 0, speed: 8,
    damageEvents: dmg(14, 'impact', ['speed', 'melee', 'dash']), hitVolume: hv({ shape: 'cone', radius: 4, angleDegrees: 80 }), effectDefinitionId: 'fx_wing_arc', editorMeta: { displayName: 'Jet Dash Slash', themeColor: '#e8442c' } }),
  skill({ id: 'jett_kit_rush', ownerCharacterId: 'char_jett', slot: 2, name: 'Rescue Line Rush', attackType: 'dash', cooldownSeconds: 4, energyCost: 18, speed: 14,
    damageEvents: dmg(24, 'energy', ['speed', 'rescue', 'line-dash']), hitVolume: hv({ shape: 'line', length: 16, width: 1.4, activeDurationSeconds: 0.25 }), effectDefinitionId: 'fx_lock_line', editorMeta: { displayName: 'Rescue Line Rush', themeColor: '#e8442c' } }),
  skill({ id: 'jett_kit_missile', ownerCharacterId: 'char_jett', slot: 3, name: 'Wing Missile', attackType: 'projectile', cooldownSeconds: 2, energyCost: 16,
    projectile: { modelAssetId: 'super-wings/Jett+airplane+3d+model', speed: 22, lifetimeSeconds: 2.5, movement: 'linear', radius: 2 }, damageEvents: dmg(20, 'impact', ['ranged', 'speed']), editorMeta: { displayName: 'Wing Missile', themeColor: '#e8442c' } }),
  skill({ id: 'jett_kit_cyclone', ownerCharacterId: 'char_jett', slot: 4, name: 'Jetstream Cyclone', attackType: 'ring-aoe', cooldownSeconds: 6, energyCost: 30,
    damageEvents: dmg(18, 'impact', ['wind', 'speed', 'aoe']), hitVolume: hv({ shape: 'cylinder', origin: 'character-root', radius: 6 }), effectDefinitionId: 'fx_cyclone_ring', editorMeta: { displayName: 'Jetstream Cyclone', themeColor: '#e8442c' } }),
  skill({ id: 'jett_kit_evade', ownerCharacterId: 'char_jett', slot: 5, name: 'Afterimage Evade', attackType: 'none', defenseType: 'quick-dash-iframe', cooldownSeconds: 3, energyCost: 8, durationSeconds: 0.4, defenseValue: 1, damageEvents: [], editorMeta: { displayName: 'Afterimage Evade', themeColor: '#fca5a5' } }),
  skill({ id: 'jett_kit_speed', ownerCharacterId: 'char_jett', slot: 6, name: 'Rescue Speed Dash', attackType: 'dash', cooldownSeconds: 5, energyCost: 14, speed: 16,
    damageEvents: dmg(10, 'impact', ['speed', 'rescue', 'speed-gate']), hitVolume: hv({ shape: 'line', length: 12, width: 1.2, activeDurationSeconds: 0.2 }), effectDefinitionId: 'fx_lock_line', editorMeta: { displayName: 'Rescue Speed Dash', themeColor: '#e8442c' } }),
  skill({ id: 'jett_kit_ultimate', ownerCharacterId: 'char_jett', name: 'Global Rescue Overdrive', attackType: 'air-support', skillCategory: 'ultimate', cooldownSeconds: 18, energyCost: 50,
    projectile: { modelAssetId: 'super-wings/Jett+airplane+3d+model', speed: 18, lifetimeSeconds: 3, movement: 'homing', radius: 3, count: 4, spreadDeg: 60 }, damageEvents: dmg(30, 'impact', ['air-support']), editorMeta: { displayName: 'Global Rescue Overdrive', themeColor: '#e8442c' } }),
];

// ---------------- Donnie — engineering / repair ----------------
const DONNIE: CombatSkillDefinition[] = [
  skill({ id: 'donnie_kit_basic', ownerCharacterId: 'char_donnie', slot: 1, name: 'Tool Arm Combo', attackType: 'melee', cooldownSeconds: 0.6,
    damageEvents: dmg(13, 'impact', ['engineering', 'melee', 'heavy-impact']), hitVolume: hv({ shape: 'box', length: 3.5, width: 2.4 }), effectDefinitionId: 'fx_tool_arc', editorMeta: { displayName: 'Tool Arm Combo', themeColor: '#f5b21e' } }),
  skill({ id: 'donnie_kit_repair', ownerCharacterId: 'char_donnie', slot: 2, name: 'Repair Beam', attackType: 'none', skillCategory: 'special', cooldownSeconds: 2.5, energyCost: 14, durationSeconds: 0.6,
    damageEvents: dmg(0, 'repair', ['repair', 'engineering']), hitVolume: hv({ shape: 'line', length: 8, width: 1.2, activeDurationSeconds: 0.3 }), targetRules: { validTargetTypes: ['obstacle', 'device'] }, effectDefinitionId: 'fx_repair_beam', editorMeta: { displayName: 'Repair Beam', themeColor: '#fbbf24' } }),
  skill({ id: 'donnie_kit_cover', ownerCharacterId: 'char_donnie', slot: 3, name: 'Build Cover', attackType: 'terrain', cooldownSeconds: 7, energyCost: 22,
    terrain: { modelAssetId: 'outerior_decors/construction barrier 3d model', count: 1, lifetimeSeconds: 8, radius: 2.5, blocksMovement: true }, editorMeta: { displayName: 'Build Cover', themeColor: '#f5b21e' } }),
  skill({ id: 'donnie_kit_matrix', ownerCharacterId: 'char_donnie', slot: 4, name: 'Tool Matrix Field', attackType: 'dot-zone', cooldownSeconds: 8, energyCost: 28,
    terrain: { modelAssetId: 'props/colorful shelving unit 3d model', count: 1, lifetimeSeconds: 6, radius: 6, damagePerTick: 6, tickIntervalSeconds: 0.7 }, damageEvents: dmg(6, 'impact', ['engineering', 'repair-field', 'aoe']), editorMeta: { displayName: 'Tool Matrix Field', themeColor: '#f5b21e' } }),
  skill({ id: 'donnie_kit_barricade', ownerCharacterId: 'char_donnie', slot: 5, name: 'Emergency Barricade', attackType: 'none', defenseType: 'cover-spawn', cooldownSeconds: 7, energyCost: 18, durationSeconds: 5, defenseValue: 0.6, damageEvents: [],
    terrain: { modelAssetId: 'props/shipping container 3d model', count: 1, lifetimeSeconds: 5, radius: 2.5, blocksMovement: true }, editorMeta: { displayName: 'Emergency Barricade', themeColor: '#fde68a' } }),
  skill({ id: 'donnie_kit_overclock', ownerCharacterId: 'char_donnie', slot: 6, name: 'Overclock Tool', attackType: 'heavy', cooldownSeconds: 3.5, energyCost: 15,
    damageEvents: dmg(30, 'impact', ['engineering', 'heavy-impact', 'drill']), hitVolume: hv({ shape: 'box', length: 4, width: 3 }), effectDefinitionId: 'fx_tool_arc', editorMeta: { displayName: 'Overclock Tool', themeColor: '#f5b21e' } }),
  skill({ id: 'donnie_kit_ultimate', ownerCharacterId: 'char_donnie', name: 'Mega Constructor', attackType: 'summon', skillCategory: 'ultimate', cooldownSeconds: 16, energyCost: 45,
    summon: { modelAssetId: 'characters/Carey drone 3d model', count: 2, lifetimeSeconds: 14, behavior: 'orbit', attackIntervalSeconds: 1.2, attackDamage: 12, attackRadius: 8 }, editorMeta: { displayName: 'Mega Constructor', themeColor: '#f5b21e' } }),
];

// ---------------- Paul — defense / control ----------------
const PAUL: CombatSkillDefinition[] = [
  skill({ id: 'paul_kit_basic', ownerCharacterId: 'char_paul', slot: 1, name: 'Patrol Baton Strike', attackType: 'melee', cooldownSeconds: 0.6,
    damageEvents: dmg(12, 'impact', ['melee', 'control', 'stun-light']), hitVolume: hv({ shape: 'box', length: 3, width: 2 }), effectDefinitionId: 'fx_barrier_line', editorMeta: { displayName: 'Patrol Baton Strike', themeColor: '#2b4c8c' } }),
  skill({ id: 'paul_kit_cuff', ownerCharacterId: 'char_paul', slot: 2, name: 'Containment Cuff', attackType: 'pull', cooldownSeconds: 5, energyCost: 20, knockbackForce: 3, stunDurationSeconds: 2,
    damageEvents: dmg(8, 'stun', ['control', 'restraint', 'stun']), hitVolume: hv({ shape: 'line', length: 12, width: 1.6, activeDurationSeconds: 0.3 }), effectDefinitionId: 'fx_cuff_torus', editorMeta: { displayName: 'Containment Cuff', themeColor: '#2b4c8c' } }),
  skill({ id: 'paul_kit_barrier', ownerCharacterId: 'char_paul', slot: 3, name: 'Traffic Barrier Line', attackType: 'terrain', cooldownSeconds: 7, energyCost: 22,
    terrain: { modelAssetId: 'props/safety railing 3d model', count: 3, lifetimeSeconds: 9, radius: 2, blocksMovement: true }, effectDefinitionId: 'fx_barrier_line', editorMeta: { displayName: 'Traffic Barrier Line', themeColor: '#2b4c8c' } }),
  skill({ id: 'paul_kit_order', ownerCharacterId: 'char_paul', slot: 4, name: 'Order Field', attackType: 'ring-aoe', cooldownSeconds: 7, energyCost: 26,
    damageEvents: dmg(10, 'impact', ['control', 'slow', 'protect', 'aoe']), hitVolume: hv({ shape: 'cylinder', origin: 'character-root', radius: 6 }), effectDefinitionId: 'fx_order_ring', editorMeta: { displayName: 'Order Field', themeColor: '#2b4c8c' } }),
  skill({ id: 'paul_kit_shield', ownerCharacterId: 'char_paul', slot: 5, name: 'Police Shield Wall', attackType: 'none', defenseType: 'front-shield', cooldownSeconds: 6, energyCost: 15, durationSeconds: 3, defenseValue: 0.7, damageEvents: [], effectDefinitionId: 'fx_shield_panel', editorMeta: { displayName: 'Police Shield Wall', themeColor: '#93c5fd' } }),
  skill({ id: 'paul_kit_protect', ownerCharacterId: 'char_paul', slot: 6, name: 'Protect Zone', attackType: 'none', skillCategory: 'special', cooldownSeconds: 8, energyCost: 18, durationSeconds: 5, damageEvents: [],
    hitVolume: hv({ shape: 'sphere', origin: 'character-root', radius: 7 }), targetRules: { validTargetTypes: ['npc', 'device'] }, editorMeta: { displayName: 'Protect Zone', themeColor: '#2b4c8c' } }),
  skill({ id: 'paul_kit_ultimate', ownerCharacterId: 'char_paul', name: 'Citywide Lockdown', attackType: 'charge', skillCategory: 'ultimate', cooldownSeconds: 16, energyCost: 45, speed: 14,
    modelPrefabId: 'characters/Poli car 3d model', damageEvents: dmg(32, 'impact', ['charge', 'control']), knockbackForce: 8, hitVolume: hv({ shape: 'box', length: 8, width: 3 }), editorMeta: { displayName: 'Citywide Lockdown', themeColor: '#2b4c8c' } }),
];

// ---------------- Chase — scanner / precision / stealth ----------------
const CHASE: CombatSkillDefinition[] = [
  skill({ id: 'chase_kit_basic', ownerCharacterId: 'char_chase', slot: 1, name: 'Covert Pulse Shot', attackType: 'line-pierce', cooldownSeconds: 0.7, energyCost: 4,
    damageEvents: dmg(11, 'energy', ['precision', 'energy', 'weakpoint']), hitVolume: hv({ shape: 'line', length: 16, width: 1, activeDurationSeconds: 0.2 }), effectDefinitionId: 'fx_line_beam', editorMeta: { displayName: 'Covert Pulse Shot', themeColor: '#3b4a78' } }),
  skill({ id: 'chase_kit_scan', ownerCharacterId: 'char_chase', slot: 2, name: 'Weakpoint Scan', attackType: 'none', skillCategory: 'special', cooldownSeconds: 4, energyCost: 12, durationSeconds: 0.5,
    damageEvents: dmg(0, 'energy', ['scan', 'reveal', 'weakpoint']), hitVolume: hv({ shape: 'cone', origin: 'character-forward', radius: 8, angleDegrees: 60, activeDurationSeconds: 0.3 }), targetRules: { validTargetTypes: ['enemy', 'dummy', 'obstacle', 'boss'] }, effectDefinitionId: 'fx_scan_cone', editorMeta: { displayName: 'Weakpoint Scan', themeColor: '#60a5fa' } }),
  skill({ id: 'chase_kit_decoy', ownerCharacterId: 'char_chase', slot: 3, name: 'Decoy Jammer', attackType: 'summon', cooldownSeconds: 7, energyCost: 18,
    summon: { modelAssetId: 'characters/Carey drone 3d model', count: 1, lifetimeSeconds: 8, behavior: 'stationary', attackIntervalSeconds: 99, attackDamage: 0, attackRadius: 1 }, damageEvents: dmg(0, 'energy', ['stealth', 'decoy', 'control']), effectDefinitionId: 'fx_decoy', editorMeta: { displayName: 'Decoy Jammer', themeColor: '#a5f3fc' } }),
  skill({ id: 'chase_kit_grid', ownerCharacterId: 'char_chase', slot: 4, name: 'Marked Execution Grid', attackType: 'ring-aoe', cooldownSeconds: 7, energyCost: 28,
    damageEvents: dmg(22, 'energy', ['precision', 'multi-lock', 'aoe']), hitVolume: hv({ shape: 'sphere', origin: 'character-root', radius: 7 }), effectDefinitionId: 'fx_exec_grid', editorMeta: { displayName: 'Marked Execution Grid', themeColor: '#3b4a78' } }),
  skill({ id: 'chase_kit_cloak', ownerCharacterId: 'char_chase', slot: 5, name: 'Stealth Cloak', attackType: 'none', defenseType: 'quick-dash-iframe', cooldownSeconds: 6, energyCost: 14, durationSeconds: 1.2, defenseValue: 1, damageEvents: [], editorMeta: { displayName: 'Stealth Cloak', themeColor: '#93c5fd' } }),
  skill({ id: 'chase_kit_trapscan', ownerCharacterId: 'char_chase', slot: 6, name: 'Trap Scan', attackType: 'none', skillCategory: 'special', cooldownSeconds: 5, energyCost: 10, durationSeconds: 0.5,
    damageEvents: dmg(0, 'energy', ['scan', 'reveal']), hitVolume: hv({ shape: 'sphere', origin: 'character-root', radius: 9, activeDurationSeconds: 0.3 }), targetRules: { validTargetTypes: ['enemy', 'obstacle'] }, effectDefinitionId: 'fx_scan_cone', editorMeta: { displayName: 'Trap Scan', themeColor: '#3b4a78' } }),
  skill({ id: 'chase_kit_ultimate', ownerCharacterId: 'char_chase', name: 'Black Box Assassination', attackType: 'summon', skillCategory: 'ultimate', cooldownSeconds: 16, energyCost: 45,
    summon: { modelAssetId: 'characters/Carey drone 3d model', count: 3, lifetimeSeconds: 8, behavior: 'seek', attackIntervalSeconds: 0.8, attackDamage: 16, attackRadius: 3 }, editorMeta: { displayName: 'Black Box Assassination', themeColor: '#3b4a78' } }),
];

export const SEED_KIT_SKILLS: CombatSkillDefinition[] = [...JETT, ...DONNIE, ...PAUL, ...CHASE];
