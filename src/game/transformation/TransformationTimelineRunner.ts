import type {
  TransformationDefinition, TransformationStage, TransformationCameraShot, TransformationEffectTrack,
  TransformationPartKey, ModelSlot, Easing, FormStrategy,
} from '../../types/game/transformation';

// Pure, deterministic timeline runner (no R3F → unit-testable). Holds a timeline + mode, advances time on
// tick(dt), and resolves a full snapshot (parts / model visibility / clip / camera shot / effects / backdrop)
// at the current time. Supports pause/resume, seek, fastForward (apply final states) and an interactive
// showcase hold. Quick mode keeps only the essential stages, time-scaled to quickDurationSec.

export interface PartState {
  position: [number, number, number];
  rotation: [number, number, number]; // degrees
  scale: number;
  visible: boolean;
}
export interface ActiveModelClip {
  stageId: string;
  modelSlot?: ModelSlot;
  modelRef?: string;
  clipName: string;
  clipSpeed: number;
  loop: boolean;
  holdFinal: boolean;
}
// Additive animated motion for a model slot, produced by 'model-move' stages (position+rotation added to,
// scale multiplied onto, the authored slot offset).
export interface SlotMotion {
  position: [number, number, number];
  rotation: [number, number, number]; // degrees
  scale: number;
}
const IDENTITY_MOTION = (): SlotMotion => ({ position: [0, 0, 0], rotation: [0, 0, 0], scale: 1 });

export type RunnerPhase = 'playing' | 'showcase' | 'done';
export interface RunnerSnapshot {
  time: number;
  duration: number;
  progress: number; // 0..1
  phase: RunnerPhase;
  activeStageLabel: string;
  parts: Map<TransformationPartKey, PartState>;
  modelVisible: Record<ModelSlot, boolean>;
  activeModelRef: string | null; // arbitrary extra model shown by a model-swap stage with params.modelRef
  activeModelStageId: string | null;
  activeClip: string | null; // latest active clip name, kept for debug panels
  activeModelClips: ActiveModelClip[];
  activeCameraShot: TransformationCameraShot | null;
  activeEffects: TransformationEffectTrack[];
  backdropIntensity: number;
  rootYOffset: number; // slow exit descent — how far the character root has sunk (world units)
  modelMotion: Record<ModelSlot, SlotMotion>; // animated per-slot offset from 'model-move' stages
  exitScaleMul: number; // root scale multiplier during the exit fly-out (1 = none)
}

const ESSENTIAL_TYPES = new Set(['model-swap', 'model-visibility', 'finish-pose', 'exit-stage']);

