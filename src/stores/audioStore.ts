import { create } from 'zustand';

// Kit — minimal ambience settings store. The full game had real audio playback; the kit keeps only the
// two flags the particle/weather layers read (so WeatherParticles / BiomeParticles / WorldClockHUD work
// unchanged). `particlesEnabled` + `particleDensity` are persisted; `audioEnabled` is a session flag.
export type ParticleDensity = 'low' | 'medium' | 'high';

interface PersistedSettings {
  particlesEnabled: boolean;
  particleDensity: ParticleDensity;
  sfxEnabled: boolean;   // POLI WebAudio synth placeholders (transform/ability/rescue/…)
  sfxVolume: number;     // 0..1
  // Accessibility
  textScale: number;     // 0.85..1.5 — scales all rem-based UI text
  highContrast: boolean; // stronger text/panel contrast
  reduceMotion: boolean; // cut particle density / motion
}

interface AudioState extends PersistedSettings {
  audioEnabled: boolean; // session-only placeholder (kit has no audio engine yet)
  toggleAudio: () => void;
  toggleParticles: () => void;
  setParticleDensity: (density: ParticleDensity) => void;
  toggleSfx: () => void;
  setSfxVolume: (v: number) => void;
  setTextScale: (v: number) => void;
  toggleHighContrast: () => void;
  toggleReduceMotion: () => void;
  importState: (data: Partial<PersistedSettings>) => void;
  reset: () => void;
}

const STORAGE_KEY = 'r3f-rpg-builder-settings-v1';
const DENSITIES: ParticleDensity[] = ['low', 'medium', 'high'];
const DEFAULTS: PersistedSettings = { particlesEnabled: true, particleDensity: 'medium', sfxEnabled: true, sfxVolume: 0.4, textScale: 1, highContrast: false, reduceMotion: false };

function load(): PersistedSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const p = JSON.parse(raw) as Partial<PersistedSettings>;
    return {
      particlesEnabled: typeof p.particlesEnabled === 'boolean' ? p.particlesEnabled : DEFAULTS.particlesEnabled,
      particleDensity: DENSITIES.includes(p.particleDensity as ParticleDensity)
        ? (p.particleDensity as ParticleDensity)
        : DEFAULTS.particleDensity,
      sfxEnabled: typeof p.sfxEnabled === 'boolean' ? p.sfxEnabled : DEFAULTS.sfxEnabled,
      sfxVolume: typeof p.sfxVolume === 'number' ? Math.min(1, Math.max(0, p.sfxVolume)) : DEFAULTS.sfxVolume,
      textScale: typeof p.textScale === 'number' ? Math.min(1.5, Math.max(0.85, p.textScale)) : DEFAULTS.textScale,
      highContrast: typeof p.highContrast === 'boolean' ? p.highContrast : DEFAULTS.highContrast,
      reduceMotion: typeof p.reduceMotion === 'boolean' ? p.reduceMotion : DEFAULTS.reduceMotion,
    };
  } catch {
    return DEFAULTS;
  }
}

function persist(s: PersistedSettings): void {
  try {
    const out: PersistedSettings = {
      particlesEnabled: s.particlesEnabled,
      particleDensity: s.particleDensity,
      sfxEnabled: s.sfxEnabled,
      sfxVolume: s.sfxVolume,
      textScale: s.textScale,
      highContrast: s.highContrast,
      reduceMotion: s.reduceMotion,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(out));
  } catch {
    /* ignore quota / private-mode errors */
  }
}

export const useAudioStore = create<AudioState>((set, get) => ({
  ...load(),
  audioEnabled: false,
  toggleAudio: () => set({ audioEnabled: !get().audioEnabled }),
  toggleParticles: () => {
    const particlesEnabled = !get().particlesEnabled;
    set({ particlesEnabled });
    persist({ ...get(), particlesEnabled });
  },
  setParticleDensity: (particleDensity) => {
    set({ particleDensity });
    persist({ ...get(), particleDensity });
  },
  toggleSfx: () => {
    const sfxEnabled = !get().sfxEnabled;
    set({ sfxEnabled });
    persist({ ...get(), sfxEnabled });
  },
  setSfxVolume: (sfxVolume) => {
    const v = Math.min(1, Math.max(0, sfxVolume));
    set({ sfxVolume: v });
    persist({ ...get(), sfxVolume: v });
  },
  setTextScale: (v) => {
    const t = Math.min(1.5, Math.max(0.85, v));
    set({ textScale: t });
    persist({ ...get(), textScale: t });
  },
  toggleHighContrast: () => {
    const highContrast = !get().highContrast;
    set({ highContrast });
    persist({ ...get(), highContrast });
  },
  toggleReduceMotion: () => {
    const reduceMotion = !get().reduceMotion;
    set({ reduceMotion });
    persist({ ...get(), reduceMotion });
  },
  importState: (data) => {
    const merged = { ...get(), ...data } as AudioState;
    set({
      particlesEnabled: merged.particlesEnabled,
      particleDensity: DENSITIES.includes(merged.particleDensity) ? merged.particleDensity : 'medium',
      sfxEnabled: merged.sfxEnabled,
      sfxVolume: Math.min(1, Math.max(0, merged.sfxVolume)),
      textScale: Math.min(1.5, Math.max(0.85, merged.textScale)),
      highContrast: merged.highContrast,
      reduceMotion: merged.reduceMotion,
    });
    persist(get());
  },
  reset: () => { set({ ...DEFAULTS }); persist(DEFAULTS); },
}));
