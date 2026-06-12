import type { PathDefinition } from '../../types/path';

export function visiblePathDefinitions(paths: readonly PathDefinition[], areaId: string, pathId?: string): PathDefinition[] {
  if (pathId) return paths.filter((path) => path.id === pathId);
  return paths.filter((path) => (path.areaId ?? 'rescue_hq') === areaId);
}
