import { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { useUiStore } from './stores/uiStore';
import { useAudioStore } from './stores/audioStore';
import { useTerrainHistoryStore } from './stores/terrainHistoryStore';
import { useSceneEditStore } from './stores/sceneEditStore';
import { useWorldSelectStore } from './stores/worldSelectStore';
import { usePbrPatchEditStore } from './stores/pbrPatchEditStore';
import { useEditorEnvironmentStore } from './stores/editorEnvironmentStore';
import { usePlayerStore } from './stores/playerStore';
import { useEditorWorldStore } from './stores/editorWorldStore';
import { Scene } from './game/core/Scene';
import { CanvasErrorBoundary } from './ui/CanvasErrorBoundary';
import { usePoll } from './ui/usePoll';
import { syncEditorQuests } from './game/editor/editorQuestToQuest';
import { QuestTrackerController } from './game/quest/questTracking';
import { InteractionHandler } from './game/interaction/InteractionHandler';
import { Dock } from './ui/Dock';
import { EditorHubPanel } from './ui/EditorHubPanel';
import { EditAssetPalette } from './ui/EditAssetPalette';
import { EditModeInspector } from './ui/EditModeInspector';
import { TerrainBrushHud } from './ui/TerrainBrushHud';
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
import { YokaiDirector } from './game/poli/YokaiDirector';
import { RescueHud } from './ui/RescueHud';
import { ToolBeltHud } from './ui/ToolBeltHud';
import { LicenseBadge } from './ui/LicenseBadge';
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

  // Drive timed research completion even when the Research Station panel is closed.
  useEffect(() => {
    const id = setInterval(() => useJinResearchStore.getState().tickResearch(), 500);
    return () => clearInterval(id);
  }, []);

  // Start global editor Undo/Redo tracking (snapshots every authoring edit for Ctrl+Z / Ctrl+Shift+Z).
  useEffect(() => { initEditorUndo(); }, []);

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
      if (e.code === 'KeyD' && e.shiftKey) { e.preventDefault(); duplicateAllSelected(); return; }
      if (e.code === 'KeyW') useSceneEditStore.getState().setMode('translate');
      else if (e.code === 'KeyE') useSceneEditStore.getState().setMode('rotate');
      else if (e.code === 'KeyR') useSceneEditStore.getState().setMode('scale');
      else if (e.code === 'Delete' || e.code === 'Backspace') {
        // A DataBackedPlacement (crosswalk / incident / marker) selection deletes via its own store; otherwise
        // delete the kit-selected placement (set-piece / NPC / landmark / map point / portal).
        const ws = useWorldSelectStore.getState();
        if (ws.selectedKey && ws.onDelete) { ws.onDelete(); ws.select(null); }
        else useSceneEditStore.getState().deleteSelected();
      }
      else if (e.code === 'Escape') { useSceneEditStore.getState().clearSelection(); useWorldSelectStore.getState().select(null); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="fixed inset-0 bg-gray-900">
      <InteractionHandler />
      <QuestTrackerController />
      <PoliSystemBoot />
      <IncidentDirector />
      <YokaiDirector />
      <Dock />
      <WorldClockHUD />
      {/* Overworld-only HUD (hidden while editing). */}
      {!editMode && !inBattle && !inActivity && !isRescueActive && <InteractionPrompt />}
      {!editMode && !inBattle && !inActivity && !isRescueActive && <QuestTracker />}
      {!editMode && !inBattle && !inActivity && !isRescueActive && <PlayToolbar />}
      {!editMode && !inBattle && !inActivity && !isRescueActive && <ToolBeltHud />}
      {!editMode && !inBattle && !inActivity && !isRescueActive && <LicenseBadge />}
      {!editMode && !inBattle && !inActivity && !isRescueActive && <ResearchStationHud />}
      {!editMode && !inBattle && !inActivity && !isRescueActive && <BoostMeterHud />}
      {!editMode && !inBattle && !inActivity && !isRescueActive && <ResourceHud />}
      {!editMode && <CoinsHud />}
      {!editMode && <ShopPanel />}
      <DialogueBox />
      <BattleOverlay />
      <ActivityHud />
      <RescueHud />
      {/* Edit Mode: independent panels — Assets (left-centre), Inspector (top-left), terrain palette, and
          the centred draggable Hub — matching the original layout. */}
      {editMode && <EditAssetPalette />}
      {editMode && <EditModeInspector />}
      {editMode && <TerrainBrushHud />}
      {editMode && editorHubOpen && <EditorHubPanel />}
      <ScreenFade />
      <PlayerPosDebug />
      {/* DPR capped lower (high-DPI screens were fill-bound); a PerformanceMonitor in Scene adapts it. */}
      <CanvasErrorBoundary>
        <Canvas
          shadows
          dpr={[1, 1.5]}
          camera={{ position: [0, 5, 10], fov: 50, near: 0.1, far: 1500 }}
          // Clicking empty space deselects both selection systems so a gizmo never gets "stuck" and the next
          // object click always lands (Edit Mode only).
          onPointerMissed={() => {
            if (!useUiStore.getState().editMode) return;
            useSceneEditStore.getState().clearSelection();
            useWorldSelectStore.getState().select(null);
            usePbrPatchEditStore.getState().select(null);
          }}
        >
          <Scene />
        </Canvas>
      </CanvasErrorBoundary>
    </div>
  );
};
