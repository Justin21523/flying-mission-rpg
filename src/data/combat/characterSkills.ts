import type { CombatSkillDefinition, DamageType, DamageEventTemplate } from '../../types/game/combat';
import { skill, hv } from './skillBuilders';

// Full model-driven hero skill sets (8 heroes × 6 slots). Each skill pulls from models tied to the
// character's theme. slot 1..6 maps to the skill-bar keys (J/K/L/U/I/O) at runtime. faction defaults to
// 'player'. Models referenced are verified to exist in the library (super-wings / decor / props /
// outerior_decors / characters / yokais).

const dmg = (amount: number, type: DamageType, tags: string[]): DamageEventTemplate[] => [{ amount, damageType: type, attackTags: tags }];

// ---------------- Jett — speed / aerial ----------------
const JETT: CombatSkillDefinition[] = [
  skill({ id: 'jett_dash_strike', ownerCharacterId: 'char_jett', slot: 1, name: 'Jet Dash Slash', attackType: 'melee', cooldownSeconds: 0.5, energyCost: 0,
    modelPrefabId: 'super-wings/Jett+pose+3d+model', damageEvents: dmg(14, 'impact', ['melee', 'speed']), hitVolume: hv({ shape: 'cone', radius: 4, angleDegrees: 80 }), editorMeta: { displayName: 'Jet Dash Slash', themeColor: '#e8442c' } }),
  skill({ id: 'jett_charge', ownerCharacterId: 'char_jett', slot: 2, name: 'Sonic Charge', attackType: 'charge', cooldownSeconds: 4, energyCost: 15, speed: 12,
    damageEvents: dmg(26, 'impact', ['charge']), knockbackForce: 6, hitVolume: hv({ shape: 'box', length: 6, width: 2.4 }), editorMeta: { displayName: 'Sonic Charge', themeColor: '#e8442c' } }),
  skill({ id: 'jett_plane_shot', ownerCharacterId: 'char_jett', slot: 3, name: 'Wing Missile', attackType: 'projectile', cooldownSeconds: 2, energyCost: 18,
    projectile: { modelAssetId: 'super-wings/Jett+airplane+3d+model', speed: 22, lifetimeSeconds: 2.5, movement: 'linear', radius: 2.2 }, damageEvents: dmg(24, 'impact', ['ranged']), editorMeta: { displayName: 'Wing Missile', themeColor: '#e8442c' } }),
  skill({ id: 'jett_cyclone', ownerCharacterId: 'char_jett', slot: 4, name: 'Jetstream Cyclone', attackType: 'ring-aoe', cooldownSeconds: 6, energyCost: 30, durationSeconds: 1,
    damageEvents: dmg(18, 'impact', ['aoe', 'wind']), hitVolume: hv({ shape: 'sphere', origin: 'character-root', radius: 6 }), editorMeta: { displayName: 'Jetstream Cyclone', themeColor: '#e8442c' } }),
  skill({ id: 'jett_evade', ownerCharacterId: 'char_jett', slot: 5, name: 'Afterimage Evade', attackType: 'none', defenseType: 'quick-dash-iframe', cooldownSeconds: 3, energyCost: 8, durationSeconds: 0.4, defenseValue: 1, damageEvents: [], editorMeta: { displayName: 'Afterimage Evade', themeColor: '#fca5a5' } }),
  skill({ id: 'jett_overdrive', ownerCharacterId: 'char_jett', slot: 6, name: 'Global Rescue Overdrive', attackType: 'air-support', skillCategory: 'ultimate', cooldownSeconds: 18, energyCost: 50,
    projectile: { modelAssetId: 'super-wings/Jett+airplane+3d+model', speed: 18, lifetimeSeconds: 3, movement: 'homing', radius: 3, count: 4, spreadDeg: 60 }, damageEvents: dmg(30, 'impact', ['air-support']), editorMeta: { displayName: 'Global Rescue Overdrive', themeColor: '#e8442c' } }),
];

