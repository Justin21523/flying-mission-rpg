import type { ModelSlot, TransformationPartKey } from '../../types/game/transformation';

// Authoritative character form state for the transformation. Pure (no R3F) so it is unit-testable; the
// presenter reads its state each frame. The hard invariant (tested): the plane + robot controllers are never
// both active, and the plane + robot colliders are never both active (unless a transitional collider is
// explicitly allowed).
export type CharacterForm = 'plane' | 'transforming' | 'robot';

export interface PartTransform {
  position: [number, number, number];
  rotation: [number, number, number]; // degrees
  scale: number;
  visible: boolean;
}

export class CharacterFormController {
  private form: CharacterForm = 'plane';
  planeControllerActive = true;
  robotControllerActive = false;
  planeColliderActive = true;
  robotColliderActive = false;
  modelVisible: Record<ModelSlot, boolean> = { plane: true, robot: false, shared: false };
  private parts = new Map<TransformationPartKey, PartTransform>();
  private currentClip: string | null = null;
  finishPoseApplied = false;

  getCurrentForm(): CharacterForm {
    return this.form;
  }

  // Enter the transforming state — plane player input must stop immediately.
  beginTransform(): void {
    this.form = 'transforming';
    this.planeControllerActive = false;
  }

  switchToPlaneForm(): void {
    this.form = 'plane';
    this.enablePlaneModel();
    this.disableRobotModel();
    this.planeControllerActive = true;
    this.robotControllerActive = false;
    this.planeColliderActive = true;
    this.robotColliderActive = false;
  }

  switchToRobotForm(): void {
    this.form = 'robot';
    this.disablePlaneModel();
    this.enableRobotModel();
    this.planeControllerActive = false;
    this.robotControllerActive = true;
    this.planeColliderActive = false;
    this.robotColliderActive = true;
  }

  enablePlaneModel(): void { this.modelVisible.plane = true; }
  disablePlaneModel(): void { this.modelVisible.plane = false; }
  enableRobotModel(): void { this.modelVisible.robot = true; }
  disableRobotModel(): void { this.modelVisible.robot = false; }
  enableSharedModel(): void { this.modelVisible.shared = true; }
  disableSharedModel(): void { this.modelVisible.shared = false; }
  setModelVisible(slot: ModelSlot, v: boolean): void { this.modelVisible[slot] = v; }

  playAnimationClip(name: string): void { this.currentClip = name; }
  stopAnimationClip(): void { this.currentClip = null; }
  getCurrentClip(): string | null { return this.currentClip; }

  setPartTransform(key: TransformationPartKey, t: PartTransform): void { this.parts.set(key, t); }
  getPartTransform(key: TransformationPartKey): PartTransform | undefined { return this.parts.get(key); }
  getParts(): Map<TransformationPartKey, PartTransform> { return this.parts; }
  resetPartTransforms(): void { this.parts.clear(); }
  applyFinishPose(): void { this.finishPoseApplied = true; }

  // Safety invariants (asserted in tests + checked by the director).
  hasControllerConflict(): boolean { return this.planeControllerActive && this.robotControllerActive; }
  hasColliderConflict(transitionalAllowed = false): boolean {
    return !transitionalAllowed && this.planeColliderActive && this.robotColliderActive;
  }

  reset(): void {
    this.form = 'plane';
    this.planeControllerActive = true;
    this.robotControllerActive = false;
    this.planeColliderActive = true;
    this.robotColliderActive = false;
    this.modelVisible = { plane: true, robot: false, shared: false };
    this.parts.clear();
    this.currentClip = null;
    this.finishPoseApplied = false;
  }

  dispose(): void {
    this.parts.clear();
    this.currentClip = null;
  }
}
