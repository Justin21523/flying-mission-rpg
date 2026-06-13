import type { CameraRotationMode, TransformationCameraShot, TransformationDefinition } from '../../types/game/transformation';

const DEG = Math.PI / 180;
const DEFAULT_ROTATE_SPEED_DEG = 17.188733853924695; // previous no-shot t * 0.3 rad/s
const DEFAULT_SHOT_ROTATE_SPEED_DEG = 22.91831180523293; // previous orbit shot t * 0.4 rad/s

export interface CameraMotionSource {
  activeCameraShot: TransformationCameraShot | null;
  elapsedTime: number;
  definition?: Pick<TransformationDefinition, 'cameraRotationMode' | 'cameraRotateSpeedDeg'>;
}

function inheritedMode(definition?: Pick<TransformationDefinition, 'cameraRotationMode'>): Exclude<CameraRotationMode, 'inherit'> {
  return definition?.cameraRotationMode ?? 'auto';
}

function shotWantsLegacyOrbit(shot: TransformationCameraShot): boolean {
  return shot.type === 'orbit' || shot.type === 'finish-hero-shot';
}

export function cameraAngleRadians({ activeCameraShot, elapsedTime, definition }: CameraMotionSource): number {
  const timelineMode = inheritedMode(definition);
  const timelineSpeed = definition?.cameraRotateSpeedDeg ?? DEFAULT_ROTATE_SPEED_DEG;
  if (!activeCameraShot) {
    if (timelineMode === 'locked' || timelineMode === 'stage-controlled') return 0;
    return elapsedTime * timelineSpeed * DEG;
  }

  const base = activeCameraShot.angle * DEG;
  const explicitShotMode = activeCameraShot.rotationMode != null && activeCameraShot.rotationMode !== 'inherit';
  const mode = explicitShotMode ? activeCameraShot.rotationMode! : timelineMode;
  if (mode === 'locked') return base;
  if (mode === 'stage-controlled' && activeCameraShot.rotationMode !== 'auto') return base;
  if (mode === 'auto' || activeCameraShot.rotationMode === 'auto') {
    const fallbackSpeed = explicitShotMode || shotWantsLegacyOrbit(activeCameraShot) ? DEFAULT_SHOT_ROTATE_SPEED_DEG : 0;
    const speed = activeCameraShot.rotateSpeedDeg ?? definition?.cameraRotateSpeedDeg ?? fallbackSpeed;
    return base + elapsedTime * speed * DEG;
  }
  return base;
}