// ---------------- Donnie — engineer / builder ----------------
const DONNIE: CombatSkillDefinition[] = [
  skill({ id: 'donnie_tool_combo', ownerCharacterId: 'char_donnie', slot: 1, name: 'Tool Arm Combo', attackType: 'melee', cooldownSeconds: 0.6, damageEvents: dmg(13, 'impact', ['melee', 'tool']), hitVolume: hv({ shape: 'cone', radius: 3.5, angleDegrees: 90 }), editorMeta: { displayName: 'Tool Arm Combo', themeColor: '#f5b21e' } }),
  skill({ id: 'donnie_hammer', ownerCharacterId: 'char_donnie', slot: 2, name: 'Hammer Smash', attackType: 'heavy', cooldownSeconds: 3.5, energyCost: 15, damageEvents: dmg(34, 'impact', ['heavy']), knockbackForce: 5, hitVolume: hv({ shape: 'box', length: 4, width: 3 }), editorMeta: { displayName: 'Hammer Smash', themeColor: '#f5b21e' } }),
  skill({ id: 'donnie_crate_toss', ownerCharacterId: 'char_donnie', slot: 3, name: 'Crate Toss', attackType: 'lobbed', cooldownSeconds: 2.4, energyCost: 16,
    projectile: { modelAssetId: 'props/stacked cardboard boxes 3d model', speed: 11, lifetimeSeconds: 3, movement: 'lobbed', radius: 2.6 }, damageEvents: dmg(20, 'impact', ['ranged']), editorMeta: { displayName: 'Crate Toss', themeColor: '#f5b21e' } }),
  skill({ id: 'donnie_build_wall', ownerCharacterId: 'char_donnie', slot: 4, name: 'Build Wall', attackType: 'terrain', cooldownSeconds: 8, energyCost: 25,
    terrain: { modelAssetId: 'outerior_decors/construction barrier 3d model', count: 1, lifetimeSeconds: 10, radius: 2.5, blocksMovement: true }, editorMeta: { displayName: 'Build Wall', themeColor: '#f5b21e' } }),
  skill({ id: 'donnie_cover', ownerCharacterId: 'char_donnie', slot: 5, name: 'Emergency Barricade', attackType: 'none', defenseType: 'cover-spawn', cooldownSeconds: 7, energyCost: 18, durationSeconds: 5, defenseValue: 0.6, damageEvents: [],
    terrain: { modelAssetId: 'props/shipping container 3d model', count: 1, lifetimeSeconds: 5, radius: 2.5, blocksMovement: true }, editorMeta: { displayName: 'Emergency Barricade', themeColor: '#fde68a' } }),
  skill({ id: 'donnie_turret', ownerCharacterId: 'char_donnie', slot: 6, name: 'Repair Turret', attackType: 'summon', skillCategory: 'ultimate', cooldownSeconds: 16, energyCost: 45,
    summon: { modelAssetId: 'characters/Carey drone 3d model', count: 2, lifetimeSeconds: 14, behavior: 'orbit', attackIntervalSeconds: 1.2, attackDamage: 12, attackRadius: 8 }, editorMeta: { displayName: 'Repair Turret', themeColor: '#f5b21e' } }),
];

