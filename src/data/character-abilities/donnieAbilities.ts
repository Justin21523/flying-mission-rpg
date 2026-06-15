import { buildCharacter, type AbilitySpec } from './abilityFactory';

// Donnie — Engineering / Repair / Build (Batch F.5).
const SPECS: AbilitySpec[] = [
  { key: 'tool_arm', name: 'Tool Arm Combo', desc: 'A three-hit tool-arm combo.', category: 'attack', slot: 'attack-1', attackType: 'melee', dmg: 13, cooldown: 0.6, energy: 0, shape: 'box', length: 3.5, width: 2.4, tags: ['engineering', 'melee', 'heavy-impact'] },
  { key: 'heavy_hammer', name: 'Heavy Hammer Smash', desc: 'A heavy hammer slam that cracks ground.', category: 'attack', slot: 'attack-2', attackType: 'heavy', dmg: 28, cooldown: 3.5, energy: 16, shape: 'box', length: 4, width: 3, tags: ['engineering', 'heavy-impact', 'drill'], hooks: { affectsEnemies: true, affectsObstacles: true, effectiveAgainstObstacleTypes: ['cracked-wall'] }, intensity: 3 },
  { key: 'repair_overload', name: 'Repair Beam Overload', desc: 'A repair beam overloaded against machines.', category: 'attack', slot: 'attack-3', attackType: 'line-pierce', dmg: 18, cooldown: 5, energy: 16, shape: 'line', length: 9, width: 1.2, damageType: 'energy', tags: ['engineering', 'energy'] },
  { key: 'build_cover', name: 'Build Cover Launch', desc: 'Assemble panels then launch them.', category: 'attack', slot: 'attack-4', attackType: 'terrain', dmg: 16, cooldown: 7, energy: 22, shape: 'box', length: 4, width: 2.5, tags: ['engineering', 'aoe'], hooks: { affectsEnemies: true, affectsObstacles: true } },
  { key: 'tool_matrix', name: 'Tool Matrix Field', desc: 'A field of rising tool arms.', category: 'attack', slot: 'attack-5', attackType: 'dot-zone', dmg: 8, cooldown: 8, energy: 26, shape: 'cylinder', range: 6, tags: ['engineering', 'aoe', 'repair-field'] },
  { key: 'magnetic_scrap', name: 'Magnetic Scrap Throw', desc: 'Fling magnetised scrap at enemies.', category: 'attack', slot: 'attack-6', attackType: 'projectile', dmg: 22, cooldown: 5, energy: 18, shape: 'sphere', range: 3, tags: ['engineering', 'impact'], intensity: 3 },
  { key: 'barricade', name: 'Emergency Barricade', desc: 'Fold up a quick cover wall.', category: 'defense', slot: 'defense-1', defenseType: 'cover-spawn', defenseValue: 0.6, cooldown: 7, energy: 16, duration: 5 },
  { key: 'auto_repair', name: 'Auto Repair Shell', desc: 'A self-repair shell that regens.', category: 'defense', slot: 'defense-2', defenseType: 'damage-reduction-zone', defenseValue: 0.5, cooldown: 9, energy: 18, duration: 5, repair: 30, hooks: { canRepairDevice: true } },
  { key: 'ground_anchor', name: 'Ground Anchor Brace', desc: 'Anchor down, resisting knockback.', category: 'defense', slot: 'defense-3', defenseType: 'front-shield', defenseValue: 0.6, cooldown: 8, energy: 14, duration: 3 },
  { key: 'mega_constructor', name: 'Mega Constructor Mode', desc: 'A construction rig builds, repairs, demolishes.', category: 'ultimate', slot: 'ultimate-1', attackType: 'summon', cooldown: 16, energy: 45, shape: 'sphere', range: 8, tags: ['engineering', 'ultimate'], intensity: 5, hooks: { affectsEnemies: true, affectsObstacles: true, canRepairDevice: true } },
  { key: 'titan_hammer', name: 'Titan Workshop Hammer', desc: 'Assemble a giant hammer and slam it down.', category: 'ultimate', slot: 'ultimate-2', attackType: 'heavy', dmg: 44, cooldown: 20, energy: 55, shape: 'cylinder', range: 7, tags: ['engineering', 'ultimate', 'heavy-impact'], intensity: 5, hooks: { affectsEnemies: true, affectsObstacles: true } },
];

export const DONNIE_ABILITIES = buildCharacter('char_donnie', 'engineering', '#f5b21e', SPECS);
