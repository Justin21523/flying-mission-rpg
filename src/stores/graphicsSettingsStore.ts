import { create } from 'zustand';
import { DEFAULT_AUTO_ADAPT, DEFAULT_QUALITY, QUALITY_LEVELS, getPreset, type QualityLevel, type QualityPreset } from '../game/render/renderSettings';
import { QUALITY_TIERS, type QualityPreset as GameQualityPreset, type QualityTier } from '../types/game/quality';
import { DEFAULT_QUALITY_TIER } from '../data/configuration/qualityPresets';

// Phase 105 (perf) — persisted graphics-quality settings, separate from the game save (its own
// localStorage key, like audioStore). Drives the Canvas, shadows, character culling and world
// density via the active preset. `auto` lets a drei PerformanceMonitor nudge the effective level
// down under load (without overwriting the user's chosen ceiling) and back up when idle.

interface PersistedGraphics {
  quality: QualityLevel;   // renderer ceiling (dpr/shadow/character knobs) — kept in sync with `tier`
  auto: boolean;           // allow runtime auto-adapt below the ceiling
  showPerfHud: boolean;    // on-screen FPS / draw-call meter
  cullEnabled: boolean;    // distance-cull far objects in Play Mode (perf on big maps)
  cullRadius: number;      // render distance (world units) from the player; beyond it objects hide
  // Batch 12 — the richer quality preset selection (single source). `tier` picks a seed preset (or
  // 'custom'); `customPreset` is the override patch applied on top of the custom base.
  tier: QualityTier;
  customPreset: Partial<GameQualityPreset>;
}

interface GraphicsState extends PersistedGraphics {
  autoLevel: QualityLevel | null; // session-only override chosen by the auto-adapter (≤ quality)
  setQuality: (q: QualityLevel) => void;
  setAuto: (on: boolean) => void;
  togglePerfHud: () => void;
  setCullEnabled: (on: boolean) => void;
  setCullRadius: (r: number) => void;
  setAutoLevel: (q: QualityLevel | null) => void;
  /** Pick a richer quality tier; keeps the renderer `quality` in sync (one source). */
  setTier: (t: QualityTier) => void;
  /** Patch the custom preset (and switch to the 'custom' tier). */
  setCustomPreset: (patch: Partial<GameQualityPreset>) => void;
  /** The level actually in effect = min(user ceiling, auto override). */
  effectiveQuality: () => QualityLevel;
  /** The preset actually in effect. */
  preset: () => QualityPreset;
}

const STORAGE_KEY = 'lost-yokai-graphics-v1';

// Render distance: balanced for a town — far enough that nothing visibly pops in, near enough to cut load.
export const CULL_RADIUS_MIN = 30;
export const CULL_RADIUS_MAX = 200;
const DEFAULT_CULL_RADIUS = 75;

const DEFAULTS: PersistedGraphics = {
  quality: DEFAULT_QUALITY,
  auto: DEFAULT_AUTO_ADAPT,
  showPerfHud: false,
  cullEnabled: true,
  cullRadius: DEFAULT_CULL_RADIUS,
  tier: DEFAULT_QUALITY_TIER,
  customPreset: {},
};

const rank = (q: QualityLevel): number => QUALITY_LEVELS.indexOf(q);
const lower = (a: QualityLevel, b: QualityLevel): QualityLevel => (rank(a) <= rank(b) ? a : b);

// Each tier maps to a renderer QualityLevel so the Canvas/shadows stay single-sourced from renderSettings.
function rendererLevelForTier(tier: QualityTier, custom: Partial<GameQualityPreset>): QualityLevel {
  if (tier === 'low') return 'low';
  if (tier === 'medium') return 'medium';
  if (tier === 'high' || tier === 'ultra') return 'high';
  return custom.renderLevel ?? 'high'; // custom
}

function load(): PersistedGraphics {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const p = JSON.parse(raw) as Partial<PersistedGraphics>;
    return {
      quality: QUALITY_LEVELS.includes(p.quality as QualityLevel) ? (p.quality as QualityLevel) : DEFAULTS.quality,
      auto: typeof p.auto === 'boolean' ? p.auto : DEFAULTS.auto,
      showPerfHud: typeof p.showPerfHud === 'boolean' ? p.showPerfHud : DEFAULTS.showPerfHud,
      cullEnabled: typeof p.cullEnabled === 'boolean' ? p.cullEnabled : DEFAULTS.cullEnabled,
      cullRadius: typeof p.cullRadius === 'number' ? p.cullRadius : DEFAULTS.cullRadius,
      tier: QUALITY_TIERS.includes(p.tier as QualityTier) ? (p.tier as QualityTier) : DEFAULTS.tier,
      customPreset: p.customPreset && typeof p.customPreset === 'object' ? (p.customPreset as Partial<GameQualityPreset>) : {},
    };
  } catch {
    return DEFAULTS;
  }
}

function persist(state: GraphicsState): void {
  const data: PersistedGraphics = { quality: state.quality, auto: state.auto, showPerfHud: state.showPerfHud, cullEnabled: state.cullEnabled, cullRadius: state.cullRadius, tier: state.tier, customPreset: state.customPreset };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

export const useGraphicsSettingsStore = create<GraphicsState>((set, get) => ({
  ...load(),
  autoLevel: null,

  setQuality: (q) => set({ quality: q, autoLevel: null }),
  setAuto: (on) => set({ auto: on, autoLevel: on ? get().autoLevel : null }),
  setTier: (t) => set({ tier: t, quality: rendererLevelForTier(t, get().customPreset), autoLevel: null }),
  setCustomPreset: (patch) => set((s) => {
    const customPreset = { ...s.customPreset, ...patch };
    return { tier: 'custom', customPreset, quality: rendererLevelForTier('custom', customPreset), autoLevel: null };
  }),
  togglePerfHud: () => set((s) => ({ showPerfHud: !s.showPerfHud })),
  setCullEnabled: (on) => set({ cullEnabled: on }),
  setCullRadius: (r) => set({ cullRadius: Math.max(CULL_RADIUS_MIN, Math.min(CULL_RADIUS_MAX, r)) }),
  setAutoLevel: (q) => set({ autoLevel: q }),

  effectiveQuality: () => {
    const s = get();
    return s.auto && s.autoLevel ? lower(s.quality, s.autoLevel) : s.quality;
  },
  preset: () => getPreset(get().effectiveQuality()),
}));

// Persist whenever any setting changes (cheap; settings change infrequently).
useGraphicsSettingsStore.subscribe(persist);
