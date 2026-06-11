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
export type RunnerPhase = 'playing' | 'showcase' | 'done';
export interface RunnerSnapshot {
  time: number;
  duration: number;
  progress: number; // 0..1
  phase: RunnerPhase;
  activeStageLabel: string;
  parts: Map<TransformationPartKey, PartState>;
  modelVisible: Record<ModelSlot, boolean>;
  activeClip: string | null;
  activeCameraShot: TransformationCameraShot | null;
  activeEffects: TransformationEffectTrack[];
  backdropIntensity: number;
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

export class TransformationTimelineRunner {
  time = 0;
  paused = false;
  private phase: RunnerPhase = 'playing';
  readonly duration: number;
  private stages: TransformationStage[];

  constructor(private def: TransformationDefinition, public mode: 'full' | 'interactive' | 'quick') {
    if (mode === 'quick') {
      const scale = def.totalDurationSec > 0 ? def.quickDurationSec / def.totalDurationSec : 1;
      this.duration = Math.max(0.1, def.quickDurationSec);
      this.stages = def.stages
        .filter((s) => s.enabled && (s.essential || ESSENTIAL_TYPES.has(s.type)))
        .map((s) => ({ ...s, startTime: s.startTime * scale, duration: s.duration * scale }));
    } else {
      this.duration = Math.max(0.1, def.totalDurationSec);
      this.stages = def.stages.filter((s) => s.enabled);
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
      const wantsShowcase = this.def.interactionShowcase.enabled && this.mode === 'interactive';
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

    for (const part of this.def.parts) {
      let cur: PartState = { position: part.basePosition, rotation: part.baseRotation, scale: part.baseScale, visible: true };
      const ptStages = this.stages
        .filter((s) => s.type === 'part-transform' && s.params.partKey === part.key && s.startTime <= t)
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

    // model visibility — start from the strategy base, apply visibility/swap stages in order
    const modelVisible = baseModelVisible(this.def.formStrategy);
    for (const st of this.stages.filter((s) => (s.type === 'model-visibility' || s.type === 'model-swap') && s.startTime <= t).sort((a, b) => a.startTime - b.startTime)) {
      const slot = st.params.modelSlot;
      if (st.type === 'model-swap' && slot) { modelVisible.plane = false; modelVisible.robot = false; modelVisible.shared = false; modelVisible[slot] = true; }
      else if (slot) modelVisible[slot] = st.params.visible ?? true;
    }

    // active animation clip — latest clip stage started (holds final if holdFinal)
    let activeClip: string | null = null;
    for (const st of this.stages.filter((s) => s.type === 'animation-clip' && s.startTime <= t).sort((a, b) => a.startTime - b.startTime)) {
      if (t < st.startTime + st.duration || st.params.holdFinal) activeClip = st.params.clipName ?? activeClip;
    }

    // camera shot containing t (last match wins)
    let activeCameraShot: TransformationCameraShot | null = null;
    for (const sh of this.def.cameraShots) if (t >= sh.startTime && t < sh.startTime + sh.duration) activeCameraShot = sh;

    // active effect tracks
    const activeEffects = this.def.effectTracks.filter((fx) => t >= fx.startTime && t < fx.startTime + fx.duration);

    // backdrop intensity — latest backdrop-shift target, else 1 while playing
    let backdropIntensity = 1;
    for (const st of this.stages.filter((s) => s.type === 'backdrop-shift' && s.startTime <= t).sort((a, b) => a.startTime - b.startTime)) {
      backdropIntensity = st.params.backdropIntensity ?? st.params.intensity ?? backdropIntensity;
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
      activeClip,
      activeCameraShot,
      activeEffects,
      backdropIntensity,
    };
  }
}
