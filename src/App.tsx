import { useEffect } from 'react';
import { useUiStore } from './stores/uiStore';
import { useDevStore } from './stores/devStore';
import { useAudioStore } from './stores/audioStore';
import { useTerrainHistoryStore } from './stores/terrainHistoryStore';
import { useSceneEditStore } from './stores/sceneEditStore';
import { useWorldSelectStore } from './stores/worldSelectStore';
import { usePbrPatchEditStore } from './stores/pbrPatchEditStore';
import { useEditorEnvironmentStore } from './stores/editorEnvironmentStore';
import { usePlayerStore } from './stores/playerStore';
import { useEditorWorldStore } from './stores/editorWorldStore';
import { GameCanvas } from './app/GameCanvas';
import { DevPanel } from './app/DevPanel';
import { GameBoot } from './game/boot/GameBoot';
import { GameStateDebugPanel } from './ui/dev/GameStateDebugPanel';
import { GameScreens } from './ui/game/GameScreens';
import { BaseHud } from './ui/game/BaseHud';
import { FlightHud } from './ui/game/FlightHud';
import { FlightRewardHud } from './ui/game/FlightRewardHud';
import { FlightProgressHud } from './ui/game/FlightProgressHud';
import { FlightSonarHud } from './ui/game/FlightSonarHud';
import { WorldMapHud } from './ui/game/WorldMapHud';
import { DestinationApproachHud } from './ui/game/DestinationApproachHud';
import { TransformationHud } from './ui/game/TransformationHud';
import { DescentHud } from './ui/game/DescentHud';
import { LandingHud } from './ui/game/LandingHud';
import { MissionHud } from './ui/game/MissionHud';
import { MissionZoneHud } from './ui/game/MissionZoneHud';
import { ThreatGaugeHud } from './ui/game/ThreatGaugeHud';
import { MissionObjectiveHud } from './ui/game/MissionObjectiveHud';
import { RescueRosterPanel } from './ui/game/RescueRosterPanel';
import { ArenaRunHud } from './ui/game/ArenaRunHud';
import { RunResultsOverlay } from './ui/game/RunResultsOverlay';
import { RunBuffChoiceOverlay } from './ui/game/RunBuffChoiceOverlay';
import { RouteChoiceOverlay } from './ui/game/RouteChoiceOverlay';
import { RoomInteractionOverlay } from './ui/game/RoomInteractionOverlay';
import { MissionZoneDebugPanel } from './ui/dev/MissionZoneDebugPanel';
import { CombatHud } from './ui/combat/CombatHud';
import { CombatDebugPanel } from './ui/dev/CombatDebugPanel';
import { GodModePanel } from './ui/debug/GodModePanel';
import { CharacterSkillHud } from './ui/character-skills/CharacterSkillHud';
import { CharacterSkillDebugPanel } from './ui/debug/CharacterSkillDebugPanel';
import { SupportCombatPanel } from './ui/support-combat/SupportCombatPanel';
import { SupportStatusHud } from './ui/support-combat/SupportStatusHud';
import { SupportSynergyToast } from './ui/support-combat/SupportSynergyToast';
import { SupportCombatDebugPanel } from './ui/debug/SupportCombatDebugPanel';
import { BossHud } from './ui/boss/BossHud';
import { BossIntroOverlay } from './ui/boss/BossIntroOverlay';
import { BossWarningToast } from './ui/boss/BossWarningToast';
import { BossDebugPanel } from './ui/debug/BossDebugPanel';
import { CinematicAbilityDebugPanel } from './ui/debug/CinematicAbilityDebugPanel';
import { IncidentHud } from './ui/incidents/IncidentHud';
import { PartnerFusionHud } from './ui/support-combat/PartnerFusionHud';
import { IncidentDebugPanel } from './ui/debug/IncidentDebugPanel';
import { VfxShowcaseDebugPanel } from './ui/debug/VfxShowcaseDebugPanel';
import { CinematicVfxDebugPanel } from './ui/debug/CinematicVfxDebugPanel';
import { HuntHud } from './ui/game/HuntHud';
import { MissionCompleteHud } from './ui/game/MissionCompleteHud';
import { HangarReturnHud } from './ui/game/HangarReturnHud';
import { MissionResultsScreen } from './ui/game/MissionResultsScreen';
import { MultiCharacterHud } from './ui/hud/MultiCharacterHud';
import { PhaserOverlay } from './ui/phaser/PhaserOverlay';
import { DestinationDebugPanel } from './ui/dev/DestinationDebugPanel';
import { TransformationDebugPanel } from './ui/dev/TransformationDebugPanel';
import { SupportDebugPanel } from './ui/dev/SupportDebugPanel';
import { SupportSelectionPanel } from './ui/support/SupportSelectionPanel';
import { SupportCallButton } from './ui/support/SupportCallButton';
import { SupportDispatchStatusPanel } from './ui/support/SupportDispatchStatusPanel';
import { SupportArrivalToast } from './ui/support/SupportArrivalToast';
import { SupportDispatchDirectorHost } from './game/support/SupportDispatchDirectorHost';
import { FullControlDispatchHost } from './game/support/FullControlDispatchHost';
import { useGameStore } from './stores/game/useGameStore';
import { useGraphicsSettingsStore } from './stores/graphicsSettingsStore';
import { usePoll } from './ui/usePoll';
import { PerformanceDebugPanel } from './ui/debug/PerformanceDebugPanel';
import { AutoPlaytesterDirector } from './game/testing/AutoPlaytesterDirector';
import { AutoPlaytesterPanel } from './ui/debug/AutoPlaytesterPanel';
import { RouteColorGradeOverlay } from './ui/flight/RouteColorGradeOverlay';
import { initAudioRuntime } from './game/audio/audioRuntime';
import { installVisibilityWatcher, setPaused } from './game/performance/SceneVisibilityController';
import { applyQualityToSupportLimits } from './game/performance/QualityPresetController';
import { useSaveStore } from './stores/useSaveStore';
import { installProgressObservers } from './game/progress/progressObservers';
import { flushOnUnload } from './game/save/SaveManager';
import { captureSettingsSnapshot } from './game/save/settingsSnapshot';
import { useAutoPlaytesterStore } from './stores/game/autoPlaytesterStore';
import { SystemMenu } from './ui/system/SystemMenu';
import { SystemMenuButton } from './ui/system/SystemMenuButton';
import { RuntimeHealthPanel } from './ui/debug/RuntimeHealthPanel';
import { SaveDebugPanel } from './ui/debug/SaveDebugPanel';
import { installStateMachineDiagnostics } from './game/diagnostics/StateMachineDiagnostics';
import { registerGauge } from './game/diagnostics/SubscriptionLeakDetector';
import { getAudioManager } from './game/audio/AudioManager';
import { getCulledCount } from './game/perf/lod';
import { StageProgressHud } from './ui/campaign/StageProgressHud';
import { StageClearPanel } from './ui/campaign/StageClearPanel';
import { StageFailedPanel } from './ui/campaign/StageFailedPanel';
import { useStageProgressionStore } from './stores/game/useStageProgressionStore';
import { CampaignDebugPanel } from './ui/debug/CampaignDebugPanel';
import { StageDebugPanel } from './ui/debug/StageDebugPanel';
import { EncounterDebugPanel } from './ui/debug/EncounterDebugPanel';
import { EnvironmentDebugPanel } from './ui/debug/EnvironmentDebugPanel';
import { DemoLandingScreen } from './ui/demo/DemoLandingScreen';
import { DemoModePanel } from './ui/demo/DemoModePanel';
import { DemoControlsOverlay } from './ui/demo/DemoControlsOverlay';
import { GameTopBar } from './ui/polish/GameTopBar';
import { UnifiedStatusHud } from './ui/polish/UnifiedStatusHud';
import { ContextActionPrompt } from './ui/polish/ContextActionPrompt';
import { GuidedHintToast } from './ui/polish/GuidedHintToast';
import { CombatFeedbackLayer } from './ui/combat/CombatFeedbackLayer';
import { useDemoModeStore } from './stores/useDemoModeStore';
import { GameErrorBoundary } from './ui/system/GameErrorBoundary';
import { RuntimeErrorOverlay } from './ui/system/RuntimeErrorOverlay';
import { DiagnosticsPanel } from './ui/system/DiagnosticsPanel';
import { ReleaseCandidatePanel } from './ui/qa/ReleaseCandidatePanel';
import { installRuntimeErrorCollector } from './game/qa/RuntimeErrorCollector';
import { RecordingSafeFrameOverlay } from './ui/demo/RecordingSafeFrameOverlay';
import { RecordingShotChecklist } from './ui/demo/RecordingShotChecklist';
import { usePortfolioRecordingStore } from './stores/usePortfolioRecordingStore';

