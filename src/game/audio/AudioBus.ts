import type { AudioBusId } from '../../types/audioTypes';

// Batch 12 — one mixer bus. Holds a 0..1 volume + a mute flag; the AudioManager multiplies master × bus
// × cue. `fadeTo` tweens the volume over time (used for pause/resume and weather ambience) via a single
// self-cancelling interval so there are no leaked timers.

export class AudioBus {
  readonly id: AudioBusId;
  private vol: number;
  private mutedFlag = false;
  private fadeTimer: ReturnType<typeof setInterval> | null = null;

  constructor(id: AudioBusId, volume = 1) {
    this.id = id;
    this.vol = clamp01(volume);
  }

  /** Effective volume contribution (0 when muted). */
  get volume(): number {
    return this.mutedFlag ? 0 : this.vol;
  }

  get rawVolume(): number {
    return this.vol;
  }

  get muted(): boolean {
    return this.mutedFlag;
  }

  setVolume(v: number): void {
    this.cancelFade();
    this.vol = clamp01(v);
  }

  setMuted(m: boolean): void {
    this.mutedFlag = m;
  }

  /** Tween rawVolume to `target` over `ms`. Cancels any in-flight fade. */
  fadeTo(target: number, ms: number, onTick?: (v: number) => void): void {
    this.cancelFade();
    const to = clamp01(target);
    if (ms <= 0 || typeof setInterval === 'undefined') {
      this.vol = to;
      onTick?.(this.volume);
      return;
    }
    const from = this.vol;
    const stepMs = 30;
    const steps = Math.max(1, Math.round(ms / stepMs));
    let i = 0;
    this.fadeTimer = setInterval(() => {
      i += 1;
      this.vol = from + (to - from) * (i / steps);
      onTick?.(this.volume);
      if (i >= steps) {
        this.vol = to;
        this.cancelFade();
      }
    }, stepMs);
  }

  cancelFade(): void {
    if (this.fadeTimer !== null) {
      clearInterval(this.fadeTimer);
      this.fadeTimer = null;
    }
  }

  dispose(): void {
    this.cancelFade();
  }
}

function clamp01(v: number): number {
  if (Number.isNaN(v)) return 0;
  return Math.min(1, Math.max(0, v));
}
