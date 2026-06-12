import { AudioBus } from './AudioBus';
import { playSfx, type SfxName } from './sfx';
import { useAudioStore } from '../../stores/audioStore';
import { AUDIO_BUS_IDS, NON_ESSENTIAL_BUSES, type AudioBusId, type AudioCueDef, type AudioPreset } from '../../types/audioTypes';

// Batch 12 — the single audio mixer. Plays cues by id through named buses (master × bus × cue gain),
// reading per-bus volumes from `audioStore`. Real audio files load lazily through Howler ONLY when a cue
// has an `assetId`; otherwise (the ship-default, since the project carries no audio assets) it routes to
// the WebAudio synth fallback. Missing/unloadable assets never throw — they degrade to the fallback.

export interface AudioLoopHandle {
  setVolume(v: number): void;
  setRate(r: number): void;
  stop(): void;
}

const SAME_CUE_DEBOUNCE_MS = 40;

// Minimal Howl surface we use (kept local so the type doesn't leak Howler into the import graph).
interface HowlLike {
  play(): number;
  stop(): void;
  volume(v: number, id?: number): void;
  rate(r: number, id?: number): void;
  playing(): boolean;
  unload(): void;
}

class AudioManager {
  private buses = new Map<AudioBusId, AudioBus>();
  private cues = new Map<string, AudioCueDef>();
  private howlCache = new Map<string, HowlLike>();
  private activeLoops = new Set<AudioLoopHandle>();
  private nonEssentialPaused = false;
  private unsub: (() => void) | null = null;
  // Same-cue debounce: the global UI delegate + an explicit playUiSound on the same click collapse to one,
  // and rapid repeats (e.g. many pickups) don't machine-gun.
  private lastPlay = new Map<string, number>();

  constructor() {
    for (const id of AUDIO_BUS_IDS) this.buses.set(id, new AudioBus(id, 1));
    this.syncFromStore();
    // Keep bus volumes in lock-step with the settings store (cheap; settings change rarely).
    this.unsub = useAudioStore.subscribe(() => this.syncFromStore());
  }

  /** Map the 5 user-facing volumes onto the 8 buses + global mute. */
  syncFromStore(): void {
    const s = useAudioStore.getState();
    this.setBusRaw('master', s.masterVolume);
    this.setBusRaw('music', s.musicVolume);
    this.setBusRaw('voice', s.voiceVolume);
    this.setBusRaw('ambient', s.ambientVolume);
    // sfx-family buses share the SFX slider.
    this.setBusRaw('sfx', s.sfxVolume);
    this.setBusRaw('ui', s.sfxVolume);
    this.setBusRaw('flight', s.sfxVolume);
    this.setBusRaw('transformation', s.sfxVolume);
    this.buses.get('master')?.setMuted(s.muteAll);
  }

  private setBusRaw(id: AudioBusId, v: number): void {
    this.buses.get(id)?.setVolume(v);
  }

  registerPreset(preset: AudioPreset): void {
    for (const cue of preset.cues) this.cues.set(cue.id, cue);
  }

  registerCue(cue: AudioCueDef): void {
    this.cues.set(cue.id, cue);
  }

  getBusVolume(id: AudioBusId): number {
    return this.buses.get(id)?.rawVolume ?? 0;
  }

  setBusVolume(id: AudioBusId, v: number): void {
    this.buses.get(id)?.setVolume(v);
  }

  muteAll(muted: boolean): void {
    this.buses.get('master')?.setMuted(muted);
  }

  isMuted(): boolean {
    return this.buses.get('master')?.muted ?? false;
  }

  /** Effective gain for a cue = master × bus × cue. 0 when muted. */
  private gainFor(cue: AudioCueDef): number {
    const master = this.buses.get('master')?.volume ?? 0;
    const bus = this.buses.get(cue.bus)?.volume ?? 0;
    return master * bus * clamp01(cue.volume);
  }

  /** Play a one-shot cue. Returns true if anything was triggered. Never throws. */
  play(cueId: string): boolean {
    const cue = this.cues.get(cueId);
    if (!cue) return false;
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (now - (this.lastPlay.get(cueId) ?? -Infinity) < SAME_CUE_DEBOUNCE_MS) return false;
    this.lastPlay.set(cueId, now);
    const gain = this.gainFor(cue);
    if (gain <= 0) return false;
    if (cue.assetId) {
      void this.playFile(cue, gain, this.rateFor(cue), false);
      return true;
    }
    return this.playFallback(cue);
  }