// ---------------- Paul — police / control ----------------
const PAUL: CombatSkillDefinition[] = [
  skill({ id: 'paul_baton', ownerCharacterId: 'char_paul', slot: 1, name: 'Patrol Baton', attackType: 'melee', cooldownSeconds: 0.6, damageEvents: dmg(12, 'impact', ['melee']), hitVolume: hv({ shape: 'cone', radius: 3, angleDegrees: 70 }), editorMeta: { displayName: 'Patrol Baton', themeColor: '#2b4c8c' } }),
  skill({ id: 'paul_shield_bash', ownerCharacterId: 'char_paul', slot: 2, name: 'Shield Bash', attackType: 'heavy', cooldownSeconds: 3, energyCost: 12, damageEvents: dmg(24, 'impact', ['heavy']), knockbackForce: 7, hitVolume: hv({ shape: 'box', length: 3.5, width: 2.5 }), editorMeta: { displayName: 'Shield Bash', themeColor: '#2b4c8c' } }),
  skill({ id: 'paul_cuff', ownerCharacterId: 'char_paul', slot: 3, name: 'Containment Cuff', attackType: 'pull', cooldownSeconds: 5, energyCost: 20, knockbackForce: 6, stunDurationSeconds: 1.5, damageEvents: dmg(8, 'stun', ['control']), hitVolume: hv({ shape: 'line', length: 12, width: 1.6, activeDurationSeconds: 0.3 }), editorMeta: { displayName: 'Containment Cuff', themeColor: '#2b4c8c' } }),
  skill({ id: 'paul_barrier', ownerCharacterId: 'char_paul', slot: 4, name: 'Traffic Barrier Line', attackType: 'terrain', cooldownSeconds: 7, energyCost: 22,
    terrain: { modelAssetId: 'props/safety railing 3d model', count: 3, lifetimeSeconds: 9, radius: 2, blocksMovement: true }, editorMeta: { displayName: 'Traffic Barrier Line', themeColor: '#2b4c8c' } }),
  skill({ id: 'paul_shield', ownerCharacterId: 'char_paul', slot: 5, name: 'Police Shield Wall', attackType: 'none', defenseType: 'front-shield', cooldownSeconds: 6, energyCost: 15, durationSeconds: 3, defenseValue: 0.7, damageEvents: [], editorMeta: { displayName: 'Police Shield Wall', themeColor: '#93c5fd' } }),
  skill({ id: 'paul_lockdown', ownerCharacterId: 'char_paul', slot: 6, name: 'Citywide Lockdown', attackType: 'charge', skillCategory: 'ultimate', cooldownSeconds: 16, energyCost: 45, speed: 14,
    modelPrefabId: 'characters/Poli car 3d model', damageEvents: dmg(32, 'impact', ['charge', 'control']), knockbackForce: 8, hitVolume: hv({ shape: 'box', length: 8, width: 3 }), editorMeta: { displayName: 'Citywide Lockdown', themeColor: '#2b4c8c' } }),
];

// ---------------- Todd — construction / drill ----------------
const TODD: CombatSkillDefinition[] = [
  skill({ id: 'todd_drill_jab', ownerCharacterId: 'char_todd', slot: 1, name: 'Drill Jab', attackType: 'melee', cooldownSeconds: 0.5, damageEvents: dmg(16, 'impact', ['melee', 'drill', 'armor-break']), hitVolume: hv({ shape: 'cone', radius: 3, angleDegrees: 50 }), editorMeta: { displayName: 'Drill Jab', themeColor: '#b5793a' } }),
  skill({ id: 'todd_armor_bore', ownerCharacterId: 'char_todd', slot: 2, name: 'Armor Bore', attackType: 'line-pierce', cooldownSeconds: 4, energyCost: 18, damageEvents: dmg(28, 'shield-break', ['pierce', 'armor-break']), hitVolume: hv({ shape: 'line', length: 14, width: 1.6, activeDurationSeconds: 0.3 }), editorMeta: { displayName: 'Armor Bore', themeColor: '#b5793a' } }),
  skill({ id: 'todd_boulder', ownerCharacterId: 'char_todd', slot: 3, name: 'Boulder Throw', attackType: 'lobbed', cooldownSeconds: 2.6, energyCost: 18,
    projectile: { modelAssetId: 'decor/rock boulder 3d model', speed: 12, lifetimeSeconds: 3, movement: 'lobbed', radius: 3 }, damageEvents: dmg(26, 'impact', ['ranged']), editorMeta: { displayName: 'Boulder Throw', themeColor: '#b5793a' } }),
  skill({ id: 'todd_spikes', ownerCharacterId: 'char_todd', slot: 4, name: 'Terrain Spikes', attackType: 'trap', cooldownSeconds: 7, energyCost: 24,
    terrain: { modelAssetId: 'outerior_decors/construction toy blocks 3d model', count: 3, lifetimeSeconds: 6, radius: 2.4, damagePerTick: 8, tickIntervalSeconds: 0.7 }, damageEvents: dmg(8, 'impact', ['terrain']), editorMeta: { displayName: 'Terrain Spikes', themeColor: '#b5793a' } }),
  skill({ id: 'todd_burrow', ownerCharacterId: 'char_todd', slot: 5, name: 'Burrow Dash', attackType: 'none', defenseType: 'quick-dash-iframe', cooldownSeconds: 4, energyCost: 10, durationSeconds: 0.6, defenseValue: 1, damageEvents: [], editorMeta: { displayName: 'Burrow Dash', themeColor: '#fcd34d' } }),
  skill({ id: 'todd_quake', ownerCharacterId: 'char_todd', slot: 6, name: 'Earth Core Breaker', attackType: 'shockwave', skillCategory: 'ultimate', cooldownSeconds: 15, energyCost: 45, damageEvents: dmg(40, 'impact', ['aoe', 'quake', 'armor-break']), hitVolume: hv({ shape: 'sphere', origin: 'character-root', radius: 8 }), editorMeta: { displayName: 'Earth Core Breaker', themeColor: '#b5793a' } }),
];

