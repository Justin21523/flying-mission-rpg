import type { EnvironmentTheme } from '../../types/environment';
import { getAllAreas } from '../../data/areas';
import { getWorldAreas } from '../../stores/editorWorldStore';
import { getEnvironmentTheme } from './environmentTheme';

// Kit — resolve an area's biome theme. An explicit editable `biome` (🗺 World tab) wins, then the area's
// `ambientTheme`; otherwise the biome is inferred from the areaId by keyword (environmentTheme.inferBiome).
export function areaBiomeOverride(areaId: string): string | undefined {
  const wa = getWorldAreas().find((a) => a.id === areaId);
  if (wa?.biome) return wa.biome;
  return getAllAreas().find((a) => a.id === areaId)?.ambientTheme;
}

export function resolveAreaTheme(areaId: string): EnvironmentTheme {
  return getEnvironmentTheme(areaId, areaBiomeOverride(areaId));
}