// On-ground base phases render the 3D hangar (BaseScene) + BaseHud; flight phases render FlightScene + FlightHud.
const BASE_PHASES = new Set(['HANGAR', 'PLATFORM_ALIGNMENT', 'LAUNCH_PREPARATION']);
const FLIGHT_PHASES = new Set(['LAUNCH_TUNNEL', 'BASE_FLY_AROUND', 'CLOUD_ASCENT']);
import { syncEditorQuests } from './game/editor/editorQuestToQuest';
import { setupPoliQuestRewards } from './game/poli/PoliQuestRewardHandler';
import { QuestTrackerController } from './game/quest/questTracking';
import { InteractionHandler } from './game/interaction/InteractionHandler';
import { Dock } from './ui/Dock';
import { EditorHubPanel } from './ui/EditorHubPanel';
import { EditAssetPalette } from './ui/EditAssetPalette';
import { EditModeInspector } from './ui/EditModeInspector';
import { FlightPlaybackOverlay } from './ui/game/FlightPlaybackOverlay';
import { FlightPhaseEventHud } from './ui/game/FlightPhaseEventHud';
import { SelectionTabSync } from './ui/SelectionTabSync';
import { TerrainBrushHud } from './ui/TerrainBrushHud';
import { MissionAreaQuickAddOverlay } from './ui/editor/game/MissionAreaQuickAddOverlay';
import { InteractionPrompt } from './ui/InteractionPrompt';
import { WorldClockHUD } from './ui/WorldClockHUD';
import { DialogueBox } from './ui/DialogueBox';
import { QuestTracker } from './ui/QuestTracker';
import { BattleOverlay } from './ui/BattleOverlay';
import { useBattleStore } from './stores/battleStore';
import { ActivityHud } from './ui/ActivityHud';
import { useActivityStore } from './stores/activityStore';
import { PlayToolbar } from './ui/play/PlayToolbar';
import { PoliSystemBoot } from './game/poli/PoliSystemBoot';
import { IncidentDirector } from './game/incident/IncidentDirector';
import { TrafficIncidentDirector } from './game/incident/TrafficIncidentDirector';
import { YokaiDirector } from './game/poli/YokaiDirector';
import { RescueHud } from './ui/RescueHud';
import { ToolBeltHud } from './ui/ToolBeltHud';
import { LicenseBadge } from './ui/LicenseBadge';
import { IncidentTracker } from './ui/IncidentTracker';
import { OnboardingHud } from './ui/OnboardingHud';
import { ResearchStationHud } from './ui/ResearchStationHud';
import { BoostMeterHud } from './ui/BoostMeterHud';
import { ResourceHud } from './ui/ResourceHud';
import { CoinsHud } from './ui/CoinsHud';
import { ShopPanel } from './ui/ShopPanel';
import { ScreenFade } from './ui/ScreenFade';
import { useRescueOperationStore } from './stores/rescueOperationStore';
import { useJinResearchStore } from './stores/jinResearchStore';
import { initEditorUndo, editorUndo, editorRedo } from './stores/editorUndoStore';
import { duplicateAllSelected } from './game/edit/duplicateSelection';
import { duplicateGameSelection, deleteGameSelection } from './game/editor/gameLayoutOps';

