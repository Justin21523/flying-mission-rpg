// Batch 13 — small shared types for the progress/stats/unlock layer.

export type LandingOutcome = 'safe' | 'rough';

export type UnlockKind = 'character' | 'location' | 'route';

export interface UnlockResult {
  kind: UnlockKind;
  id: string | null; // null = nothing left to unlock
}
