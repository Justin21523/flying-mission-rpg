import { getBossDemoProfileForBoss } from '../../data/bosses/bossDemoProfiles';
import { liveWeakpointEntries, type WeakpointVisualState } from '../../game/bosses/BossWeakpointController';
import { getBoss, getBossPhase, getWeakpoint } from '../../stores/game/useBossEditorStore';
import type { BossRuntimeState } from '../../types/game/boss';

export type BossHudWeakpointView = {
  id: string;
  label: string;
  state: WeakpointVisualState;
};

export type BossHudViewModel = {
  bossName: string;
  phaseLabel: string;
  phaseProgressLabel: string;
  phaseObjective: string;
  counterplay: string[];
  phaseColor: string;
  weakpoints: BossHudWeakpointView[];
};

export function buildBossHudViewModel(runtime: BossRuntimeState): BossHudViewModel {
  const boss = getBoss(runtime.bossDefinitionId);
  const phase = getBossPhase(runtime.activePhaseId);
  const profile = getBossDemoProfileForBoss(runtime.bossDefinitionId);
  const phaseHint = profile?.phaseHints.find((hint) => hint.phaseId === runtime.activePhaseId);
  const phaseIndex = phase ? phase.phaseIndex + 1 : 0;
  const phaseTotal = profile?.phaseOrder.length ?? boss?.phaseIds.length ?? 0;
  const liveStates = new Map(liveWeakpointEntries().map((entry) => [entry.id, entry.state]));

  return {
    bossName: boss?.name ?? 'Boss',
    phaseLabel: runtime.status === 'defeated' ? 'Defeated' : phase?.name ?? 'Unknown Phase',
    phaseProgressLabel: phaseIndex > 0 && phaseTotal > 0 ? `Phase ${phaseIndex}/${phaseTotal}` : 'Phase',
    phaseObjective: phaseHint?.objective ?? phase?.editorMeta?.notes ?? '',
    counterplay: phaseHint?.counterplay ?? boss?.roleRecommendations?.recommendedSkillTags ?? [],
    phaseColor: phase?.editorMeta?.phaseColor ?? boss?.visual.themeColor ?? '#38bdf8',
    weakpoints: runtime.activeWeakpointIds.map((id) => ({
      id,
      label: getWeakpoint(id)?.displayName ?? id,
      state: runtime.destroyedWeakpointIds.includes(id) ? 'destroyed' : liveStates.get(id) ?? 'hidden',
    })),
  };
}
