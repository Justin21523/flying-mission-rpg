import { SEED_ENVIRONMENT_THEMES } from './environmentThemes';

export const EXPANDED_ENVIRONMENT_THEME_IDS = [
  'env_night_city_blackout',
  'env_storm_coast_flood',
  'env_metro_labyrinth',
  'env_aero_tower_wind',
  'env_rescue_vanguard_finale',
] as const;

export const EXPANDED_ENVIRONMENT_THEMES = SEED_ENVIRONMENT_THEMES.filter((theme) =>
  (EXPANDED_ENVIRONMENT_THEME_IDS as readonly string[]).includes(theme.id),
);
