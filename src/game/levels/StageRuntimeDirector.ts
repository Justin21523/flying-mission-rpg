import type { StageDefinition } from '../../types/stageTypes';
import { useFlightStore } from '../../stores/game/useFlightStore';
import { useGameStore } from '../../stores/game/useGameStore';
import { useStageProgressionStore } from '../../stores/game/useStageProgressionStore';
import { getStageDefinition } from '../../stores/useStageEditorStore';
import { startMissionZone } from '../advanced-mission-zone/AdvancedMissionZoneDirector';
import { initializeForZone as initializeIncidentsForZone } from '../incidents/AIIncidentDirector';
import { initializeForZone as initializeSupportForZone } from '../support-combat/SupportCombatDirector';
import { cleanupEncounters, initializeEncounters } from '../encounters/EncounterDirector';
import { applyEnvironmentTheme, cleanupEnvironmentTheme } from '../environments/EnvironmentThemeDirector';
import { cleanupLevelRuntime, loadLevelLayout } from './LevelRuntime';

export function loadStageDefinition(stageId: string): StageDefinition {
  const stage = getStageDefinition(stageId);
  if (!stage) throw new Error(`Stage not found: ${stageId}`);
  return stage;
}

export function loadEnvironmentTheme(themeId: string) {
  return applyEnvironmentTheme(themeId);
}

export function loadLevelLayoutForStage(layoutId: string) {
  return loadLevelLayout(layoutId);
}

export function initializeMissionZone(zoneId: string): boolean {
  return startMissionZone(zoneId);
}

export function initializeEncountersForStage(stageId: string) {
  return initializeEncounters(stageId);
}

export function initializeIncidents(stage: StageDefinition): void {
  if (stage.requiredSystems.incidents) initializeIncidentsForZone(stage.missionZoneId);
}

export function initializeBossIfNeeded(stage: StageDefinition): void {
  useStageProgressionStore.getState().setRuntime({ activeBossId: stage.bossEncounterId });
}

export function initializeSupportRules(stage: StageDefinition): void {
  if (stage.requiredSystems.support) initializeSupportForZone();
}

export function startStage(stageId: string): StageDefinition {
  const stage = loadStageDefinition(stageId);
  const layout = loadLevelLayout(stage.levelLayoutId);
  loadEnvironmentTheme(stage.environmentThemeId);
  initializeEncountersForStage(stage.id);
  initializeIncidents(stage);
  initializeBossIfNeeded(stage);
  initializeSupportRules(stage);
  useFlightStore.getState().setLocation(stage.locationId);
  useFlightStore.getState().setRoute(stage.travelRouteId ?? null);
  useStageProgressionStore.getState().setRuntime({
    activeCampaignId: stage.campaignId,
    activeStageId: stage.id,
    activeLevelLayoutId: layout.id,
    status: stage.requiredSystems.flightApproach ? 'travel' : 'loading-stage',
  });
  const game = useGameStore.getState();
  if (game.phase === 'CHARACTER_SELECTION') game.requestTransition('HANGAR');
  return stage;
}

export function enterStageGameplay(): boolean {
  const state = useStageProgressionStore.getState();
  if (!state.activeStageId) return false;
  const stage = loadStageDefinition(state.activeStageId);
  const layout = loadLevelLayout(stage.levelLayoutId);
  const loaded = initializeMissionZone(stage.missionZoneId);
  if (!loaded) return false;
  state.enterStage(stage.id, layout.id, layout.startSegmentId);
  state.setStatus('playing');
  const game = useGameStore.getState();
  if (game.phase === 'LANDING') game.requestTransition('ADVANCED_MISSION_ZONE');
  else game.jumpTo('ADVANCED_MISSION_ZONE');
  return true;
}

export function completeStage(): void {
  const state = useStageProgressionStore.getState();
  if (!state.activeStageId) return;
  state.completeActiveStage();
}

export function failStage(): void {
  useStageProgressionStore.getState().failActiveStage();
}

export function cleanupStage(): void {
  cleanupEncounters();
  cleanupEnvironmentTheme();
  cleanupLevelRuntime();
}