// ---------------- Chase — recon / precision ----------------
const CHASE: CombatSkillDefinition[] = [
  skill({ id: 'chase_pulse', ownerCharacterId: 'char_chase', slot: 1, name: 'Covert Pulse Shot', attackType: 'projectile', cooldownSeconds: 0.7,
    projectile: { modelAssetId: 'decor/glowing flower 3d model', speed: 24, lifetimeSeconds: 2, movement: 'linear', radius: 1.4 }, damageEvents: dmg(11, 'energy', ['precision']), editorMeta: { displayName: 'Covert Pulse Shot', themeColor: '#3b4a78' } }),
  skill({ id: 'chase_heavy_shot', ownerCharacterId: 'char_chase', slot: 2, name: 'Charged Shot', attackType: 'heavy', cooldownSeconds: 3, energyCost: 16, damageEvents: dmg(30, 'energy', ['precision', 'heavy']), hitVolume: hv({ shape: 'line', length: 16, width: 1.4, activeDurationSeconds: 0.25 }), editorMeta: { displayName: 'Charged Shot', themeColor: '#3b4a78' } }),
  skill({ id: 'chase_marked', ownerCharacterId: 'char_chase', slot: 3, name: 'Seeker Mark', attackType: 'homing', cooldownSeconds: 4, energyCost: 20,
    projectile: { modelAssetId: 'decor/glowing flower 3d model', speed: 12, lifetimeSeconds: 4, movement: 'homing', radius: 2, count: 3, spreadDeg: 30 }, damageEvents: dmg(14, 'energy', ['precision']), editorMeta: { displayName: 'Seeker Mark', themeColor: '#3b4a78' } }),
  skill({ id: 'chase_grid', ownerCharacterId: 'char_chase', slot: 4, name: 'Marked Execution Grid', attackType: 'ring-aoe', cooldownSeconds: 7, energyCost: 28, damageEvents: dmg(22, 'energy', ['aoe', 'precision']), hitVolume: hv({ shape: 'sphere', origin: 'character-root', radius: 7 }), editorMeta: { displayName: 'Marked Execution Grid', themeColor: '#3b4a78' } }),
  skill({ id: 'chase_cloak', ownerCharacterId: 'char_chase', slot: 5, name: 'Decoy Jammer', attackType: 'none', defenseType: 'quick-dash-iframe', cooldownSeconds: 6, energyCost: 14, durationSeconds: 1, defenseValue: 1, damageEvents: [], editorMeta: { displayName: 'Decoy Jammer', themeColor: '#93c5fd' } }),
  skill({ id: 'chase_blackbox', ownerCharacterId: 'char_chase', slot: 6, name: 'Black Box Assassination', attackType: 'summon', skillCategory: 'ultimate', cooldownSeconds: 16, energyCost: 45,
    summon: { modelAssetId: 'characters/Carey drone 3d model', count: 3, lifetimeSeconds: 8, behavior: 'seek', attackIntervalSeconds: 0.8, attackDamage: 16, attackRadius: 3 }, editorMeta: { displayName: 'Black Box Assassination', themeColor: '#3b4a78' } }),
];

