import { useMemo } from 'react';
import { Vector3 } from 'three';
import { useEditorPathStore } from '../../stores/editorPathStore';
import { getCurve, samplePos, sampleTangent } from '../path/pathCurve';
import { NormalizedGlbModel } from '../world/NormalizedGlbModel';
import type { PathDefinition } from '../../types/path';

// POLI — tiles a surface model (+ optional roadside decor) along a curve path, the same way RoadModels does for
// RoadPaths. Sampled once and memoised (re-samples when nodes/model/spacing change). Renders in both modes so
// authored roads/tracks are visible while editing. Sibling layer in AreaRenderer.
const _p = new Vector3();
const _t = new Vector3();

interface Tile { key: string; model: string; pos: [number, number, number]; rot: number; scale: number }

const PathModels = ({ def }: { def: PathDefinition }) => {
  const tiles = useMemo<Tile[]>(() => {
    const cc = getCurve(def);
    if (!cc || cc.length === 0) return [];
    const out: Tile[] = [];
    const sample = (model: string | undefined, spacing: number, scale: number, offset: number, tag: string) => {
      if (!model || spacing <= 0) return;
      const n = Math.max(1, Math.floor(cc.length / spacing));
      for (let i = 0; i < n; i++) {
        const u = i / n;
        samplePos(cc.curve, u, _p);
        sampleTangent(cc.curve, u, _t);
        const h = Math.atan2(_t.x, _t.z);
        out.push({ key: `${tag}${i}`, model, pos: [_p.x + Math.cos(h) * offset, _p.y, _p.z - Math.sin(h) * offset], rot: h, scale });
      }
    };
    sample(def.surfaceModelAssetId, def.surfaceSpacing ?? 6, def.surfaceScale ?? 4, 0, 's');
    sample(def.decorModelAssetId, def.decorSpacing ?? 12, 3, def.decorOffset ?? 4, 'd');
    return out;
  }, [def]);

  if (tiles.length === 0) return null;
  return <>{tiles.map((it) => (
    <group key={it.key} position={it.pos} rotation={[0, it.rot, 0]}>
      <NormalizedGlbModel assetId={it.model} target={it.scale} />
    </group>
  ))}</>;
};

export const PathModelLayer = ({ areaId }: { areaId: string }) => {
  const paths = useEditorPathStore((s) => s.paths).filter((p) => (p.areaId ?? 'rescue_hq') === areaId && (p.surfaceModelAssetId || p.decorModelAssetId));
  if (paths.length === 0) return null;
  return <>{paths.map((p) => <PathModels key={p.id} def={p} />)}</>;
};
