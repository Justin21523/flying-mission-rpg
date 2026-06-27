import type { EnvironmentHazardPresetDefinition } from '../../types/environmentThemeTypes';

export const SEED_ENVIRONMENT_HAZARD_PRESETS: EnvironmentHazardPresetDefinition[] = [
  { id: 'hazard_harbor_cracked_road', name: 'Cracked Harbor Road', hazardType: 'blocked-path', intensity: 0.35, damagePerSecond: 0, editorMeta: { notes: 'Tutorial obstacle pressure without ambient damage.' } },
  { id: 'hazard_downtown_energy_barrier', name: 'Traffic Energy Barrier', hazardType: 'energy-barrier', intensity: 0.55, damagePerSecond: 2, editorMeta: { notes: 'Shield and defense tutorial pressure.' } },
  { id: 'hazard_factory_sparks', name: 'Factory Spark Fields', hazardType: 'damage-field', intensity: 0.7, damagePerSecond: 5, editorMeta: { notes: 'Mechanical failure and repair priority hazard.' } },
  { id: 'hazard_tunnel_dust_low_visibility', name: 'Tunnel Dust Veil', hazardType: 'visibility', intensity: 0.65, damagePerSecond: 0, editorMeta: { notes: 'Low visibility with sniper risk.' } },
  { id: 'hazard_skyport_storm_wind', name: 'Skyport Storm Wind', hazardType: 'push-field', intensity: 0.8, damagePerSecond: 3, editorMeta: { notes: 'Finale storm and bridge pressure.' } },
  { id: 'hazard_blackout_electric_dark', name: 'Blackout Electric Dark', hazardType: 'electric', intensity: 0.62, damagePerSecond: 4, editorMeta: { notes: 'Electric pockets readable through scan and neon markers.' } },
  { id: 'hazard_storm_coast_flood', name: 'Storm Coast Flood Current', hazardType: 'push-field', intensity: 0.72, damagePerSecond: 2, editorMeta: { notes: 'Water current placeholder and slippery lane pressure.' } },
  { id: 'hazard_metro_rail_electric', name: 'Metro Rail Electric', hazardType: 'electric', intensity: 0.68, damagePerSecond: 5, editorMeta: { notes: 'Rail crossing risk for shield or scan counterplay.' } },
  { id: 'hazard_aero_tower_wind', name: 'Aero Tower Wind Gust', hazardType: 'wind', intensity: 0.78, damagePerSecond: 1, editorMeta: { notes: 'High place wind push placeholder.' } },
  { id: 'hazard_finale_core_overload', name: 'Finale Core Overload', hazardType: 'damage-field', intensity: 0.9, damagePerSecond: 6, editorMeta: { notes: 'Campaign finale mixed hazard pressure.' } },
];
