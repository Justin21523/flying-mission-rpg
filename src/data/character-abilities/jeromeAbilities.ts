import { buildCharacter, type AbilitySpec } from './abilityFactory';

// Jerome — Dance / Rhythm / AOE (Batch F.5).
const SPECS: AbilitySpec[] = [
  { key: 'dance_combo', name: 'Aero Dance Combo', desc: 'A three-step rhythm dance strike.', category: 'attack', slot: 'attack-1', attackType: 'melee', dmg: 13, cooldown: 0.6, energy: 0, shape: 'cone', range: 4, angle: 80, tags: ['dance', 'rhythm', 'melee'] },
  { key: 'spin_vortex', name: 'Spin Kick Vortex', desc: 'A spinning kick that clears the area.', category: 'attack', slot: 'attack-2', attackType: 'ring-aoe', dmg: 16, cooldown: 5, energy: 16, shape: 'cylinder', range: 5, tags: ['dance', 'aoe'] },
  { key: 'spotlight_dive', name: 'Spotlight Dive', desc: 'Dive onto a spotlight marker with a shock ring.', category: 'attack', slot: 'attack-3', attackType: 'lobbed', dmg: 20, cooldown: 6, energy: 18, shape: 'sphere', range: 4, tags: ['dance', 'aoe'], hooks: { affectsEnemies: true, affectsObstacles: true } },
  { key: 'rhythm_pulse', name: 'Rhythm Pulse Wave', desc: 'Beat-timed concentric sound waves.', category: 'attack', slot: 'attack-4', attackType: 'shockwave', dmg: 15, cooldown: 6, energy: 20, shape: 'cylinder', range: 7, tags: ['dance', 'aoe', 'rhythm'], intensity: 3 },
  { key: 'waltz_sweep', name: 'Sky Waltz Sweep', desc: 'A wide fan-shaped dance sweep.', category: 'attack', slot: 'attack-5', attackType: 'fan', dmg: 17, cooldown: 5, energy: 16, shape: 'cone', range: 6, angle: 120, tags: ['dance', 'aoe'] },
  { key: 'encore_spiral', name: 'Encore Spiral Strike', desc: 'A spiral follow-up burst after a combo.', category: 'attack', slot: 'attack-6', attackType: 'heavy', dmg: 24, cooldown: 8, energy: 24, shape: 'cone', range: 5, angle: 90, tags: ['dance', 'combo'], intensity: 3 },
  { key: 'rhythm_deflect', name: 'Rhythm Deflect', desc: 'A beat-perfect projectile deflection.', category: 'defense', slot: 'defense-1', defenseType: 'reflect-wall', defenseValue: 0.7, cooldown: 7, energy: 14, duration: 1 },
  { key: 'stage_step', name: 'Stage Step Dodge', desc: 'A dance-step blink to the side.', category: 'defense', slot: 'defense-2', defenseType: 'quick-dash-iframe', defenseValue: 1, cooldown: 6, energy: 12, duration: 0.9 },
  { key: 'performance_guard', name: 'Performance Guard Ring', desc: 'A spinning stage ring that reduces damage.', category: 'defense', slot: 'defense-3', defenseType: 'damage-reduction-zone', defenseValue: 0.5, cooldown: 10, energy: 18, duration: 5 },
  { key: 'grand_performance', name: 'Grand Sky Performance', desc: 'A great aerial stage that empowers rhythm hits.', category: 'ultimate', slot: 'ultimate-1', attackType: 'ring-aoe', dmg: 30, cooldown: 18, energy: 50, shape: 'cylinder', range: 9, tags: ['dance', 'ultimate', 'aoe'], intensity: 5 },
  { key: 'encore_galaxy', name: 'Encore Galaxy Spiral', desc: 'A full-arena spiral dance AOE.', category: 'ultimate', slot: 'ultimate-2', attackType: 'ring-aoe', dmg: 36, cooldown: 20, energy: 55, shape: 'cylinder', range: 11, tags: ['dance', 'ultimate', 'aoe'], intensity: 5 },
];

export const JEROME_ABILITIES = buildCharacter('char_jerome', 'dance', '#2f6fd6', SPECS);
