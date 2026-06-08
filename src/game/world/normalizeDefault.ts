// POLI — per-category default normalisation target (largest dimension, world units), inferred from an
// assetId's folder. Used by NormalizedGlbModel + the 🗺 World layout editor. Kept in its own module so the
// component file stays component-only (react-refresh).
const FOLDER_TARGET: Record<string, number> = {
  buildings: 10,
  scenes: 12,
  interiors: 6,
  outerior_decors: 5,
  outerior_decor: 5,
  decor: 2,
  props: 2,
  npcs: 3,
  characters: 2.5,
  ground: 20,
};

export function defaultNormalizeFor(assetId: string): number {
  const folder = assetId.includes('/') ? assetId.split('/')[0] : 'models';
  return FOLDER_TARGET[folder] ?? 4;
}
