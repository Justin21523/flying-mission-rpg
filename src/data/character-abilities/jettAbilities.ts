import { buildCharacter, type AbilitySpec } from './abilityFactory';

// Jett — Speed / Rescue / Dash (Batch F.5). 6 attacks / 3 defenses / 2 ultimates.
const SPECS: AbilitySpec[] = [
  { key: 'dash_slash', name: 'Jet Dash Slash', desc: 'High-speed wing-blade dash with a forward arc.', category: 'attack', slot: 'attack-1', attackType: 'charge', dmg: 14, cooldown: 0.6, energy: 0, shape: 'cone', range: 4, angle: 80, tags: ['speed', 'melee', 'dash'] },
  { key: 'rescue_rush', name: 'Rescue Line Rush', desc: 'Lock onto a target and rush along a rescue line.', category: 'attack', slot: 'attack-2', attackType: 'dash', dmg: 20, cooldown: 4, energy: 14, shape: 'line', length: 12, width: 1.2, tags: ['speed', 'rescue'] },
  { key: 'courier_drop', name: 'Sky Courier Drop', desc: 'Drop an energy package that bursts on landing.', category: 'attack', slot: 'attack-3', attackType: 'lobbed', dmg: 22, cooldown: 6, energy: 18, shape: 'sphere', range: 4, tags: ['speed', 'air-support'], hooks: { affectsEnemies: true, affectsObstacles: true } },
  { key: 'cyclone', name: 'Jetstream Cyclone', desc: 'Spin at speed into a wind cyclone.', category: 'attack', slot: 'attack-4', attackType: 'ring-aoe', dmg: 16, cooldown: 7, energy: 22, shape: 'cylinder', range: 6, tags: ['speed', 'aoe'], intensity: 3 },
  { key: 'tailwind', name: 'Piercing Tailwind', desc: 'A straight wind-pressure pierce.', category: 'attack', slot: 'attack-5', attackType: 'line-pierce', dmg: 18, cooldown: 5, energy: 16, shape: 'line', length: 14, width: 1.4, tags: ['speed', 'pierce'] },
  { key: 'redline_combo', name: 'Redline Combo Burst', desc: 'A burst of high-speed multi-hit slashes.', category: 'attack', slot: 'attack-6', attackType: 'heavy', dmg: 26, cooldown: 8, energy: 26, shape: 'cone', range: 5, angle: 90, tags: ['speed', 'combo'], intensity: 3 },
  { key: 'afterimage', name: 'Afterimage Evade', desc: 'Short i-frame dash leaving an afterimage.', category: 'defense', slot: 'defense-1', defenseType: 'quick-dash-iframe', defenseValue: 1, cooldown: 6, energy: 12, duration: 1 },
  { key: 'guard_drift', name: 'Jet Guard Drift', desc: 'High-speed side drift that deflects projectiles.', category: 'defense', slot: 'defense-2', defenseType: 'front-shield', defenseValue: 0.5, cooldown: 7, energy: 14, duration: 1.5 },
  { key: 'rescue_shield', name: 'Emergency Rescue Shield', desc: 'Briefly shields self or an ally.', category: 'defense', slot: 'defense-3', defenseType: 'omni-barrier', defenseValue: 0.6, cooldown: 10, energy: 18, duration: 5 },
  { key: 'overdrive', name: 'Global Rescue Overdrive', desc: 'Streak between many targets at blinding speed.', category: 'ultimate', slot: 'ultimate-1', attackType: 'air-support', dmg: 30, cooldown: 18, energy: 50, shape: 'sphere', range: 10, tags: ['speed', 'ultimate', 'air-support'], intensity: 5 },
  { key: 'meteor', name: 'Skyline Meteor Delivery', desc: 'Soar up and drop a giant rescue capsule.', category: 'ultimate', slot: 'ultimate-2', attackType: 'lobbed', dmg: 40, cooldown: 20, energy: 55, shape: 'sphere', range: 8, tags: ['speed', 'ultimate'], intensity: 5 },
];

export const JETT_ABILITIES = buildCharacter('char_jett', 'speed', '#e8442c', SPECS);
