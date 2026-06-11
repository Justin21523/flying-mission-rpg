import type { DialogueEffect } from '../../types/dialogue';
import type { MissionReward } from '../../types/game/mission';

// Compile structured mission rewards into the POLI effect engine (coins are handled separately via walletStore).
// Pure → unit-testable; the runtime feeds the result to runEffects on mission completion.
export function missionRewardEffects(rewards: readonly MissionReward[] | undefined): DialogueEffect[] {
  const out: DialogueEffect[] = [];
  for (const r of rewards ?? []) {
    switch (r.type) {
      case 'item': if (r.targetId) out.push({ type: 'giveItem', itemId: r.targetId, quantity: r.amount ?? 1 }); break;
      case 'worldFlag': if (r.targetId) out.push({ type: 'setWorldFlag', flag: r.targetId }); break;
      case 'trust': if (r.characterId) out.push({ type: 'increaseTrust', characterId: r.characterId, amount: r.amount ?? 1 }); break;
      case 'unlockTool': if (r.targetId) out.push({ type: 'unlockTool', toolId: r.targetId }); break;
      case 'coins': break; // walletStore — see missionRewardCoins
    }
  }
  return out;
}

// Total coin reward (applied through walletStore.addCoins by the runtime).
export function missionRewardCoins(rewards: readonly MissionReward[] | undefined): number {
  let n = 0;
  for (const r of rewards ?? []) if (r.type === 'coins') n += r.amount ?? 0;
  return n;
}
