// POLI yokai-hunt — editable yokai "type" data driving AI behaviour + combat stats. A hunt spawns from the
// enabled types (editorYokaiStore); each spawned yokai is stamped with its type's behaviour + params.
export type YokaiBehavior = 'chaser' | 'ambusher' | 'kiter' | 'swarmer';
export const YOKAI_BEHAVIORS: YokaiBehavior[] = ['chaser', 'ambusher', 'kiter', 'swarmer'];
export const YOKAI_BEHAVIOR_LABEL: Record<YokaiBehavior, string> = {
  chaser: 'Chaser (rush you)',
  ambusher: 'Ambusher (lurk → dash)',
  kiter: 'Kiter (keep distance, ranged)',
  swarmer: 'Swarmer (surround / flank)',
};

export interface YokaiType {
  id: string;
  name: string;
  modelAssetId?: string;  // model-library id (e.g. 'yokais/...'); empty → a random yokai model each spawn
  color: string;
  elite: boolean;
  behavior: YokaiBehavior;
  hp: number;
  moveSpeed: number;
  aggroRange: number;     // ambusher wakes / kiter engages within this
  attackRange: number;    // distance at which it attacks the player (Phase J)
  attackRate: number;     // seconds between attacks
  attackDamage: number;   // light, recoverable hit to the player (Phase J)
  fleeHpPct: number;      // flee when hp < this fraction of max (0 = never)
  enabled: boolean;
}
