import type { EnvironmentThemeDefinition } from '../../types/environmentThemeTypes';
import { getEnvironmentTheme } from '../../stores/useEnvironmentEditorStore';
import { getAmbientVfxPresets } from './AmbientVfxDirector';
import { getEnvironmentHazards } from './EnvironmentHazardDirector';
import { getEnvironmentPropSets } from './EnvironmentPropDirector';

let activeTheme: EnvironmentThemeDefinition | undefined;

export function applyEnvironmentTheme(themeId: string): EnvironmentThemeDefinition {
  const theme = getEnvironmentTheme(themeId);
  if (!theme) throw new Error(`Environment theme not found: ${themeId}`);
  activeTheme = theme;
  getEnvironmentPropSets(theme.propSetIds);
  getEnvironmentHazards(theme.hazardPresetIds);
  getAmbientVfxPresets(theme.ambientVfxPresetIds);
  return theme;
}

export function getActiveEnvironmentTheme(): EnvironmentThemeDefinition | undefined {
  return activeTheme;
}

export function cleanupEnvironmentTheme(): void {
  activeTheme = undefined;
}

export function previewEnvironmentTheme(themeId: string): EnvironmentThemeDefinition {
  return applyEnvironmentTheme(themeId);
}
