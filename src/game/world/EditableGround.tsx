import { useEffect } from 'react';
import { resolveAreaEnvironment } from '../environment/resolveAreaEnvironment';
import { resolveAreaTheme } from '../environment/areaBiome';
import { usePlayerStore } from '../../stores/playerStore';
import { ZoneFloor } from './ZoneFloor';
import { HeightfieldGround } from './HeightfieldGround';
import { FlatPbrGround, PbrGroundPlane } from './FlatPbrGround';
import { PbrPatchLayer } from './PbrPatchLayer';

// Reusable POLI editable ground for OUR game scenes — the same ground/terrain/PBR stack the kit's
// AreaRenderer uses, extracted so the 🌤 Environment, 🗺 World, terrain-sculpt brush and PBR-material tools
// (which all target playerStore.currentAreaId) work on the base hangar floor and the destination/landing
// ground. The scene sets currentAreaId to this areaId so the editors edit THIS ground. Pure visual (no
// physics) — callers keep their own colliders. Heightfield vs flat PBR is chosen per-area in the editor.
export const EditableGround = ({ areaId, flatColor }: { areaId: string; flatColor?: string }) => {
  // Bind the edit tools to THIS ground while the scene is mounted (restore the prior area on exit).
  useEffect(() => {
    const prev = usePlayerStore.getState().currentAreaId;
    usePlayerStore.getState().setCurrentAreaId(areaId);
    return () => usePlayerStore.getState().setCurrentAreaId(prev);
  }, [areaId]);

  const env = resolveAreaEnvironment(areaId);
  const theme = resolveAreaTheme(areaId);
  const heightfield = env.groundType === 'heightfield';
  return (
    <>
      <ZoneFloor color={flatColor ?? theme.groundColor} y={heightfield ? -0.6 : 0} />
      <HeightfieldGround areaId={areaId} />
      {heightfield && (env.pbrGround.albedoUrl || env.pbrGround.gltfMaterialUrl) && <PbrGroundPlane areaId={areaId} y={-0.5} />}
      <FlatPbrGround areaId={areaId} />
      <PbrPatchLayer areaId={areaId} />
    </>
  );
};