  /** Start a looping cue (e.g. engine). Returns a handle to drive volume/rate, or null. */
  playLoop(cueId: string): AudioLoopHandle | null {
    const cue = this.cues.get(cueId);
    if (!cue) return null;
    if (cue.assetId) {
      // Real file: a handle that buffers desired vol/rate until the Howl resolves.
      const handle = this.makeBufferedLoopHandle(cue);
      this.activeLoops.add(handle);
      return handle;
    }
    // No asset: a virtual handle so controllers can run without audio files.
    const handle: AudioLoopHandle = {
      setVolume: () => {},
      setRate: () => {},
      stop: () => { this.activeLoops.delete(handle); },
    };
    this.activeLoops.add(handle);
    return handle;
  }

  private rateFor(cue: AudioCueDef): number {
    if (!cue.pitchRange) return 1;
    const [lo, hi] = cue.pitchRange;
    return lo + Math.random() * (hi - lo);
  }

  private playFallback(cue: AudioCueDef): boolean {
    if (!cue.fallbackSfx) return false;
    playSfx(cue.fallbackSfx satisfies SfxName);
    return true;
  }

  stopBus(id: AudioBusId): void {
    for (const handle of [...this.activeLoops]) {
      // Without per-handle bus tagging we stop all loops on a bus-stop request (rare; used on scene exit).
      void id;
      handle.stop();
    }
  }

  /** Pause non-essential loops (music/ambient/flight/transformation) — used when the scene is hidden. */
  pauseNonEssential(): void {
    if (this.nonEssentialPaused) return;
    this.nonEssentialPaused = true;
    for (const id of NON_ESSENTIAL_BUSES) this.buses.get(id)?.setMuted(true);
  }

  resumeNonEssential(): void {
    if (!this.nonEssentialPaused) return;
    this.nonEssentialPaused = false;
    for (const id of NON_ESSENTIAL_BUSES) this.buses.get(id)?.setMuted(false);
  }

  /** Active loop count (for the performance debug panel). */
  playingCount(): number {
    return this.activeLoops.size;
  }

  /** Clear the same-cue debounce history (used by tests). */
  clearPlayHistory(): void {
    this.lastPlay.clear();
  }

  stopAll(): void {
    for (const handle of [...this.activeLoops]) handle.stop();
    this.activeLoops.clear();
  }

  dispose(): void {
    this.stopAll();
    for (const howl of this.howlCache.values()) howl.unload();
    this.howlCache.clear();
    for (const bus of this.buses.values()) bus.dispose();
    this.unsub?.();
    this.unsub = null;
  }

  // ── Lazy Howler path (only reached when a cue has a real assetId) ──────────────────────────────

  private async ensureHowl(assetId: string): Promise<HowlLike | null> {
    const cached = this.howlCache.get(assetId);
    if (cached) return cached;
    try {
      const mod = (await import('howler')) as unknown as { Howl: new (o: Record<string, unknown>) => HowlLike };
      const howl = new mod.Howl({ src: [assetId], preload: true });
      this.howlCache.set(assetId, howl);
      return howl;
    } catch {
      return null; // missing/unloadable asset → silent (caller already accounted for fallback at registration)
    }
  }

  private async playFile(cue: AudioCueDef, gain: number, rate: number, loop: boolean): Promise<void> {
    const howl = cue.assetId ? await this.ensureHowl(cue.assetId) : null;
    if (!howl) {
      if (!loop) this.playFallback(cue);
      return;
    }
    const id = howl.play();
    howl.volume(gain, id);
    howl.rate(rate, id);
    if (!loop) { /* one-shot manages its own end via Howler */ }
  }

  private makeBufferedLoopHandle(cue: AudioCueDef): AudioLoopHandle {
    let vol = this.gainFor(cue);
    let rate = 1;
    let howl: HowlLike | null = null;
    let soundId: number | null = null;
    let stopped = false;
    void this.ensureHowl(cue.assetId ?? '').then((h) => {
      if (stopped || !h) return;
      howl = h;
      soundId = h.play();
      h.volume(vol, soundId);
      h.rate(rate, soundId);
    });
    const handle: AudioLoopHandle = {
      setVolume: (v) => { vol = clamp01(v) * this.gainFor(cue); if (howl && soundId !== null) howl.volume(vol, soundId); },
      setRate: (r) => { rate = r; if (howl && soundId !== null) howl.rate(r, soundId); },
      stop: () => { stopped = true; if (howl) howl.stop(); this.activeLoops.delete(handle); },
    };
    return handle;
  }
}

function clamp01(v: number): number {
  if (Number.isNaN(v)) return 0;
  return Math.min(1, Math.max(0, v));
}

// Lazily-created singleton so importing this module is side-effect-free for tests that don't touch audio.
let instance: AudioManager | null = null;
export function getAudioManager(): AudioManager {
  if (!instance) instance = new AudioManager();
  return instance;
}
export type { AudioManager };
