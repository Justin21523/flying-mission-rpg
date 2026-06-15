import { buildCharacter, type AbilitySpec } from './abilityFactory';

// Bello — Wild / Nature / Summon / Sense (Batch F.5).
const SPECS: AbilitySpec[] = [
  { key: 'wild_call', name: 'Wild Call Pulse', desc: 'A forward sound-wave cone.', category: 'attack', slot: 'attack-1', attackType: 'melee', dmg: 13, cooldown: 0.6, energy: 0, shape: 'cone', range: 5, angle: 70, damageType: 'energy', tags: ['wild', 'sound'] },
  { key: 'animal_rush', name: 'Animal Assist Rush', desc: 'Summon an animal spirit to charge.', category: 'attack', slot: 'attack-2', attackType: 'charge', dmg: 20, cooldown: 5, energy: 16, shape: 'line', length: 8, width: 1.6, tags: ['wild', 'summon'] },
  { key: 'savanna_echo', name: 'Savanna Echo Strike', desc: 'A wide echoing sound shockwave.', category: 'attack', slot: 'attack-3', attackType: 'ring-aoe', dmg: 16, cooldown: 6, energy: 20, shape: 'cylinder', range: 7, damageType: 'energy', tags: ['wild', 'aoe', 'sound'], intensity: 3 },
  { key: 'predator_mark', name: 'Predator Mark', desc: 'Mark a weakpoint and call a strike.', category: 'attack', slot: 'attack-4', attackType: 'line-pierce', dmg: 10, cooldown: 5, energy: 14, shape: 'line', length: 10, width: 1, scan: true, duration: 8, damageType: 'energy', tags: ['wild', 'scan', 'reveal', 'weakpoint'], hooks: { affectsEnemies: true, canExposeWeakpoint: true, affectsBossWeakpoints: true, appliesStatusTags: ['scanned'] } },
  { key: 'nature_snare', name: 'Nature Snare', desc: 'Roots/vines snare enemies in an area.', category: 'attack', slot: 'attack-5', attackType: 'dot-zone', dmg: 8, cooldown: 7, energy: 18, shape: 'cylinder', range: 5, stun: 1.5, damageType: 'energy', tags: ['wild', 'control'], hooks: { affectsEnemies: true, appliesStatusTags: ['snared'] } },
  { key: 'beast_roar', name: 'Beast Roar Break', desc: 'A powerful roar that interrupts enemies.', category: 'attack', slot: 'attack-6', attackType: 'shockwave', dmg: 18, cooldown: 8, energy: 22, shape: 'cone', range: 6, angle: 80, knockback: 6, damageType: 'energy', tags: ['wild', 'sound'], intensity: 3 },
  { key: 'nature_screen', name: 'Nature Screen', desc: 'A half-dome nature shield.', category: 'defense', slot: 'defense-1', defenseType: 'front-shield', defenseValue: 0.65, cooldown: 7, energy: 16, duration: 4 },
  { key: 'wild_instinct', name: 'Wild Instinct Dodge', desc: 'Sense an attack and side-step.', category: 'defense', slot: 'defense-2', defenseType: 'quick-dash-iframe', defenseValue: 1, cooldown: 6, energy: 12, duration: 0.9 },
  { key: 'companion_cover', name: 'Companion Cover', desc: 'A spirit companion blocks a hit.', category: 'defense', slot: 'defense-3', defenseType: 'cover-spawn', defenseValue: 0.6, cooldown: 9, energy: 18, duration: 5 },
  { key: 'call_of_wild', name: 'Call of the Wild Sky', desc: 'Many animal spirits sweep the field.', category: 'ultimate', slot: 'ultimate-1', attackType: 'summon', dmg: 26, cooldown: 16, energy: 45, shape: 'cylinder', range: 9, damageType: 'energy', tags: ['wild', 'ultimate', 'summon'], intensity: 5, hooks: { affectsEnemies: true } },
  { key: 'primal_echo', name: 'Primal Echo Domain', desc: 'A nature sound domain slows + marks enemies.', category: 'ultimate', slot: 'ultimate-2', attackType: 'ring-aoe', dmg: 30, cooldown: 20, energy: 55, shape: 'cylinder', range: 11, scan: true, damageType: 'energy', tags: ['wild', 'ultimate', 'aoe', 'scan'], intensity: 5, hooks: { affectsEnemies: true, canExposeWeakpoint: true, appliesStatusTags: ['scanned', 'slowed'] } },
];

export const BELLO_ABILITIES = buildCharacter('char_bello', 'wild', '#8a6240', SPECS);