function ease(e: Easing | undefined, t: number): number {
  const x = t < 0 ? 0 : t > 1 ? 1 : t;
  switch (e) {
    case 'easeIn': return x * x;
    case 'easeOut': return 1 - (1 - x) * (1 - x);
    case 'easeInOut': return x * x * (3 - 2 * x);
    default: return x;
  }
}
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerp3 = (a: [number, number, number], b: [number, number, number], t: number): [number, number, number] =>
  [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

function baseModelVisible(strategy: FormStrategy): Record<ModelSlot, boolean> {
  switch (strategy) {
    case 'dual-model-swap': return { plane: true, robot: false, shared: false };
    case 'single-model-multi-animation': return { plane: false, robot: false, shared: true };
    case 'hybrid': return { plane: true, robot: false, shared: false };
    default: return { plane: false, robot: false, shared: false }; // modular-parts-procedural
  }
}

function fallbackClipSlot(def: TransformationDefinition): ModelSlot {
  if (def.sharedModelRef) return 'shared';
  return 'robot';
}

function resolveClipTarget(def: TransformationDefinition, stages: TransformationStage[], clipStage: TransformationStage): Pick<ActiveModelClip, 'modelSlot' | 'modelRef'> {
  if (clipStage.params.modelRef) return { modelRef: clipStage.params.modelRef };
  if (clipStage.params.modelSlot) return { modelSlot: clipStage.params.modelSlot };
  const priorStages = stages
    .filter((s) => (s.type === 'model-swap' || s.type === 'model-visibility') && s.startTime <= clipStage.startTime)
    .sort((a, b) => a.startTime - b.startTime);
  const prior = priorStages[priorStages.length - 1];
  if (prior?.params.modelRef) return { modelRef: prior.params.modelRef };
  if (prior?.params.modelSlot) return { modelSlot: prior.params.modelSlot };
  return { modelSlot: fallbackClipSlot(def) };
}

export class TransformationTimelineRunner {
  time = 0;
  paused = false;
  private phase: RunnerPhase = 'playing';
  readonly duration: number;
  private stages: TransformationStage[];

  constructor(private def: TransformationDefinition, public mode: 'full' | 'interactive' | 'quick') {
    const allStages = def.stages ?? [];
    if (mode === 'quick') {
      const scale = def.totalDurationSec > 0 ? def.quickDurationSec / def.totalDurationSec : 1;
      this.duration = Math.max(0.1, def.quickDurationSec);
      this.stages = allStages
        .filter((s) => s.enabled && (s.essential || ESSENTIAL_TYPES.has(s.type)))
        .map((s) => ({ ...s, startTime: s.startTime * scale, duration: s.duration * scale }));
    } else {
      this.duration = Math.max(0.1, def.totalDurationSec || 1);
      this.stages = allStages.filter((s) => s.enabled);
    }
  }

  getPhase(): RunnerPhase { return this.phase; }

  tick(dt: number): void {
    if (this.paused || this.phase === 'done') return;
    if (this.phase === 'showcase') return; // waits for confirm()
    this.time += dt;
    if (this.time >= this.duration) {
      this.time = this.duration;
      // Interactive showcase holds (player confirms); otherwise the timeline is done.
      const wantsShowcase = !!this.def.interactionShowcase?.enabled && this.mode === 'interactive';
      this.phase = wantsShowcase ? 'showcase' : 'done';
    }
  }

  confirm(): void { if (this.phase === 'showcase') this.phase = 'done'; }
  pause(): void { this.paused = true; }
  resume(): void { this.paused = false; }
  seek(t: number): void { this.time = Math.max(0, Math.min(this.duration, t)); this.phase = this.time >= this.duration ? this.phase : 'playing'; }
  fastForward(): void { this.time = this.duration; this.phase = 'done'; }
  reset(): void { this.time = 0; this.paused = false; this.phase = 'playing'; }
  isDone(): boolean { return this.phase === 'done'; }

  // Resolve the full snapshot at the current time.
  getSnapshot(): RunnerSnapshot {
    const t = this.time;
    const parts = new Map<TransformationPartKey, PartState>();

    for (const part of this.def.parts ?? []) {
      let cur: PartState = { position: part.basePosition, rotation: part.baseRotation, scale: part.baseScale, visible: true };
      // Stages targeting THIS part, plus "global" part stages (no partKey + a visibility) that affect ALL
      // parts — used to hide every primitive part at the model reveal (final phase shows only the model).
      const ptStages = this.stages
        .filter((s) => s.type === 'part-transform' && s.startTime <= t && (s.params.partKey === part.key || (!s.params.partKey && s.params.visible != null)))
        .sort((a, b) => a.startTime - b.startTime);
      for (const st of ptStages) {
        const target: PartState = {
          position: st.params.toPosition ?? cur.position,
          rotation: st.params.toRotation ?? cur.rotation,
          scale: st.params.toScale ?? cur.scale,
          visible: st.params.visible ?? cur.visible,
        };
        if (t >= st.startTime + st.duration || st.duration <= 0) {
          cur = target; // fully applied
        } else {
          const k = ease(st.easing, (t - st.startTime) / st.duration);
          cur = { position: lerp3(cur.position, target.position, k), rotation: lerp3(cur.rotation, target.rotation, k), scale: lerp(cur.scale, target.scale, k), visible: target.visible };
          break;
        }
      }
      parts.set(part.key, cur);
    }

    // model visibility — start from the strategy base, apply visibility/swap stages in order. A model-swap
    // stage may target a slot (plane/robot/shared) OR an arbitrary modelRef (multi-model sequences — any
    // number of different models can be chained across the timeline).
    const modelVisible = baseModelVisible(this.def.formStrategy);
    let activeModelRef: string | null = null;
    let activeModelStageId: string | null = null;
    for (const st of this.stages.filter((s) => (s.type === 'model-visibility' || s.type === 'model-swap') && s.startTime <= t).sort((a, b) => a.startTime - b.startTime)) {
      const slot = st.params.modelSlot;
      if (st.type === 'model-swap' && st.params.modelRef) {
        modelVisible.plane = false; modelVisible.robot = false; modelVisible.shared = false;
        activeModelRef = st.params.modelRef;
        activeModelStageId = st.id;
      } else if (st.type === 'model-swap' && slot) {
        modelVisible.plane = false; modelVisible.robot = false; modelVisible.shared = false; modelVisible[slot] = true;
        activeModelRef = null;
        activeModelStageId = null;
      } else if (slot) {
        modelVisible[slot] = st.params.visible ?? true;
      }
    }

    // active animation clips — each stage can target a specific model slot/ref.
    let activeClip: string | null = null;
    const activeModelClips: ActiveModelClip[] = [];
    for (const st of this.stages.filter((s) => s.type === 'animation-clip' && s.startTime <= t).sort((a, b) => a.startTime - b.startTime)) {
      if ((t < st.startTime + st.duration || st.params.holdFinal) && st.params.clipName) {
        const target = resolveClipTarget(this.def, this.stages, st);
        const clip: ActiveModelClip = {
          stageId: st.id,
          ...target,
          clipName: st.params.clipName,
          clipSpeed: st.params.clipSpeed ?? 1,
          loop: st.params.loop ?? false,
          holdFinal: st.params.holdFinal ?? false,
        };
        activeModelClips.push(clip);
        activeClip = clip.clipName;
      }
    }

    // camera shot containing t (last match wins)
    let activeCameraShot: TransformationCameraShot | null = null;
    for (const sh of this.def.cameraShots ?? []) if (t >= sh.startTime && t < sh.startTime + sh.duration) activeCameraShot = sh;

    // active effect tracks
    const activeEffects = (this.def.effectTracks ?? []).filter((fx) => t >= fx.startTime && t < fx.startTime + fx.duration);

    // backdrop intensity — interpolate toward each backdrop-shift target (so a final shift to 0 FADES out)
    let backdropIntensity = 1;
    for (const st of this.stages.filter((s) => s.type === 'backdrop-shift' && s.startTime <= t).sort((a, b) => a.startTime - b.startTime)) {
      const target = st.params.backdropIntensity ?? st.params.intensity ?? backdropIntensity;
      const k = st.duration > 0 ? ease(st.easing, (t - st.startTime) / st.duration) : 1;
      backdropIntensity = lerp(backdropIntensity, target, k);
    }

    // slow exit descent + optional shrink — during the exit-stage the root sinks by params.intensity units
    // and scales toward params.toScale (a "shrink + sink" fly-out).
    let rootYOffset = 0;
    let exitScaleMul = 1;
    for (const st of this.stages.filter((s) => s.type === 'exit-stage' && s.startTime <= t)) {
      const k = st.duration > 0 ? ease('easeInOut', (t - st.startTime) / st.duration) : 1;
      const kk = Math.min(1, k);
      rootYOffset += (st.params.intensity ?? 6) * kk;
      if (st.params.toScale != null) exitScaleMul *= lerp(1, st.params.toScale, kk);
    }

    // per-slot animated motion — accumulate 'model-move' stages onto each slot (same lerp+ease as parts).
    const modelMotion: Record<ModelSlot, SlotMotion> = { plane: IDENTITY_MOTION(), robot: IDENTITY_MOTION(), shared: IDENTITY_MOTION() };
    for (const slot of ['plane', 'robot', 'shared'] as ModelSlot[]) {
      let cur = IDENTITY_MOTION();
      const moves = this.stages
        .filter((s) => s.type === 'model-move' && s.startTime <= t && (s.params.modelSlot ?? 'robot') === slot)
        .sort((a, b) => a.startTime - b.startTime);
      for (const st of moves) {
        const target: SlotMotion = {
          position: st.params.toPosition ?? cur.position,
          rotation: st.params.toRotation ?? cur.rotation,
          scale: st.params.toScale ?? cur.scale,
        };
        if (t >= st.startTime + st.duration || st.duration <= 0) {
          cur = target;
        } else {
          const k = ease(st.easing, (t - st.startTime) / st.duration);
          cur = { position: lerp3(cur.position, target.position, k), rotation: lerp3(cur.rotation, target.rotation, k), scale: lerp(cur.scale, target.scale, k) };
          break;
        }
      }
      modelMotion[slot] = cur;
    }

    const active = this.stages.find((s) => t >= s.startTime && t < s.startTime + s.duration);
    return {
      time: t,
      duration: this.duration,
      progress: this.duration > 0 ? t / this.duration : 1,
      phase: this.phase,
      activeStageLabel: active?.label ?? active?.type ?? (this.phase === 'showcase' ? 'showcase' : this.phase === 'done' ? 'complete' : '—'),
      parts,
      modelVisible,
      activeModelRef,
      activeModelStageId,
      activeClip,
      activeModelClips,
      activeCameraShot,
      activeEffects,
      backdropIntensity,
      rootYOffset,
      modelMotion,
      exitScaleMul,
    };
  }
}
