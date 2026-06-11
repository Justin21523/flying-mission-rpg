// Known Phaser mini-game ids (Batch 7: the repair-wiring scene). Used by the objective editor dropdown and
// the dialogue `openMiniGame` effect — add an id here when a new mini-game scene is registered.
export const MINI_GAME_IDS = ['repair_wiring'] as const;
export type MiniGameId = (typeof MINI_GAME_IDS)[number];
