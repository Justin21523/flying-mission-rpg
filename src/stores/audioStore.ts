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
  // Batch 12 — per-bus volumes for the AudioManager (master scales all). All 0..1.
  masterVolume: number;
  musicVolume: number;
  voiceVolume: number;
  ambientVolume: number;
  muteAll: boolean;      // hard mute every bus
  reduceLoud: boolean;   // accessibility: damp loud / sudden effects
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
  setMasterVolume: (v: number) => void;
  setMusicVolume: (v: number) => void;
  setVoiceVolume: (v: number) => void;
  setAmbientVolume: (v: number) => void;
  toggleMuteAll: () => void;
  toggleReduceLoud: () => void;
  setTextScale: (v: number) => void;
  toggleHighContrast: () => void;
  toggleReduceMotion: () => void;
  importState: (data: Partial<PersistedSettings>) => void;
  reset: () => void;
}

const STORAGE_KEY = 'r3f-rpg-builder-settings-v1';
const DENSITIES: ParticleDensity[] = ['low', 'medium', 'high'];
const DEFAULTS: PersistedSettings = { particlesEnabled: true, particleDensity: 'medium', sfxEnabled: true, sfxVolume: 0.4, masterVolume: 0.8, musicVolume: 0.6, voiceVolume: 0.9, ambientVolume: 0.6, muteAll: false, reduceLoud: false, textScale: 1, highContrast: false, reduceMotion: false };
const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

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
      masterVolume: typeof p.masterVolume === 'number' ? clamp01(p.masterVolume) : DEFAULTS.masterVolume,
      musicVolume: typeof p.musicVolume === 'number' ? clamp01(p.musicVolume) : DEFAULTS.musicVolume,
      voiceVolume: typeof p.voiceVolume === 'number' ? clamp01(p.voiceVolume) : DEFAULTS.voiceVolume,
      ambientVolume: typeof p.ambientVolume === 'number' ? clamp01(p.ambientVolume) : DEFAULTS.ambientVolume,
      muteAll: typeof p.muteAll === 'boolean' ? p.muteAll : DEFAULTS.muteAll,
      reduceLoud: typeof p.reduceLoud === 'boolean' ? p.reduceLoud : DEFAULTS.reduceLoud,
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
      masterVolume: s.masterVolume,
      musicVolume: s.musicVolume,
      voiceVolume: s.voiceVolume,
      ambientVolume: s.ambientVolume,
      muteAll: s.muteAll,
      reduceLoud: s.reduceLoud,
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
  setMasterVolume: (v) => { const masterVolume = clamp01(v); set({ masterVolume }); persist({ ...get(), masterVolume }); },
  setMusicVolume: (v) => { const musicVolume = clamp01(v); set({ musicVolume }); persist({ ...get(), musicVolume }); },
  setVoiceVolume: (v) => { const voiceVolume = clamp01(v); set({ voiceVolume }); persist({ ...get(), voiceVolume }); },
  setAmbientVolume: (v) => { const ambientVolume = clamp01(v); set({ ambientVolume }); persist({ ...get(), ambientVolume }); },
  toggleMuteAll: () => { const muteAll = !get().muteAll; set({ muteAll }); persist({ ...get(), muteAll }); },
  toggleReduceLoud: () => { const reduceLoud = !get().reduceLoud; set({ reduceLoud }); persist({ ...get(), reduceLoud }); },
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
      masterVolume: clamp01(merged.masterVolume),
      musicVolume: clamp01(merged.musicVolume),
      voiceVolume: clamp01(merged.voiceVolume),
      ambientVolume: clamp01(merged.ambientVolume),
      muteAll: merged.muteAll,
      reduceLoud: merged.reduceLoud,
      textScale: Math.min(1.5, Math.max(0.85, merged.textScale)),
      highContrast: merged.highContrast,
      reduceMotion: merged.reduceMotion,
    });
    persist(get());
  },
  reset: () => { set({ ...DEFAULTS }); persist(DEFAULTS); },
}));
