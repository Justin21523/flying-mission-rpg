import type { CombatTarget } from '../../stores/game/combatTargetStore';
import { getEnemyDef } from '../../stores/game/editorCombatStore';
import { useCharacterStore } from '../../stores/game/useCharacterStore';
import { useSupportRuntimeStore } from '../../stores/game/supportRuntimeStore';
import { useCharacterProgressionStore } from '../../stores/game/useCharacterProgressionStore';
import { useWalletStore } from '../../stores/walletStore';
import { getHangarBonuses } from './HangarBonusResolver';
import { useCodexStore } from '../../stores/game/useCodexStore';
import { useEquipmentModInventoryStore } from '../../stores/game/useEquipmentModInventoryStore';
import { rollModDrop } from './EquipmentModDropResolver';
import { getGameSettings } from '../../stores/game/useSettingsStore';
import { evaluateCodexChallenges } from './CodexChallengeResolver';

// Batch L (meta-progression) — award EXP (to the active character) + coins (to the account wallet) when an
// enemy is defeated. Called from combatTargetStore.applyResult at the moment of defeat. Bosses are rewarded
// separately (a larger lump in BossDirector.defeatBoss), so this skips boss bodies/weakpoints.

// Mirrors CombatDirector.activeCombatantId (the currently CONTROLLED character — clone/support swaps included),
// falling back to the selected character. Avoids a no-op when selectedCharacterId is unset (dev-jump paths).
function activeCharacterId(): string | null {
  return useSupportRuntimeStore.getState().ownership.controlledCharacterId
    ?? useCharacterStore.getState().selectedCharacterId;
}

export function grantReward(exp: number, coins: number): void {
  const charId = activeCharacterId();
  if (charId && exp > 0) useCharacterProgressionStore.getState().addExp(charId, exp);
  if (coins > 0) useWalletStore.getState().addCoins(coins);
}

export function awardKillReward(target: CombatTarget): void {
  if (!target.isEnemy || target.isBossEntity || target.isBossWeakpoint || target.isObstacle) return;
  const def = target.enemyDefId ? getEnemyDef(target.enemyDefId) : undefined;
  const hp = def?.maxHp ?? 40;
  const exp = def?.expReward ?? Math.max(5, Math.round(hp / 8));
  const baseCoins = def?.coinReward ?? Math.max(2, Math.round(hp / 16));
  // Wave 3 — Hangar 'Salvage Magnet' boosts coin drops.
  grantReward(exp, Math.round(baseCoins * getHangarBonuses().dropRateMult));
  // Wave 4 — codex: mark this enemy archetype as discovered + check challenges.
  useCodexStore.getState().recordEnemySeen(target.enemyDefId);
  evaluateCodexChallenges();
  // Wave 4 — small chance to drop a non-common equipment mod (only granted if not already owned).
  const drop = rollModDrop(hp, getGameSettings().difficulty);
  if (drop) useEquipmentModInventoryStore.getState().addMod(drop);
}
