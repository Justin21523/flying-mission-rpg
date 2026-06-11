import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { TransformationTimelineRunner } from './TransformationTimelineRunner';
import { useTransformationPreviewStore } from '../../stores/game/transformationPreviewStore';
import { txFrame, transformationHandle, useTxVersion } from './transformationRuntime';
import type { TransformationDefinition } from '../../types/game/transformation';

// EDIT-mode preview driver — runs the runner from the ✨ Transform Preview controls (mode + scrub/play) so the
// stage shows exactly what play will. No form/collider switching, no state-machine transitions.
export const TransformationPreviewController = ({ def }: { def: TransformationDefinition }) => {
  const runner = useRef<TransformationTimelineRunner | null>(null);
  const mode = useTransformationPreviewStore((s) => s.mode);

  useEffect(() => {
    runner.current = new TransformationTimelineRunner(def, mode);
    txFrame.def = def;
  }, [def, mode]);

  useFrame((_, dtRaw) => {
    const r = runner.current;
    if (!r) return;
    const dt = Math.min(dtRaw, 0.05);
    const ps = useTransformationPreviewStore.getState();
    ps.advance(dt, r.duration);
    r.seek(useTransformationPreviewStore.getState().time);
    const snap = r.getSnapshot();
    txFrame.snapshot = snap;
    useTxVersion.getState().bump(`${snap.activeEffects.map((e) => e.id).join(',')}|${snap.activeModelRef ?? ''}:${snap.activeModelStageId ?? ''}|${snap.activeModelClips.map((c) => `${c.stageId}:${c.modelSlot ?? c.modelRef ?? ''}:${c.clipName}`).join(',')}`);
    Object.assign(transformationHandle, {
      timelineId: def.id, characterId: def.characterId ?? '', mode, time: snap.time, duration: snap.duration,
      progress: snap.progress, phase: snap.phase, stageLabel: snap.activeStageLabel, form: snap.modelVisible.robot ? 'robot' : 'transforming',
      planeCtrl: false, robotCtrl: snap.modelVisible.robot, planeCol: false, robotCol: snap.modelVisible.robot, effects: snap.activeEffects.length,
    });
  });

  return null;
};
