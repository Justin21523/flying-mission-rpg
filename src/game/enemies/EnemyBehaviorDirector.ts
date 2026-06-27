import { SEED_ENEMY_BEHAVIOR_PROFILES, type EnemyBehaviorProfile, type EnemyBehaviorState } from '../../data/enemies/enemyBehaviorProfiles';
import type { CombatTarget } from '../../stores/game/combatTargetStore';

export function getEnemyBehaviorProfile(enemyDefinitionId: string): EnemyBehaviorProfile | undefined {
  return SEED_ENEMY_BEHAVIOR_PROFILES.find((profile) => profile.enemyDefinitionId === enemyDefinitionId);
}

export function resolveEnemyBehaviorState(target: CombatTarget, playerDistance: number): EnemyBehaviorState {
  if (target.defeatedAt) return 'defeated';
  if ((target.aiData?.stunUntil ?? 0) > Date.now() / 1000) return 'stunned';
  const profile = target.enemyDefId ? getEnemyBehaviorProfile(target.enemyDefId) : undefined;
  if (profile?.priority === 'support' && playerDistance < 8) return 'retreat';
  if (profile?.priority === 'support') return profile.preferredStates.includes('repair') ? 'repair' : 'support-ally';
  if (profile?.priority === 'ranged' && playerDistance < 6) return 'retreat';
  if (playerDistance <= (target.attackRange ?? 3)) return 'attack';
  if (playerDistance <= (target.aggroRange ?? 20)) return 'chase';
  return profile?.preferredStates.includes('patrol') ? 'patrol' : 'idle';
}