// ---------------- Jerome — acrobat / AOE ----------------
const JEROME: CombatSkillDefinition[] = [
  skill({ id: 'jerome_dance', ownerCharacterId: 'char_jerome', slot: 1, name: 'Aero Dance Combo', attackType: 'fan', cooldownSeconds: 0.6, damageEvents: dmg(12, 'impact', ['melee', 'fan']), hitVolume: hv({ shape: 'cone', radius: 4, angleDegrees: 160 }), editorMeta: { displayName: 'Aero Dance Combo', themeColor: '#2f6fd6' } }),
  skill({ id: 'jerome_spin', ownerCharacterId: 'char_jerome', slot: 2, name: 'Spin Kick Vortex', attackType: 'ring-aoe', cooldownSeconds: 3, energyCost: 14, damageEvents: dmg(20, 'impact', ['aoe']), knockbackForce: 5, hitVolume: hv({ shape: 'sphere', origin: 'character-root', radius: 5 }), editorMeta: { displayName: 'Spin Kick Vortex', themeColor: '#2f6fd6' } }),
  skill({ id: 'jerome_dive', ownerCharacterId: 'char_jerome', slot: 3, name: 'Spotlight Dive', attackType: 'lobbed', cooldownSeconds: 3.5, energyCost: 18,
    projectile: { modelAssetId: 'props/colorful ring stack 3d model', speed: 13, lifetimeSeconds: 2.5, movement: 'lobbed', radius: 3 }, damageEvents: dmg(22, 'impact', ['ranged']), editorMeta: { displayName: 'Spotlight Dive', themeColor: '#2f6fd6' } }),
  skill({ id: 'jerome_showtime', ownerCharacterId: 'char_jerome', slot: 4, name: 'Showtime Spiral', attackType: 'dot-zone', cooldownSeconds: 8, energyCost: 30,
    terrain: { modelAssetId: 'props/colorful ring stack 3d model', count: 1, lifetimeSeconds: 5, radius: 6, damagePerTick: 6, tickIntervalSeconds: 0.6 }, damageEvents: dmg(6, 'impact', ['aoe']), editorMeta: { displayName: 'Showtime Spiral', themeColor: '#2f6fd6' } }),
  skill({ id: 'jerome_deflect', ownerCharacterId: 'char_jerome', slot: 5, name: 'Rhythm Deflect', attackType: 'none', defenseType: 'reflect-wall', cooldownSeconds: 6, energyCost: 16, durationSeconds: 2, defenseValue: 1, damageEvents: [], editorMeta: { displayName: 'Rhythm Deflect', themeColor: '#93c5fd' } }),
  skill({ id: 'jerome_grand', ownerCharacterId: 'char_jerome', slot: 6, name: 'Grand Sky Performance', attackType: 'ring-aoe', skillCategory: 'ultimate', cooldownSeconds: 15, energyCost: 45, damageEvents: dmg(36, 'impact', ['aoe']), hitVolume: hv({ shape: 'sphere', origin: 'character-root', radius: 9 }), editorMeta: { displayName: 'Grand Sky Performance', themeColor: '#2f6fd6' } }),
];

// ---------------- Bello — sound / nature ----------------
const BELLO: CombatSkillDefinition[] = [
  skill({ id: 'bello_call', ownerCharacterId: 'char_bello', slot: 1, name: 'Wild Call Pulse', attackType: 'fan', cooldownSeconds: 0.6, damageEvents: dmg(11, 'energy', ['sonic', 'fan']), hitVolume: hv({ shape: 'cone', radius: 5, angleDegrees: 60 }), editorMeta: { displayName: 'Wild Call Pulse', themeColor: '#8a6240' } }),
  skill({ id: 'bello_howl', ownerCharacterId: 'char_bello', slot: 2, name: 'Sonic Howl', attackType: 'heavy', cooldownSeconds: 3, energyCost: 14, damageEvents: dmg(24, 'energy', ['sonic', 'heavy']), knockbackForce: 6, hitVolume: hv({ shape: 'cone', radius: 6, angleDegrees: 90 }), editorMeta: { displayName: 'Sonic Howl', themeColor: '#8a6240' } }),
  skill({ id: 'bello_pulse_shot', ownerCharacterId: 'char_bello', slot: 3, name: 'Echo Bolt', attackType: 'projectile', cooldownSeconds: 2, energyCost: 14,
    projectile: { modelAssetId: 'decor/japanese lantern 3d model', speed: 16, lifetimeSeconds: 2.5, movement: 'linear', radius: 2.2 }, damageEvents: dmg(18, 'energy', ['sonic']), editorMeta: { displayName: 'Echo Bolt', themeColor: '#8a6240' } }),
  skill({ id: 'bello_echo_field', ownerCharacterId: 'char_bello', slot: 4, name: 'Savanna Echo Field', attackType: 'dot-zone', cooldownSeconds: 8, energyCost: 28,
    terrain: { modelAssetId: 'decor/round leafy bush 3d model', count: 1, lifetimeSeconds: 6, radius: 6, damagePerTick: 5, tickIntervalSeconds: 0.6 }, damageEvents: dmg(5, 'energy', ['aoe']), editorMeta: { displayName: 'Savanna Echo Field', themeColor: '#8a6240' } }),
  skill({ id: 'bello_screen', ownerCharacterId: 'char_bello', slot: 5, name: 'Nature Screen', attackType: 'none', defenseType: 'damage-reduction-zone', cooldownSeconds: 7, energyCost: 16, durationSeconds: 4, defenseValue: 0.6, damageEvents: [], editorMeta: { displayName: 'Nature Screen', themeColor: '#86efac' } }),
  skill({ id: 'bello_wild', ownerCharacterId: 'char_bello', slot: 6, name: 'Call of the Wild', attackType: 'summon', skillCategory: 'ultimate', cooldownSeconds: 16, energyCost: 45,
    summon: { modelAssetId: 'yokais/brave+cat+warrior+3d+model', count: 2, lifetimeSeconds: 12, behavior: 'seek', attackIntervalSeconds: 1, attackDamage: 14, attackRadius: 3 }, editorMeta: { displayName: 'Call of the Wild', themeColor: '#8a6240' } }),
];

