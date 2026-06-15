import { describe, it, expect, beforeEach } from 'vitest';
import { tickCombatSpawns, type SpawnTickDeps } from './combatSpawns';
import { useCombatSpawnStore, spawnCombat, liveSpawns } from '../../stores/game/combatSpawnStore';

beforeEach(() => useCombatSpawnStore.getState().reset());

interface TestState { hits: string[]; playerHits: number }
function makeDeps(over: Partial<SpawnTickDeps> = {}): { deps: SpawnTickDeps; state: TestState } {
  const state: TestState = { hits: [], playerHits: 0 };
  const d: SpawnTickDeps = {
    nowMs: 1000,
    enemyTargets: () => [{ id: 'e1', x: 10, y: 0, z: 0 }],
    playerPos: () => ({ x: 0, z: 0 }),
    targetPos: () => ({ x: 10, z: 0 }),
    damageTarget: (id) => { state.hits.push(id); },
    damagePlayer: () => { state.playerHits++; },
    impact: () => {},
    ...over,
  };
  return { deps: d, state };
}

describe('tickCombatSpawns', () => {
  it('moves a player projectile forward and hits an enemy in its path', () => {
    spawnCombat({ kind: 'projectile', faction: 'player', x: 0, y: 1, z: 0, dirX: 1, dirZ: 0, speed: 20, movement: 'linear', lifetimeSeconds: 2, radius: 2, damage: { amount: 10, damageType: 'impact', attackTags: [] } });
    const { deps, state } = makeDeps();
    for (let i = 0; i < 40 && state.hits.length === 0; i++) tickCombatSpawns(0.05, deps);
    expect(state.hits).toContain('e1');
  });

  it('an enemy projectile that reaches the player damages the player', () => {
    spawnCombat({ kind: 'projectile', faction: 'enemy', x: 5, y: 1, z: 0, dirX: -1, dirZ: 0, speed: 20, movement: 'linear', lifetimeSeconds: 2, radius: 2, damage: { amount: 8, damageType: 'impact', attackTags: [] } });
    const { deps, state } = makeDeps();
    for (let i = 0; i < 40 && state.playerHits === 0; i++) tickCombatSpawns(0.05, deps);
    expect(state.playerHits).toBeGreaterThan(0);
  });

  it('a summon pulses AoE damage to enemies on its timer', () => {
    spawnCombat({ kind: 'summon', faction: 'player', x: 9, y: 1, z: 0, dirX: 0, dirZ: 1, speed: 0, movement: 'stationary', lifetimeSeconds: 10, radius: 4, damage: { amount: 6, damageType: 'impact', attackTags: [] }, attackIntervalSeconds: 0.1 });
    const { deps, state } = makeDeps({ nowMs: 999999 }); // far past nextHitAt → pulse fires
    tickCombatSpawns(0.05, deps);
    expect(state.hits).toContain('e1');
  });

  it('sweep removes impacted / expired spawns', () => {
    spawnCombat({ kind: 'projectile', faction: 'player', x: 0, y: 1, z: 0, dirX: 1, dirZ: 0, speed: 20, movement: 'linear', lifetimeSeconds: 2, radius: 2, damage: { amount: 10, damageType: 'impact', attackTags: [] } });
    liveSpawns[0].hasImpacted = true;
    useCombatSpawnStore.getState().sweep();
    expect(liveSpawns).toHaveLength(0);
  });
});
