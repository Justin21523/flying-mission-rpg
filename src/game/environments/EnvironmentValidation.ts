import type { EnvironmentThemeDefinition } from '../../types/environmentThemeTypes';
import type { ValidationResult } from '../../types/stageProgressionTypes';
import { useAmbientVfxPresetStore, useEnvironmentHazardPresetStore, useEnvironmentPropSetStore } from '../../stores/useEnvironmentEditorStore';

export function validateEnvironmentTheme(theme: EnvironmentThemeDefinition): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (theme.lighting.ambientIntensity < 0 || theme.lighting.directionalIntensity < 0) errors.push(`${theme.id}: lighting intensity must be non-negative.`);
  if (theme.fog && (theme.fog.density < 0 || theme.fog.density > 1)) errors.push(`${theme.id}: fog density must be 0..1.`);
  if (theme.weather && (theme.weather.intensity < 0 || theme.weather.intensity > 1)) errors.push(`${theme.id}: weather intensity must be 0..1.`);
  const propIds = new Set(useEnvironmentPropSetStore.getState().items.map((p) => p.id));
  const hazardIds = new Set(useEnvironmentHazardPresetStore.getState().items.map((h) => h.id));
  const ambientIds = new Set(useAmbientVfxPresetStore.getState().items.map((a) => a.id));
  for (const id of theme.propSetIds) if (!propIds.has(id)) errors.push(`${theme.id}: missing prop set ${id}.`);
  for (const id of theme.hazardPresetIds) if (!hazardIds.has(id)) errors.push(`${theme.id}: missing hazard preset ${id}.`);
  for (const id of theme.ambientVfxPresetIds ?? []) if (!ambientIds.has(id)) errors.push(`${theme.id}: missing ambient vfx ${id}.`);
  return { ok: errors.length === 0, errors, warnings };
}