// ---------------- Flip — sport / bounce ----------------
const FLIP: CombatSkillDefinition[] = [
  skill({ id: 'flip_kick', ownerCharacterId: 'char_flip', slot: 1, name: 'Sport Combo Kick', attackType: 'melee', cooldownSeconds: 0.5, damageEvents: dmg(12, 'impact', ['melee']), hitVolume: hv({ shape: 'cone', radius: 3.5, angleDegrees: 80 }), editorMeta: { displayName: 'Sport Combo Kick', themeColor: '#e23b2e' } }),
  skill({ id: 'flip_smash', ownerCharacterId: 'char_flip', slot: 2, name: 'Air Smash', attackType: 'heavy', cooldownSeconds: 3, energyCost: 14, damageEvents: dmg(24, 'impact', ['heavy']), knockbackForce: 6, hitVolume: hv({ shape: 'box', length: 3.5, width: 2.5 }), editorMeta: { displayName: 'Air Smash', themeColor: '#e23b2e' } }),
  skill({ id: 'flip_ricochet', ownerCharacterId: 'char_flip', slot: 3, name: 'Ricochet Ball', attackType: 'projectile', cooldownSeconds: 1.8, energyCost: 12,
    projectile: { modelAssetId: 'decor/inflatable torus 3d model', speed: 18, lifetimeSeconds: 3, movement: 'linear', radius: 2 }, damageEvents: dmg(16, 'impact', ['ranged', 'bounce']), editorMeta: { displayName: 'Ricochet Ball', themeColor: '#e23b2e' } }),
  skill({ id: 'flip_stadium', ownerCharacterId: 'char_flip', slot: 4, name: 'Stadium Bounce Storm', attackType: 'ring-aoe', cooldownSeconds: 7, energyCost: 28, damageEvents: dmg(20, 'impact', ['aoe', 'bounce']), hitVolume: hv({ shape: 'sphere', origin: 'character-root', radius: 6 }), editorMeta: { displayName: 'Stadium Bounce Storm', themeColor: '#e23b2e' } }),
  skill({ id: 'flip_rebound', ownerCharacterId: 'char_flip', slot: 5, name: 'Rebound Guard', attackType: 'none', defenseType: 'reflect-wall', cooldownSeconds: 6, energyCost: 14, durationSeconds: 2, defenseValue: 1, damageEvents: [], editorMeta: { displayName: 'Rebound Guard', themeColor: '#fca5a5' } }),
  skill({ id: 'flip_hyper', ownerCharacterId: 'char_flip', slot: 6, name: 'Hyper Trick Stadium', attackType: 'lobbed', skillCategory: 'ultimate', cooldownSeconds: 15, energyCost: 45,
    projectile: { modelAssetId: 'decor/inflatable torus 3d model', speed: 14, lifetimeSeconds: 3, movement: 'lobbed', radius: 3, count: 5, spreadDeg: 70 }, damageEvents: dmg(24, 'impact', ['aoe', 'bounce']), editorMeta: { displayName: 'Hyper Trick Stadium', themeColor: '#e23b2e' } }),
];

export const SEED_CHARACTER_SKILLS: CombatSkillDefinition[] = [
  ...JETT, ...DONNIE, ...PAUL, ...TODD, ...CHASE, ...JEROME, ...BELLO, ...FLIP,
];
