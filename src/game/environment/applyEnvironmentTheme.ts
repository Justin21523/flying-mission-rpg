import type { EnvironmentThemeDefinition } from '../../types/environmentThemeTypes';
import type { EnvironmentOverride } from '../../types/environmentOverride';
import { getEnvironmentTheme } from '../../stores/useEnvironmentEditorStore';
import { useEditorEnvironmentStore } from '../../stores/editorEnvironmentStore';
import { usePlayerStore } from '../../stores/playerStore';

// Batch J — apply an EnvironmentTheme to the live scene by writing it as a per-area EnvironmentOverride
// (editorEnvironmentStore), which EnvironmentBackdrop / DynamicAmbience / ground read every frame. Writing an
// override (rather than mutating theme/source data) keeps the change fully restorable + re-editable in Edit
// Mode (resetArea / the Ground Environment panel), honoring the no-hardcoded-state-objects rule.

// The destination/landing scene renders under this area id (DestinationScene). We fall back to it so the
// override lands on the same area the backdrop + ground resolve.
const DEFAULT_AREA_ID = 'aero_destination';

function currentAreaId(): string {
  return usePlayerStore.getState().currentAreaId ?? DEFAULT_AREA_ID;
}

// Translate a theme's sky/fog/lighting into an EnvironmentOverride patch. Only the fields a theme expresses
// are set; everything else falls back to the resolver defaults.
export function themeToOverride(theme: EnvironmentThemeDefinition): EnvironmentOverride {
  const patch: EnvironmentOverride = {};
  const skyColor = theme.sky.color;

  switch (theme.sky.preset) {
    case 'day':
      patch.backgroundMode = 'sky';
      patch.lockTimeOfDay = 'day';
      patch.sunElevationDeg = 26; patch.sunAzimuthDeg = 165;
      patch.turbidity = 3.5; patch.rayleigh = 2.2; patch.mieCoefficient = 0.004; patch.mieDirectionalG = 0.86;
      break;
    case 'sunset':
      patch.backgroundMode = 'sky';
      patch.lockTimeOfDay = 'evening';
      patch.sunElevationDeg = 6; patch.sunAzimuthDeg = 250;
      patch.turbidity = 6; patch.rayleigh = 3; patch.mieCoefficient = 0.006; patch.mieDirectionalG = 0.9;
      break;
    case 'night':
      patch.backgroundMode = 'gradient';
      patch.lockTimeOfDay = 'night';
      patch.gradientTop = '#0a1022'; patch.gradientBottom = skyColor ?? '#16203a';
      break;
    case 'storm':
      patch.backgroundMode = 'gradient';
      patch.lockTimeOfDay = 'evening';
      patch.gradientTop = '#39414f'; patch.gradientBottom = skyColor ?? '#525a66';
      break;
    case 'indoor':
      patch.backgroundMode = 'solid';
      patch.solidColor = skyColor ?? '#1c2230';
      patch.lockTimeOfDay = 'day';
      break;
    case 'custom':
    default:
      patch.backgroundMode = 'solid';
      patch.solidColor = skyColor ?? '#223047';
      break;
  }

  if (theme.fog) {
    patch.fogEnabled = theme.fog.enabled;
    if (theme.fog.enabled) {
      patch.fogColor = theme.fog.color;
      patch.fogNear = 20;
      // Denser fog → nearer far plane (clamped to a sane visible range).
      patch.fogFar = Math.max(60, 320 - Math.min(0.2, Math.max(0, theme.fog.density)) * 1100);
    }
  }

  if (theme.lighting) {
    if (typeof theme.lighting.ambientIntensity === 'number') patch.ambientIntensity = theme.lighting.ambientIntensity;
    if (typeof theme.lighting.directionalIntensity === 'number') patch.directionalIntensity = theme.lighting.directionalIntensity;
  }

  return patch;
}

// Play-mode ambience props derived from a theme — feeds WorldSkyAmbience (unlit gradient dome + lights + fog),
// the bloom-safe sky used on the landing ground. Mirrors themeToOverride so edit (ground/override) and play
// (sky/lights) read the same editable theme. undefined theme → caller falls back to the default ambience.
export interface ThemeAmbienceProps {
  top: string; bottom: string;
  fog?: string; fogNear?: number; fogFar?: number;
  ambient: number; sun: number;
}

export function themeToAmbience(theme: EnvironmentThemeDefinition): ThemeAmbienceProps {
  const c = theme.sky.color;
  let top = '#3f8fe0', bottom = '#cfe7ff';
  switch (theme.sky.preset) {
    case 'day': top = '#3f8fe0'; bottom = '#cfe7ff'; break;
    case 'sunset': top = c ?? '#e0823f'; bottom = '#ffd9b0'; break;
    case 'night': top = '#070d1c'; bottom = c ?? '#1a2740'; break;
    case 'storm': top = '#363d4a'; bottom = c ?? '#5a6470'; break;
    case 'indoor': top = c ?? '#2a3140'; bottom = '#1a2030'; break;
    case 'custom': default: top = c ?? '#3f8fe0'; bottom = c ?? '#cfe7ff'; break;
  }
  const ambient = theme.lighting?.ambientIntensity ?? 0.8;
  const sun = theme.lighting?.directionalIntensity ?? 1.15;
  const props: ThemeAmbienceProps = { top, bottom, ambient, sun };
  if (theme.fog?.enabled) {
    props.fog = theme.fog.color;
    props.fogNear = 30;
    props.fogFar = Math.max(80, 420 - Math.min(0.2, Math.max(0, theme.fog.density)) * 1300);
  }
  return props;
}

// Apply a theme (by id) to a given area (defaults to the live destination area). Merges over any existing
// override so manual ground/PBR edits on that area are preserved. Returns the area id written, or null.
export function applyEnvironmentTheme(themeId: string | undefined, areaId?: string): string | null {
  if (!themeId) return null;
  const theme = getEnvironmentTheme(themeId);
  if (!theme) return null;
  const area = areaId ?? currentAreaId();
  useEditorEnvironmentStore.getState().setOverride(area, themeToOverride(theme));
  return area;
}

// Apply the environment theme for a segment: its own theme, else the zone's default theme (Batch K), else
// no-op. Caller passes the zone default so this module stays free of a dependency on the zone director.
export function applySegmentEnvironment(seg: { environmentThemeId?: string } | undefined, zoneFallbackThemeId?: string): void {
  const themeId = seg?.environmentThemeId ?? zoneFallbackThemeId;
  if (themeId) applyEnvironmentTheme(themeId);
}
