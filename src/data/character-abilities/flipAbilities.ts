import { buildCharacter, type AbilitySpec } from './abilityFactory';

// Flip — Sport / Bounce / Combo (Batch F.5).
const SPECS: AbilitySpec[] = [
  { key: 'combo_kick', name: 'Sport Combo Kick', desc: 'A fast sport kick combo.', category: 'attack', slot: 'attack-1', attackType: 'melee', dmg: 13, cooldown: 0.6, energy: 0, shape: 'cone', range: 4, angle: 70, tags: ['sport', 'melee'] },
  { key: 'ricochet_ball', name: 'Ricochet Ball', desc: 'Fire a bouncing energy ball.', category: 'attack', slot: 'attack-2', attackType: 'projectile', dmg: 18, cooldown: 4, energy: 14, shape: 'sphere', range: 3, tags: ['sport', 'bounce'] },
  { key: 'bounce_pad', name: 'Bounce Pad Strike', desc: 'Drop a pad and launch into a strike.', category: 'attack', slot: 'attack-3', attackType: 'terrain', dmg: 18, cooldown: 6, energy: 18, shape: 'cylinder', range: 4, tags: ['sport', 'launch'], hooks: { affectsEnemies: true, affectsObstacles: true } },
  { key: 'stadium_storm', name: 'Stadium Bounce Storm', desc: 'Many balls ricochet around the area.', category: 'attack', slot: 'attack-4', attackType: 'ring-aoe', dmg: 15, cooldown: 7, energy: 22, shape: 'cylinder', range: 6, tags: ['sport', 'aoe'], intensity: 3 },
  { key: 'wall_trick', name: 'Wall Trick Shot', desc: 'A high-damage wall-reflected shot.', category: 'attack', slot: 'attack-5', attackType: 'line-pierce', dmg: 24, cooldown: 5, energy: 18, shape: 'line', length: 12, width: 1.2, tags: ['sport', 'precision'] },
  { key: 'air_trick', name: 'Air Trick Finisher', desc: 'A slow-motion aerial finisher kick.', category: 'attack', slot: 'attack-6', attackType: 'heavy', dmg: 26, cooldown: 8, energy: 24, shape: 'cone', range: 5, angle: 90, tags: ['sport', 'combo'], intensity: 3 },
  { key: 'rebound_guard', name: 'Rebound Guard', desc: 'A round pad that rebounds projectiles.', category: 'defense', slot: 'defense-1', defenseType: 'reflect-wall', defenseValue: 0.7, cooldown: 7, energy: 14, duration: 1 },
  { key: 'acrobatic_flip', name: 'Acrobatic Flip Dodge', desc: 'A flipping dodge.', category: 'defense', slot: 'defense-2', defenseType: 'quick-dash-iframe', defenseValue: 1, cooldown: 6, energy: 12, duration: 0.9 },
  { key: 'barrier_net', name: 'Sport Barrier Net', desc: 'Deploy an elastic net barrier.', category: 'defense', slot: 'defense-3', defenseType: 'front-shield', defenseValue: 0.6, cooldown: 9, energy: 18, duration: 4 },
  { key: 'hyper_stadium', name: 'Hyper Trick Stadium', desc: 'A stadium of fast ricocheting balls.', category: 'ultimate', slot: 'ultimate-1', attackType: 'ring-aoe', dmg: 30, cooldown: 18, energy: 50, shape: 'cylinder', range: 9, tags: ['sport', 'ultimate', 'aoe'], intensity: 5 },
  { key: 'goal_meteor', name: 'Final Goal Meteor Kick', desc: 'Wind up and kick a giant energy ball.', category: 'ultimate', slot: 'ultimate-2', attackType: 'lobbed', dmg: 42, cooldown: 20, energy: 55, shape: 'sphere', range: 8, tags: ['sport', 'ultimate'], intensity: 5 },
];

export const FLIP_ABILITIES = buildCharacter('char_flip', 'sport', '#e23b2e', SPECS);
