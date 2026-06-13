import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, type PerspectiveCamera } from 'three';
import { txFrame } from './transformationRuntime';
import { useAudioStore } from '../../stores/audioStore';
import { useGraphicsSettingsStore } from '../../stores/graphicsSettingsStore';
import { effectiveQualityPreset } from '../performance/QualityPresetController';
import { cameraAngleRadians } from './transformationCameraMotion';

// Drives the camera from the runner's active camera shot (orbit / close-up / low-angle / top-down / side-pan
// / pull-back / finish-hero). Positions around the character at the origin by angle/distance/height, sets fov,
// adds optional shake. Smoothly restores a sane camera on unmount so the next scene's camera is unaffected.
const _pos = new Vector3();
const _look = new Vector3();
const lerp = (a: number, b: number, t: number) => a + (b - a) * Math.min(1, t);

export const TransformationCameraController = () => {
  const { camera } = useThree();
  // Batch 12 — reduce-motion / quality gate for camera shake (cached; recomputed only on settings change).
  const shakeAllowed = useRef(!useAudioStore.getState().reduceMotion && effectiveQualityPreset().cameraShakeEnabled);
  useEffect(() => {
    const cam = camera as PerspectiveCamera;
    const update = (): void => { shakeAllowed.current = !useAudioStore.getState().reduceMotion && effectiveQualityPreset().cameraShakeEnabled; };
    const u1 = useAudioStore.subscribe(update);
    const u2 = useGraphicsSettingsStore.subscribe(update);
    return () => { u1(); u2(); cam.up.set(0, 1, 0); cam.fov = 50; cam.updateProjectionMatrix(); };
  }, [camera]);

  useFrame((state, dtRaw) => {
    const cam = state.camera as PerspectiveCamera;
    const dt = Math.min(dtRaw, 0.05);
    const k = 1 - Math.exp(-6 * dt);
    const shot = txFrame.snapshot?.activeCameraShot ?? null;
    const t = state.clock.elapsedTime;

    let distance = 7, height = 2, fov = 55, shake = 0;
    const angle = cameraAngleRadians({ activeCameraShot: shot, elapsedTime: t, definition: txFrame.def ?? undefined });
    const off = shot?.lookAtOffset ?? [0, 0.4, 0];
    if (shot) {
      distance = shot.distance;
      height = shot.height;
      fov = shot.fov;
      shake = shot.shakeIntensity ?? 0;
    }

    if (!shakeAllowed.current) shake = 0;
    _pos.set(Math.sin(angle) * distance, height, Math.cos(angle) * distance);
    if (shake > 0) { _pos.x += (Math.random() - 0.5) * shake; _pos.y += (Math.random() - 0.5) * shake; }
    cam.position.lerp(_pos, k);
    _look.set(off[0], off[1], off[2]);
    cam.up.set(0, 1, 0);
    cam.lookAt(_look);
    cam.fov = lerp(cam.fov, fov, k);
    cam.updateProjectionMatrix();
  });

  return null;
};
