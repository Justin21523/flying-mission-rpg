// The 24 showcase abilities (3 per hero, Batch F.6) — these are refactored to the highest quality and must
// score >= 85; all other abilities must score >= 65.
export const SHOWCASE_ABILITY_IDS: ReadonlySet<string> = new Set([
  'jett_rescue_rush', 'jett_cyclone', 'jett_overdrive',
  'jerome_encore_spiral', 'jerome_spotlight_dive', 'jerome_grand_performance',
  'paul_shield_wall', 'paul_containment_cuff', 'paul_lockdown',
  'donnie_build_cover', 'donnie_magnetic_scrap', 'donnie_mega_constructor',
  'todd_burrow_dash', 'todd_seismic_quake', 'todd_earth_core_breaker',
  'flip_ricochet_ball', 'flip_stadium_storm', 'flip_hyper_stadium',
  'bello_animal_rush', 'bello_savanna_echo', 'bello_call_of_wild',
  'chase_weakpoint_scan', 'chase_decoy_jammer', 'chase_blackbox_assassination',
]);

export function isShowcaseAbility(skillId: string): boolean {
  return SHOWCASE_ABILITY_IDS.has(skillId);
}
