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
import { emitAudioEvent } from '../audio/AudioEventBus';
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
  // RETURN_TRANSFORMATION plays the SAME authored timeline in REVERSE (robot folds back to vehicle) and hands
  // off to the return flight instead of the descent. The runner snapshot is a pure function of time, so a
  // descending playhead (seek) reverses the visuals; the form ends in plane via switchToPlaneForm().
  const reverse = useGameStore((s) => s.phase === 'RETURN_TRANSFORMATION');
  const revT = useRef(0); // reverse playhead (counts down from duration → 0)
  const revDur = useRef(1);
  // Batch 12.1 — track which effect tracks are already active so we fire an audio cue once on entry.
  const prevFx = useRef<Set<string>>(new Set());

  useEffect(() => {
    const character = charId ? getEditorCharacter(charId) : undefined;
    const def = findTimeline(charId, character?.transformationId);
    done.current = false;
    if (!def || validateTimeline(def).length > 0) {
      // invalid / missing → skip straight to the next phase for this direction (never crash)
      useGameStore.getState().requestTransition(reverse ? 'RETURN_FLIGHT' : 'DESCENT');
      return;
    }
    const mode = getGameSettings().transformMode;
    runner.current = new TransformationTimelineRunner(def, mode);
    form.current.reset();
    form.current.beginTransform();
    entrySpeed.current = flightHandle.speed;
    // Reverse: start the playhead at the end (robot) and switch the controller to robot so the fold-back reads
    // from the finished robot pose. The descending playhead in useFrame plays the timeline backward.
    if (reverse) {
      revDur.current = runner.current.getSnapshot().duration;
      revT.current = revDur.current;
      runner.current.seek(revDur.current);
      form.current.switchToRobotForm();
    }
    txFrame.def = def;
    txFrame.charModelId = character?.modelAssetId;
    txFrame.showcaseYaw = 0;
    prevFx.current = new Set();
    if (!reverse) emitAudioEvent({ type: 'transformation-stage', stage: 'start' });

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
  }, [charId, reverse]);

  useFrame((_, dtRaw) => {
    const r = runner.current;
    const def = txFrame.def;
    if (!r || !def) return;
    const dt = Math.min(dtRaw, 0.05);

    // dev commands
    if (transformationDev.reset) { transformationDev.reset = false; r.reset(); form.current.reset(); form.current.beginTransform(); done.current = false; }
    if (transformationDev.forceFinish) { transformationDev.forceFinish = false; r.fastForward(); }
    if (transformationDev.forceQuick) { transformationDev.forceQuick = false; runner.current = new TransformationTimelineRunner(def, 'quick'); form.current.reset(); form.current.beginTransform(); done.current = false; return; }

    // ── REVERSE (RETURN_TRANSFORMATION): descending playhead → robot folds back to vehicle → RETURN_FLIGHT ──
    if (reverse) {
      revT.current = Math.max(0, revT.current - dt);
      r.seek(revT.current);
      // switch robot→plane in the last quarter of the fold (mirror of the forward robot-enable point)
      const switchAt = Math.min(revDur.current * 0.25, def.controllerSwitchConfig?.robotControllerEnableTime ?? revDur.current * 0.25);
      if (revT.current <= switchAt && form.current.getCurrentForm() !== 'plane') form.current.switchToPlaneForm();
      const rsnap = r.getSnapshot();
      txFrame.snapshot = rsnap;
      useTxVersion.getState().bump(`${rsnap.activeEffects.map((e) => e.id).join(',')}|${rsnap.activeModelRef ?? ''}:${rsnap.activeModelStageId ?? ''}|${rsnap.activeModelClips.map((c) => `${c.stageId}:${c.modelSlot ?? c.modelRef ?? ''}:${c.clipName}`).join(',')}`);
      const rfc = form.current;
      Object.assign(transformationHandle, {
        timelineId: def.id, characterId: charId ?? '', mode: r.mode, time: rsnap.time, duration: rsnap.duration,
        progress: 1 - rsnap.progress, phase: rsnap.phase, stageLabel: rsnap.activeStageLabel, form: rfc.getCurrentForm(),
        planeCtrl: rfc.planeControllerActive, robotCtrl: rfc.robotControllerActive, planeCol: rfc.planeColliderActive,
        robotCol: rfc.robotColliderActive, effects: rsnap.activeEffects.length,
      });
      if (revT.current <= 0 && !done.current) {
        done.current = true;
        if (rfc.getCurrentForm() !== 'plane') rfc.switchToPlaneForm();
        useGameStore.getState().requestTransition('RETURN_FLIGHT');
      }
      return;
    }

    r.tick(dt);

    // showcase rotation
    if (r.getPhase() === 'showcase') {
      const k = keys.current;
      const dir = (k['KeyD'] || k['ArrowRight'] ? 1 : 0) - (k['KeyA'] || k['ArrowLeft'] ? 1 : 0);
      txFrame.showcaseYaw += dir * (def.interactionShowcase?.rotateSpeedDeg ?? 90) * (Math.PI / 180) * dt;
    }

    // form/collider switch at the configured time (idempotent; never both active)
    if (r.time >= (def.controllerSwitchConfig?.robotControllerEnableTime ?? 0) && form.current.getCurrentForm() !== 'robot') {
      form.current.switchToRobotForm();
    }

    // publish snapshot + handle (+ effect-set version bump)
    const snap = r.getSnapshot();
    txFrame.snapshot = snap;
    // Fire an audio cue once when a notable effect track enters (energy ring / white flash).
    for (const fx of snap.activeEffects) {
      if (!prevFx.current.has(fx.id)) {
        prevFx.current.add(fx.id);
        if (fx.type === 'energy-ring' || fx.type === 'white-flash') emitAudioEvent({ type: 'transformation-stage', stage: fx.type });
      }
    }
    useTxVersion.getState().bump(`${snap.activeEffects.map((e) => e.id).join(',')}|${snap.activeModelRef ?? ''}:${snap.activeModelStageId ?? ''}|${snap.activeModelClips.map((c) => `${c.stageId}:${c.modelSlot ?? c.modelRef ?? ''}:${c.clipName}`).join(',')}`);
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
      emitAudioEvent({ type: 'transformation-stage', stage: 'finish' });
      if (fc.getCurrentForm() !== 'robot') fc.switchToRobotForm();
      const m = def.momentumTransferConfig ?? { preserveHorizontalVelocity: false, horizontalVelocityMultiplier: 0, initialDescentVelocity: 8, clampMaxDescentSpeed: 30, faceCameraOnExit: true };
      descentEntry.velocity = clamp(m.initialDescentVelocity + (m.preserveHorizontalVelocity ? entrySpeed.current * m.horizontalVelocityMultiplier : 0), 0, m.clampMaxDescentSpeed);
      descentEntry.faceCamera = m.faceCameraOnExit;
      useGameStore.getState().requestTransition('DESCENT');
    }
  });

  return null;
};
