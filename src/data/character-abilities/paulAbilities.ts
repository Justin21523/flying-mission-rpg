import { buildCharacter, type AbilitySpec } from './abilityFactory';

// Paul — Police / Shield / Control (Batch F.5).
const SPECS: AbilitySpec[] = [
  { key: 'baton_strike', name: 'Patrol Baton Strike', desc: 'A quick police baton combo.', category: 'attack', slot: 'attack-1', attackType: 'melee', dmg: 13, cooldown: 0.6, energy: 0, shape: 'box', length: 3.5, width: 2.4, tags: ['police', 'melee'] },
  { key: 'containment_cuff', name: 'Containment Cuff', desc: 'Restrain an enemy with energy cuffs.', category: 'attack', slot: 'attack-2', attackType: 'line-pierce', dmg: 8, cooldown: 5, energy: 14, shape: 'line', length: 10, width: 1, stun: 2, tags: ['police', 'control', 'restraint'], hooks: { affectsEnemies: true, appliesStatusTags: ['stunned'] } },
  { key: 'traffic_barrier', name: 'Traffic Barrier Slam', desc: 'Push a barrier forward into enemies.', category: 'attack', slot: 'attack-3', attackType: 'terrain', dmg: 16, cooldown: 7, energy: 20, shape: 'box', length: 5, width: 3, knockback: 6, tags: ['police', 'control'], hooks: { affectsEnemies: true, affectsObstacles: true } },
  { key: 'siren_pulse', name: 'Siren Pulse', desc: 'A siren shock ring that slows enemies.', category: 'attack', slot: 'attack-4', attackType: 'ring-aoe', dmg: 12, cooldown: 6, energy: 18, shape: 'cylinder', range: 7, tags: ['police', 'aoe', 'slow'], intensity: 3, hooks: { affectsEnemies: true, appliesStatusTags: ['slowed'] } },
  { key: 'shield_bash', name: 'Shield Bash Line', desc: 'A forward shield charge.', category: 'attack', slot: 'attack-5', attackType: 'charge', dmg: 18, cooldown: 5, energy: 16, shape: 'line', length: 6, width: 2, knockback: 5, tags: ['police', 'melee'] },
  { key: 'order_breaker', name: 'Order Breaker Strike', desc: 'Heavy hit vs restrained/stunned enemies.', category: 'attack', slot: 'attack-6', attackType: 'heavy', dmg: 28, cooldown: 8, energy: 24, shape: 'box', length: 4, width: 3, tags: ['police', 'precision'], intensity: 3 },
  { key: 'shield_wall', name: 'Police Shield Wall', desc: 'A front shield that blocks fire.', category: 'defense', slot: 'defense-1', defenseType: 'front-shield', defenseValue: 0.7, cooldown: 7, energy: 16, duration: 4 },
  { key: 'traffic_control', name: 'Traffic Control Field', desc: 'A zone that slows enemies and projectiles.', category: 'defense', slot: 'defense-2', defenseType: 'damage-reduction-zone', defenseValue: 0.5, cooldown: 9, energy: 18, duration: 5 },
  { key: 'authority_guard', name: 'Perfect Authority Guard', desc: 'A precise parry that counters.', category: 'defense', slot: 'defense-3', defenseType: 'perfect-guard', defenseValue: 1, cooldown: 8, energy: 14, duration: 0.6 },
  { key: 'lockdown', name: 'Citywide Lockdown', desc: 'A large barrier grid that restrains + blocks.', category: 'ultimate', slot: 'ultimate-1', attackType: 'ring-aoe', dmg: 22, cooldown: 18, energy: 50, shape: 'cylinder', range: 9, stun: 2, tags: ['police', 'ultimate', 'control'], intensity: 5, hooks: { affectsEnemies: true, appliesStatusTags: ['stunned'] } },
  { key: 'justice_convoy', name: 'Justice Convoy Charge', desc: 'An energy convoy charges across the field.', category: 'ultimate', slot: 'ultimate-2', attackType: 'air-support', dmg: 34, cooldown: 20, energy: 55, shape: 'box', length: 16, width: 4, knockback: 8, tags: ['police', 'ultimate'], intensity: 5 },
];

export const PAUL_ABILITIES = buildCharacter('char_paul', 'police', '#2b4c8c', SPECS);
