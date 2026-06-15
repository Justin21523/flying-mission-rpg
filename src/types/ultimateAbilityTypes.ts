// Cinematic VFX — ultimate ability extras (Batch F.5). Ultimates are CinematicAbilityDefinitions with
// abilityCategory 'ultimate'; this adds the optional warning-banner + ultimate-resource metadata the HUD/debug
// read. Kept minimal (no full cinematic cutscene this batch).

export interface UltimateAbilityMeta {
  abilityId: string;
  warningBannerText?: string;
  chargeResource?: 'energy' | 'ultimate-meter' | 'cooldown-only';
  requiredCharge?: number;       // ultimate-meter / energy threshold
  cinematicCameraEnabled?: boolean;
}
