import { getAudioManager, type AudioLoopHandle } from './AudioManager';

// Batch 12 — drives flight audio from runtime flight state. Holds the engine + wind loops and maps
// speed/throttle/boost onto their volume & playback rate (pitch rises with speed). Boost and cloud-break
// are one-shots fired on edges. The caller ticks `update` at a throttled rate (NOT every frame).

export interface FlightAudioState {
  speedNorm: number; // 0..1
  throttle: number;  // 0..1
  boost: boolean;
}

export class FlightAudioController {
  private engine: AudioLoopHandle | null = null;
  private wind: AudioLoopHandle | null = null;
  private boostWasOn = false;
  private started = false;

  start(): void {
    if (this.started) return;
    this.started = true;
    const mgr = getAudioManager();
    this.engine = mgr.playLoop('flight.engine');
    this.wind = mgr.playLoop('flight.wind');
  }

  update(s: FlightAudioState): void {
    if (!this.started) return;
    const speed = clamp01(s.speedNorm);
    // Engine: rate rises with speed (0.8→1.7), volume tracks throttle/speed.
    this.engine?.setRate(0.8 + speed * 0.9);
    this.engine?.setVolume(0.3 + 0.7 * Math.max(speed, clamp01(s.throttle)));
    // Wind: only audible at pace.
    this.wind?.setRate(0.9 + speed * 0.6);
    this.wind?.setVolume(speed * 0.7);
    // Boost edge → one-shot.
    if (s.boost && !this.boostWasOn) getAudioManager().play('flight.boost');
    this.boostWasOn = s.boost;
  }

  cloudBreak(): void {
    if (this.started) getAudioManager().play('flight.cloudBreak');
  }

  crosswind(): void {
    if (this.started) getAudioManager().play('flight.crosswind');
  }

  stop(): void {
    this.engine?.stop();
    this.wind?.stop();
    this.engine = null;
    this.wind = null;
    this.boostWasOn = false;
    this.started = false;
  }
}

function clamp01(v: number): number {
  if (Number.isNaN(v)) return 0;
  return Math.min(1, Math.max(0, v));
}
