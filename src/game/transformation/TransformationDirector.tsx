import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../stores/game/useGameStore';
import { useCharacterStore } from '../../stores/game/useCharacterStore';
import { getEditorCharacter } from '../../stores/game/editorCharacterStore';
import { getEditorTransformations } from '../../stores/game/editorTransformationStore';
import { getGameSettings } from '../../stores/game/useSettingsStore';
import { flightHandle } from '../flight/flightHandle';
import { TransformationTimelineRunner } from './TransformationTimelineRunner';
import { CharacterFormController } from './CharacterFormController';
import { validateTimeline } from './transformationValidation';
import { txFrame, transformationHandle, useTxVersion, resetTransformationRuntime } from './transformationRuntime';
import { transformationDev } from './transformationDev';
import { descentEntry } from './descentEntry';
import type { TransformationDefinition } from '../../types/game/transformation';

// PLAY-mode transformation orchestrator (logic in the pure Runner + FormController; this host only binds them
// to the frame loop, input, and the state machine). On enter: pause flight input, snapshot entry velocity,
// run the timeline. Switches form/collider at the configured time (never two active). Interactive showcase
// (A/D rotate · 1/2/3 pose · Enter confirm · Esc skip). On finish: momentum transfer → DESCENT. Disposes all.
const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

function findTimeline(characterId: string | null, transformationId?: string): TransformationDefinition | undefined {
  const all = getEditorTransformations();
  return (transformationId && all.find((t) => t.id === transformationId)) || all.find((t) => t.characterId === characterId) || all[0];
}

export const TransformationDirector = () => {
  const runner = useRef<TransformationTimelineRunner | null>(null);
  const form = useRef<CharacterFormController>(new CharacterFormController());
  const keys = useRef<Record<string, boolean>>({});
  const done = useRef(false);
  const entrySpeed = useRef(0);
  const charId = useCharacterStore((s) => s.selectedCharacterId);

  useEffect(() => {
    const character = charId ? getEditorCharacter(charId) : undefined;
    const def = findTimeline(charId, character?.transformationId);
    done.current = false;
    if (!def || validateTimeline(def).length > 0) {
      // invalid / missing → skip straight to descent (never crash)
      useGameStore.getState().requestTransition('DESCENT');
      return;
    }
    const mode = getGameSettings().transformMode;
    runner.current = new TransformationTimelineRunner(def, mode);
    form.current.reset();
    form.current.beginTransform();
    entrySpeed.current = flightHandle.speed;
    txFrame.def = def;
    txFrame.charModelId = character?.modelAssetId;
    txFrame.showcaseYaw = 0;

    const down = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName ?? '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      keys.current[e.code] = true;
      const r = runner.current;
      if (!r) return;
      if (e.code === 'Escape') r.fastForward();
      if ((e.code === 'Enter' || e.code === 'Space') && r.getPhase() === 'showcase') r.confirm();
    };
    const up = (e: KeyboardEvent) => { keys.current[e.code] = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    const fc = form.current;
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      fc.dispose();
      resetTransformationRuntime();
    };
  }, [charId]);

  useFrame((_, dtRaw) => {
    const r = runner.current;
    const def = txFrame.def;
    if (!r || !def) return;
    const dt = Math.min(dtRaw, 0.05);

    // dev commands
    if (transformationDev.reset) { transformationDev.reset = false; r.reset(); form.current.reset(); form.current.beginTransform(); done.current = false; }
    if (transformationDev.forceFinish) { transformationDev.forceFinish = false; r.fastForward(); }
    if (transformationDev.forceQuick) { transformationDev.forceQuick = false; runner.current = new TransformationTimelineRunner(def, 'quick'); form.current.reset(); form.current.beginTransform(); done.current = false; return; }

    r.tick(dt);

    // showcase rotation
    if (r.getPhase() === 'showcase') {
      const k = keys.current;
      const dir = (k['KeyD'] || k['ArrowRight'] ? 1 : 0) - (k['KeyA'] || k['ArrowLeft'] ? 1 : 0);
      txFrame.showcaseYaw += dir * def.interactionShowcase.rotateSpeedDeg * (Math.PI / 180) * dt;
    }

    // form/collider switch at the configured time (idempotent; never both active)
    if (r.time >= def.controllerSwitchConfig.robotControllerEnableTime && form.current.getCurrentForm() !== 'robot') {
      form.current.switchToRobotForm();
    }

    // publish snapshot + handle (+ effect-set version bump)
    const snap = r.getSnapshot();
    txFrame.snapshot = snap;
    useTxVersion.getState().bump(snap.activeEffects.map((e) => e.id).join(','));
    const fc = form.current;
    Object.assign(transformationHandle, {
      timelineId: def.id, characterId: charId ?? '', mode: r.mode, time: snap.time, duration: snap.duration,
      progress: snap.progress, phase: snap.phase, stageLabel: snap.activeStageLabel, form: fc.getCurrentForm(),
      planeCtrl: fc.planeControllerActive, robotCtrl: fc.robotControllerActive, planeCol: fc.planeColliderActive,
      robotCol: fc.robotColliderActive, effects: snap.activeEffects.length,
    });

    // finish → momentum transfer → DESCENT
    if (r.isDone() && !done.current) {
      done.current = true;
      if (fc.getCurrentForm() !== 'robot') fc.switchToRobotForm();
      const m = def.momentumTransferConfig;
      descentEntry.velocity = clamp(m.initialDescentVelocity + (m.preserveHorizontalVelocity ? entrySpeed.current * m.horizontalVelocityMultiplier : 0), 0, m.clampMaxDescentSpeed);
      descentEntry.faceCamera = m.faceCameraOnExit;
      useGameStore.getState().requestTransition('DESCENT');
    }
  });

  return null;
};
