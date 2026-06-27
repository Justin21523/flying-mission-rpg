import type { StageDefinition } from '../../types/stageTypes';

// Batch E — branching map helpers (pure; unit-tested). A clear that opens >1 next stage is a route fork.
export function unlockedRoutesForStage(stage: StageDefinition): string[] {
  return stage.unlocksOnClear.stageIds ?? [];
}

export function isBranchFork(stage: StageDefinition): boolean {
  return unlockedRoutesForStage(stage).length > 1;
}

// Of the routes this clear unlocks, which are genuinely new (not already unlocked)?
export function newlyUnlockedStages(stage: StageDefinition, prevUnlockedIds: string[]): string[] {
  const prev = new Set(prevUnlockedIds);
  return unlockedRoutesForStage(stage).filter((id) => !prev.has(id));
}