// Kit — top-level: the 3D <Canvas> with DOM overlays layered over it. F1 toggles Edit Mode; in Edit
// Mode the camera free-pans, gizmos appear, and the Editor Hub + floating terrain palette are usable.
// Tiny diagnostic — shows current mode + player XYZ so we can confirm the body is actually moving
// (and that we're not accidentally stuck in Edit Mode, where the player is intentionally frozen).
const PlayerPosDebug = () => {
  usePoll(200); // poll position (per-frame) instead of subscribing → no 60 Hz re-render
  const pos = usePlayerStore.getState().position;
  const editMode = useUiStore((s) => s.editMode);
  if (!pos) return null;
  return (
    <div className="pointer-events-none fixed bottom-2 left-2 rounded bg-black/70 px-2 py-1 font-mono text-[10px]">
      <span className={editMode ? 'text-amber-400' : 'text-emerald-400'}>
        {editMode ? 'EDIT (player frozen — F1 to play)' : 'PLAY (WASD · Shift sprint · Q ability · T transform · C character · F fly: Helly)'}
      </span>
      <span className="text-slate-300"> · pos {pos.x.toFixed(1)} / {pos.y.toFixed(1)} / {pos.z.toFixed(1)}</span>
    </div>
  );
};

export const App = () => {
  const editMode = useUiStore((s) => s.editMode);
  const editorHubOpen = useUiStore((s) => s.editorHubOpen);
  // 'greybox' (default) shows the Batch 0 base scene; 'world' wakes the inherited POLI kit + its HUD.
  // Edit Mode panels stay available in both modes. Toggle via the Leva dev panel.
  const world = useDevStore((s) => s.sceneMode) === 'world';
  const fsmDebug = useDevStore((s) => s.fsmDebug);
  const demoEnabled = useDemoModeStore((s) => s.enabled);
  const demoLandingDismissed = useDemoModeStore((s) => s.landingDismissed);
  const hideDebugByDefault = useDemoModeStore((s) => s.hideDebugByDefault);
  const recordingHideDebug = usePortfolioRecordingStore((s) => s.enabled && s.hideDebug);
  const autoEnabled = useAutoPlaytesterStore((s) => s.enabled);
  const phase = useGameStore((s) => s.phase);
  const basePhase = BASE_PHASES.has(phase);
  const flightPhase = FLIGHT_PHASES.has(phase);
  const worldFlightPhase = phase === 'WORLD_FLIGHT' || phase === 'RETURN_FLIGHT'; // return leg reuses the flight HUDs
  const approachPhase = phase === 'DESTINATION_APPROACH' || phase === 'BASE_APPROACH'; // HUD is phase-aware
  const transformPhase = phase === 'TRANSFORMATION' || phase === 'RETURN_TRANSFORMATION';
  const descentPhase = phase === 'DESCENT';
  const landingPhase = phase === 'LANDING';
  // Advanced Mission Zone gameplay phases (New Batch A) — share the ground/support HUD stack with the legacy
  // mission phases, but swap the objective HUD for the zone HUD.
  const zonePhase = phase === 'ADVANCED_MISSION_ZONE' || phase === 'ZONE_SEGMENT_GAMEPLAY' || phase === 'ZONE_COMPLETE';
  // Combat Runtime (New Batch B) — HUD + skills active in zone gameplay + legacy mission gameplay + arena runs.
  const combatPhase = phase === 'ADVANCED_MISSION_ZONE' || phase === 'ZONE_SEGMENT_GAMEPLAY' || phase === 'MISSION_GAMEPLAY' || phase === 'ARENA_RUN';
  const arenaRunPhase = phase === 'ARENA_RUN';
  const missionPhase = phase === 'NPC_GREETING' || phase === 'MISSION_GAMEPLAY' || phase === 'SUPPORT_SELECTION' || zonePhase;
  const missionDonePhase = phase === 'MISSION_COMPLETE';
  const hangarReturnPhase = phase === 'HANGAR_RETURN';
  const resultsPhase = phase === 'MISSION_RESULTS';
  const stageStatus = useStageProgressionStore((s) => s.status);
  const showDeveloperDebug = editMode || (fsmDebug && !recordingHideDebug && (!demoEnabled || !hideDebugByDefault));
  const inBattle = useBattleStore((s) => s.isActive);
  const inActivity = useActivityStore((s) => s.isActive);
  const isRescueActive = useRescueOperationStore((s) => s.isActive);
  const textScale = useAudioStore((s) => s.textScale);
  const highContrast = useAudioStore((s) => s.highContrast);

  // Accessibility: scale all rem-based UI text + toggle a high-contrast class on the root element.
  useEffect(() => {
    document.documentElement.style.fontSize = `${Math.round(textScale * 100)}%`;
    document.documentElement.classList.toggle('poli-hc', highContrast);
  }, [textScale, highContrast]);

  // Register any editor-authored quests (from localStorage) into the runtime quest store on startup.
  useEffect(() => {
    syncEditorQuests();
  }, []);

  // Install the coins/research-aware quest reward handler for the aero game too (PoliSystemBoot only runs it in
  // the dormant 'world' mode) — so destination resident side-quests grant coins + items + exp on completion.
  useEffect(() => {
    setupPoliQuestRewards();
  }, []);

  useEffect(() => installRuntimeErrorCollector(), []);

  // Drive timed research completion even when the Research Station panel is closed.
  useEffect(() => {
    const id = setInterval(() => useJinResearchStore.getState().tickResearch(), 500);
    return () => clearInterval(id);
  }, []);

  // Start global editor Undo/Redo tracking (snapshots every authoring edit for Ctrl+Z / Ctrl+Shift+Z).
  useEffect(() => { initEditorUndo(); }, []);

  // Batch 13 — boot the aero-rescue main save: hydrate progress/stats from disk, mirror the authoritative
  // live settings into the save snapshot (stores stay the source of truth — we do NOT overwrite them on
  // boot), install the event-driven progress observers, and flush a debounced save on unload.
  useEffect(() => {
    useSaveStore.getState().hydrate();
    useSaveStore.getState().setSettingsSnapshot(captureSettingsSnapshot());
    const offProgress = installProgressObservers();
    const offDiag = installStateMachineDiagnostics();
    const offGauge = registerGauge('audioLoops', () => getAudioManager().playingCount());
    const offCulled = registerGauge('culled', () => getCulledCount());
    const onUnload = (): void => flushOnUnload();
    window.addEventListener('beforeunload', onUnload);
    return () => { offProgress(); offDiag(); offGauge(); offCulled(); window.removeEventListener('beforeunload', onUnload); flushOnUnload(); };
  }, []);

  // Batch 12 — audio runtime (registers presets + decoupled controllers), tab-visibility gating, and the
  // quality→Batch-8 support-limit sync (the quality preset owns the Active/Standby/AI-tick budgets). Also
  // pauses heavy ticks when the FSM is paused. All cleaned up on unmount.
  useEffect(() => {
    const offAudio = initAudioRuntime();
    const offVis = installVisibilityWatcher();
    applyQualityToSupportLimits();
    const offQuality = useGraphicsSettingsStore.subscribe(() => applyQualityToSupportLimits());
    const offPause = useGameStore.subscribe((s) => setPaused(s.paused));
    return () => { offAudio(); offVis(); offQuality(); offPause(); };
  }, []);

  // Begin the game inside an interior: on load, if any area is marked indoor (the 🏠 start space), spawn there.
  useEffect(() => {
    const indoor = useEditorWorldStore.getState().areas.find((a) => a.indoor === true);
    if (indoor) {
      const sp = indoor.spawnPoint ?? { x: 0, y: 3, z: 0 };
      usePlayerStore.getState().travelToArea(indoor.id, sp);
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName ?? '').toLowerCase();
      const typing = tag === 'input' || tag === 'textarea' || tag === 'select';
      if (e.code === 'F1' && !e.repeat) { e.preventDefault(); useUiStore.getState().toggleEditMode(); return; }
      if (!useUiStore.getState().editMode || typing) return;
      // Edit-mode shortcuts: gizmo modes + undo/redo (terrain → placements), patch ops handled in App.
      const patchSel = usePbrPatchEditStore.getState().selectedId;
      if (patchSel && !(e.code === 'KeyZ' && (e.ctrlKey || e.metaKey))) {
        const env = useEditorEnvironmentStore.getState();
        const pArea = usePlayerStore.getState().currentAreaId;
        const cur = env.overrides[pArea]?.pbrPatches ?? [];
        if (e.code === 'Delete' || e.code === 'Backspace') { e.preventDefault(); env.setOverride(pArea, { pbrPatches: cur.filter((q) => q.id !== patchSel) }); usePbrPatchEditStore.getState().select(null); return; }
        if (e.code === 'KeyD' && e.shiftKey) { e.preventDefault(); const src = cur.find((q) => q.id === patchSel); if (src) { const id = `patch_${Date.now().toString(36)}`; env.setOverride(pArea, { pbrPatches: [...cur, { ...src, id, x: src.x + 10, z: src.z + 10 }] }); usePbrPatchEditStore.getState().select(id); } return; }
        if (e.code === 'KeyW') { usePbrPatchEditStore.getState().setMode('translate'); return; }
        if (e.code === 'KeyE') { usePbrPatchEditStore.getState().setMode('rotate'); return; }
        if (e.code === 'KeyR') { usePbrPatchEditStore.getState().setMode('scale'); return; }
        if (e.code === 'Escape') { usePbrPatchEditStore.getState().select(null); return; }
      }
      if (e.repeat) return;
      if ((e.code === 'KeyZ' && e.shiftKey && (e.ctrlKey || e.metaKey)) || (e.code === 'KeyY' && (e.ctrlKey || e.metaKey))) { e.preventDefault(); if (!useTerrainHistoryStore.getState().redo()) editorRedo(); return; }
      if (e.code === 'KeyZ' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); if (!useTerrainHistoryStore.getState().undo()) editorUndo(); return; }
      if (e.code === 'KeyD' && e.shiftKey) { e.preventDefault(); if (!duplicateGameSelection()) duplicateAllSelected(); return; }
      if (e.code === 'KeyW') useSceneEditStore.getState().setMode('translate');
      else if (e.code === 'KeyE') useSceneEditStore.getState().setMode('rotate');
      else if (e.code === 'KeyR') useSceneEditStore.getState().setMode('scale');
      else if (e.code === 'Delete' || e.code === 'Backspace') {
        // Game layout parts (base/exterior) hard-delete from their data store (incl. multi-selection); then a
        // DataBackedPlacement selection deletes via its own store; otherwise the kit-selected placement.
        if (deleteGameSelection()) return;
        const ws = useWorldSelectStore.getState();
        if (ws.deleteSelected()) return;
        else useSceneEditStore.getState().deleteSelected();
      }
      else if (e.code === 'Escape') { useSceneEditStore.getState().clearSelection(); useWorldSelectStore.getState().select(null); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <GameErrorBoundary>
    <div className="fixed inset-0 bg-gray-900">
      {/* Inherited POLI kit runtime + its HUD — only when the world scene is active (dormant in grey-box). */}
      {world && (
        <>
          <InteractionHandler />
          <QuestTrackerController />
          <PoliSystemBoot />
          <IncidentDirector />
          <TrafficIncidentDirector />
          <YokaiDirector />
          <WorldClockHUD />
          {/* Overworld-only HUD (hidden while editing). */}
          {!editMode && !inBattle && !inActivity && !isRescueActive && <InteractionPrompt />}
          {!editMode && !inBattle && !inActivity && !isRescueActive && <QuestTracker />}
          {/* Bottom toolbar (map / quests / items / stats / settings / saves / hints + radar) — always available in
              play mode, even during an activity / rescue / yokai hunt, so the map & tools never vanish. */}
          {!editMode && <PlayToolbar />}
          {!editMode && !inBattle && !inActivity && !isRescueActive && <ToolBeltHud />}
          {!editMode && !inBattle && !inActivity && !isRescueActive && <LicenseBadge />}
          {!editMode && <OnboardingHud />}
          {!editMode && !inBattle && !inActivity && !isRescueActive && <IncidentTracker />}
          {!editMode && !inBattle && !inActivity && !isRescueActive && <ResearchStationHud />}
          {!editMode && !inBattle && !inActivity && !isRescueActive && <BoostMeterHud />}
          {!editMode && !inBattle && !inActivity && !isRescueActive && <ResourceHud />}
          {!editMode && <CoinsHud />}
          {!editMode && <ShopPanel />}
          <DialogueBox />
          <BattleOverlay />
          <ActivityHud />
          <RescueHud />
        </>
      )}
      {/* Always-on shell: game boot (seed + FSM), main dock, Leva dev panel, optional FSM dev console,
          and the Edit Mode authoring panels (Edit Mode must work in both grey-box and world scenes). */}
      <GameBoot />
      {!world && <DemoLandingScreen />}
      {!editMode && !world && <GameTopBar />}
      {!editMode && !world && <UnifiedStatusHud />}
      {!editMode && !world && <ContextActionPrompt />}
      {!editMode && !world && <GuidedHintToast />}
      {!editMode && !world && demoEnabled && <DemoControlsOverlay />}
      {!editMode && !world && demoEnabled && demoLandingDismissed && <DemoModePanel />}
      {!world && <RecordingSafeFrameOverlay />}
      {!world && <RecordingShotChecklist />}
      {!editMode && !world && <FullControlDispatchHost />}
      {/* POLI quest runtime for the aero game (destination resident side-quests): the auto-tracker runs the
          quests; the QuestTracker HUD shows active side-quests during destination gameplay. */}
      {!world && <QuestTrackerController />}
      {/* Game front-end (Mission Control → Briefing → Character Select → Hangar). Shown on the new
          grey-box game, hidden in Edit Mode and in the dormant POLI 'world' reference. */}
      {!editMode && !world && <GameScreens />}
      {!editMode && !world && basePhase && <BaseHud />}
      {!editMode && !world && basePhase && <RescueRosterPanel />}
      {!editMode && !world && flightPhase && <FlightHud />}
      {flightPhase && <FlightPhaseEventHud />}
      {editMode && (flightPhase || worldFlightPhase) && <FlightPlaybackOverlay />}
      {!editMode && !world && worldFlightPhase && (
        <>
          <FlightProgressHud />
          <FlightSonarHud />
          <WorldMapHud />
          <FlightRewardHud />
        </>
      )}
      {!editMode && !world && approachPhase && <DestinationApproachHud />}
      {!editMode && !world && transformPhase && <TransformationHud />}
      {!editMode && !world && descentPhase && <DescentHud />}
      {!editMode && !world && landingPhase && <LandingHud />}
      {!editMode && !world && missionPhase && !zonePhase && <MissionHud />}
      {!editMode && !world && zonePhase && <MissionZoneHud />}
      {!editMode && !world && zonePhase && <StageProgressHud />}
      {!editMode && !world && zonePhase && <ThreatGaugeHud />}
      {!editMode && !world && zonePhase && <MissionObjectiveHud />}
      {!editMode && !world && zonePhase && <RouteChoiceOverlay />}
      {!editMode && !world && arenaRunPhase && <ArenaRunHud />}
      {!editMode && !world && arenaRunPhase && <RunBuffChoiceOverlay />}
      {!editMode && !world && arenaRunPhase && <RoomInteractionOverlay />}
      {!editMode && !world && arenaRunPhase && <RunResultsOverlay />}
      {!editMode && !world && combatPhase && <CombatHud />}
      {!editMode && !world && combatPhase && <CombatFeedbackLayer />}
      {showDeveloperDebug && !world && (combatPhase || zonePhase) && <GodModePanel />}
      {!editMode && !world && combatPhase && <CharacterSkillHud />}
      {showDeveloperDebug && combatPhase && <CharacterSkillDebugPanel />}
      {!editMode && !world && (combatPhase || zonePhase) && <SupportCombatPanel />}
      {!editMode && !world && (combatPhase || zonePhase) && <SupportStatusHud />}
      {!editMode && !world && (combatPhase || zonePhase) && <PartnerFusionHud />}
      {!editMode && !world && (combatPhase || zonePhase) && <SupportSynergyToast />}
      {showDeveloperDebug && combatPhase && <SupportCombatDebugPanel />}
      {!editMode && !world && (combatPhase || zonePhase) && <BossHud />}
      {!editMode && !world && (combatPhase || zonePhase) && <BossIntroOverlay />}
      {!editMode && !world && (combatPhase || zonePhase) && <BossWarningToast />}
      {showDeveloperDebug && combatPhase && <BossDebugPanel />}
      {showDeveloperDebug && combatPhase && <CinematicAbilityDebugPanel />}
      {showDeveloperDebug && combatPhase && <VfxShowcaseDebugPanel />}
      {showDeveloperDebug && combatPhase && <CinematicVfxDebugPanel />}
      {!editMode && !world && zonePhase && <IncidentHud />}
      {showDeveloperDebug && zonePhase && <IncidentDebugPanel />}
      {!editMode && !world && (missionPhase || missionDonePhase) && !zonePhase && <QuestTracker />}
      {!editMode && !world && missionPhase && <SupportDispatchDirectorHost />}
      {!editMode && !world && missionPhase && <SupportSelectionPanel />}
      {!editMode && !world && missionPhase && <SupportCallButton />}
      {!editMode && !world && missionPhase && <SupportDispatchStatusPanel />}
      {!editMode && !world && missionPhase && <SupportArrivalToast />}
      {!editMode && !world && missionPhase && <MultiCharacterHud />}
      {!editMode && !world && missionPhase && <HuntHud />}
      {!editMode && !world && missionDonePhase && <MissionCompleteHud />}
      {!editMode && !world && missionDonePhase && stageStatus === 'stage-clear' && <StageClearPanel />}
      {!editMode && !world && stageStatus === 'stage-failed' && <StageFailedPanel />}
      {!editMode && !world && hangarReturnPhase && <HangarReturnHud />}
      {!editMode && !world && resultsPhase && <MissionResultsScreen />}
      {/* POLI dialogue box + the Phaser mini-game overlay serve the destination phases too. */}
      {!editMode && !world && missionPhase && <DialogueBox />}
      {!editMode && !world && <PhaserOverlay />}
      {(!demoEnabled || editMode) && <Dock />}
      {showDeveloperDebug && <DevPanel />}
      {/* Phase jumper: always available in Edit Mode (jump to any mid-game scene), plus the Leva toggle. */}
      {showDeveloperDebug && <GameStateDebugPanel />}
      {showDeveloperDebug && transformPhase && <TransformationDebugPanel />}
      {showDeveloperDebug && (descentPhase || landingPhase || missionPhase || missionDonePhase) && <DestinationDebugPanel />}
      {showDeveloperDebug && missionPhase && <SupportDebugPanel />}
      {showDeveloperDebug && zonePhase && <MissionZoneDebugPanel />}
      {showDeveloperDebug && combatPhase && <CombatDebugPanel />}
      {showDeveloperDebug && !world && <CampaignDebugPanel />}
      {showDeveloperDebug && !world && <StageDebugPanel />}
      {showDeveloperDebug && !world && <EncounterDebugPanel />}
      {showDeveloperDebug && !world && <EnvironmentDebugPanel />}
      {/* Edit Mode: independent panels — Assets (left-centre), Inspector (top-left), terrain palette, and
          the centred draggable Hub — matching the original layout. */}
      {editMode && <EditAssetPalette />}
      {editMode && <MissionAreaQuickAddOverlay />}
      {editMode && <EditModeInspector />}
      {editMode && <SelectionTabSync />}
      {editMode && <TerrainBrushHud />}
      {editMode && editorHubOpen && <EditorHubPanel />}
      <ScreenFade />
      {/* Batch 12 — perf panel (gated by showPerfHud) + safe-tint route color grade (world-flight phases). */}
      <PerformanceDebugPanel />
      {/* Batch 13 — AutoPlaytester (debug/test only): director always mounted (ticks only when enabled),
          panel shown in dev/edit mode or when an auto run is active. */}
      <AutoPlaytesterDirector />
      {(showDeveloperDebug || autoEnabled) && <AutoPlaytesterPanel />}
      {/* Batch 13 — runtime health + save debug tools (FSM-debug only, to avoid cluttering Edit Mode). */}
      {fsmDebug && <RuntimeHealthPanel />}
      {fsmDebug && <SaveDebugPanel />}
      {showDeveloperDebug && !world && <ReleaseCandidatePanel />}
      {showDeveloperDebug && !world && <DiagnosticsPanel />}
      {!world && <RuntimeErrorOverlay />}
      {/* Batch 13.1 — in-game system menu (pause + settings + save) for aero play mode. */}
      {!editMode && !world && <SystemMenuButton />}
      {!editMode && !world && <SystemMenu />}
      {!editMode && !world && <RouteColorGradeOverlay />}
      {showDeveloperDebug && <PlayerPosDebug />}
      {/* Single R3F canvas (error boundary + Suspense loading inside). DPR capped lower (high-DPI screens
          were fill-bound); a PerformanceMonitor in Scene adapts it. */}
      <GameCanvas />
    </div>
    </GameErrorBoundary>
  );
};
