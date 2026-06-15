import { buildCharacter, type AbilitySpec } from './abilityFactory';

// Todd — Drill / Ground / Destruction (Batch F.5).
const SPECS: AbilitySpec[] = [
  { key: 'drill_jab', name: 'Drill Jab', desc: 'A spinning drill jab.', category: 'attack', slot: 'attack-1', attackType: 'melee', dmg: 14, cooldown: 0.6, energy: 0, shape: 'cone', range: 3.5, angle: 60, tags: ['drill', 'melee'] },
  { key: 'burrow_dash', name: 'Burrow Dash', desc: 'Burrow underground and dash forward.', category: 'attack', slot: 'attack-2', attackType: 'dash', dmg: 18, cooldown: 4, energy: 14, shape: 'line', length: 10, width: 1.4, tags: ['drill', 'dash'] },
  { key: 'armor_bore', name: 'Armor Bore', desc: 'Sustained armour-piercing drilling.', category: 'attack', slot: 'attack-3', attackType: 'heavy', dmg: 26, cooldown: 3.5, energy: 16, shape: 'cone', range: 4, angle: 50, tags: ['drill', 'heavy-impact', 'armor-pierce'], hooks: { affectsEnemies: true, affectsObstacles: true, effectiveAgainstObstacleTypes: ['cracked-wall'] }, intensity: 3 },
  { key: 'seismic_quake', name: 'Seismic Drillquake', desc: 'Crack the ground in front of you.', category: 'attack', slot: 'attack-4', attackType: 'ring-aoe', dmg: 17, cooldown: 7, energy: 22, shape: 'cylinder', range: 7, tags: ['drill', 'aoe'], hooks: { affectsEnemies: true, affectsObstacles: true }, intensity: 3 },
  { key: 'tunnel_uppercut', name: 'Tunnel Uppercut', desc: 'Erupt from below to launch enemies.', category: 'attack', slot: 'attack-5', attackType: 'shockwave', dmg: 20, cooldown: 5, energy: 16, shape: 'cylinder', range: 4, knockback: 8, tags: ['drill', 'launch'] },
  { key: 'core_break_spiral', name: 'Core Break Spiral', desc: 'A spiral drill that breaks shields.', category: 'attack', slot: 'attack-6', attackType: 'line-pierce', dmg: 24, shieldDmg: 60, cooldown: 8, energy: 24, shape: 'line', length: 12, width: 1.6, damageType: 'shield-break', tags: ['drill', 'shield-break'], hooks: { affectsEnemies: true, canBreakShield: true }, intensity: 3 },
  { key: 'dig_down', name: 'Dig Down', desc: 'Sink underground to dodge.', category: 'defense', slot: 'defense-1', defenseType: 'quick-dash-iframe', defenseValue: 1, cooldown: 6, energy: 12, duration: 1 },
  { key: 'drill_guard', name: 'Drill Guard', desc: 'A spinning drill cone that deflects.', category: 'defense', slot: 'defense-2', defenseType: 'front-shield', defenseValue: 0.6, cooldown: 7, energy: 14, duration: 1.5 },
  { key: 'rock_shell', name: 'Rock Shell', desc: 'Raise rock plates around yourself.', category: 'defense', slot: 'defense-3', defenseType: 'omni-barrier', defenseValue: 0.65, cooldown: 10, energy: 18, duration: 5 },
  { key: 'earth_core_breaker', name: 'Earth Core Breaker', desc: 'A massive drill that bores through armour.', category: 'ultimate', slot: 'ultimate-1', attackType: 'line-pierce', dmg: 40, shieldDmg: 120, cooldown: 18, energy: 50, shape: 'line', length: 16, width: 2.5, damageType: 'shield-break', tags: ['drill', 'ultimate', 'shield-break'], hooks: { affectsEnemies: true, affectsObstacles: true, canBreakShield: true, canDamageBoss: true }, intensity: 5 },
  { key: 'subterranean_collapse', name: 'Subterranean Collapse', desc: 'Chain ground craters sink the enemies.', category: 'ultimate', slot: 'ultimate-2', attackType: 'ring-aoe', dmg: 34, cooldown: 20, energy: 55, shape: 'cylinder', range: 10, tags: ['drill', 'ultimate', 'aoe'], hooks: { affectsEnemies: true, affectsObstacles: true }, intensity: 5 },
];

export const TODD_ABILITIES = buildCharacter('char_todd', 'drill', '#b5793a', SPECS);
