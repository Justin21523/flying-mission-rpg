// Additive camera FX written by CameraEffectRenderer (camera_* / time_slow) and read by
// TransformationCameraController, which adds them on top of the authored camera shot. Last-writer-wins per
// frame (one camera effect at a time is the common case); reset on cleanup.
export const txCameraFx = { shake: 0, fovDelta: 0, distMul: 1, timeScale: 1 };

export function resetCameraFx(): void {
  txCameraFx.shake = 0;
  txCameraFx.fovDelta = 0;
  txCameraFx.distMul = 1;
  txCameraFx.timeScale = 1;
}
