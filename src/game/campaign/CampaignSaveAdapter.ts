import type { StageProgressionSnapshot } from '../../types/stageProgressionTypes';

const STORAGE_KEY = 'aero-rescue-campaign-progression-v1';

export function loadCampaignProgression(): StageProgressionSnapshot | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StageProgressionSnapshot;
    return {
      completedStageIds: Array.isArray(parsed.completedStageIds) ? parsed.completedStageIds : [],
      unlockedStageIds: Array.isArray(parsed.unlockedStageIds) ? parsed.unlockedStageIds : [],
      unlockedCharacterIds: Array.isArray(parsed.unlockedCharacterIds) ? parsed.unlockedCharacterIds : [],
      unlockedAbilityIds: Array.isArray(parsed.unlockedAbilityIds) ? parsed.unlockedAbilityIds : [],
      unlockedSupportAbilityIds: Array.isArray(parsed.unlockedSupportAbilityIds) ? parsed.unlockedSupportAbilityIds : [],
      bestStageScores: parsed.bestStageScores ?? {},
      stageClearTimestamps: parsed.stageClearTimestamps ?? {},
      selectedCampaignId: parsed.selectedCampaignId,
      lastPlayedStageId: parsed.lastPlayedStageId,
    };
  } catch {
    return null;
  }
}

export function saveCampaignProgression(snapshot: StageProgressionSnapshot): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    /* localStorage can be unavailable in tests or private contexts */
  }
}

export function clearCampaignProgression(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
