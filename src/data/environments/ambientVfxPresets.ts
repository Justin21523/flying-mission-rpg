import type { AmbientVfxPresetDefinition } from '../../types/environmentThemeTypes';

export const SEED_AMBIENT_VFX_PRESETS: AmbientVfxPresetDefinition[] = [
  { id: 'ambient_harbor_gulls_light', name: 'Harbor Light Motion', vfxType: 'motile-specks', intensity: 0.25, color: '#bae6fd' },
  { id: 'ambient_downtown_signal_glow', name: 'Traffic Signal Glow', vfxType: 'signal-pulse', intensity: 0.45, color: '#fbbf24' },
  { id: 'ambient_factory_sparks', name: 'Factory Sparks', vfxType: 'spark-burst', intensity: 0.7, color: '#fb923c' },
  { id: 'ambient_tunnel_dust', name: 'Tunnel Dust', vfxType: 'dust-motes', intensity: 0.65, color: '#d6d3d1' },
  { id: 'ambient_skyport_rain_glare', name: 'Skyport Rain Glare', vfxType: 'rain-streaks', intensity: 0.8, color: '#93c5fd' },
  { id: 'ambient_blackout_neon_flicker', name: 'Blackout Neon Flicker', vfxType: 'neon-flicker', intensity: 0.75, color: '#a78bfa' },
  { id: 'ambient_storm_coast_splash', name: 'Storm Coast Splash', vfxType: 'water-splash', intensity: 0.8, color: '#67e8f9' },
  { id: 'ambient_metro_rail_sparks', name: 'Metro Rail Sparks', vfxType: 'rail-sparks', intensity: 0.7, color: '#facc15' },
  { id: 'ambient_aero_tower_gusts', name: 'Aero Tower Wind Gusts', vfxType: 'wind-gust', intensity: 0.75, color: '#bae6fd' },
  { id: 'ambient_finale_core_pulse', name: 'Finale Core Pulse', vfxType: 'core-pulse', intensity: 0.9, color: '#fb923c' },
];
