import { useEffect, useMemo } from 'react';
import { PlaneGeometry } from 'three';
import { useEditorEnvironmentStore } from '../../stores/editorEnvironmentStore';
import { resolveAreaEnvironment } from '../environment/resolveAreaEnvironment';
import { useGroundTextures } from './useGroundTextures';
import { GROUND_SIZE } from './ZoneFloor';

// Phase 98b — optional flat PBR ground: a large three.js plane with a meshStandardMaterial whose maps
// are referenced by library key or path/URL. Rendered just above ZoneFloor (which keeps the collider)
// when the area's Environment groundType is 'flatPbr'. A missing/typo URL fails soft — the tinted
// plane still shows. Indoor areas are skipped. (Phase 98c: texture loading moved to useGroundTextures.)
// Sized to GROUND_SIZE (matching the infinite base) so the textured ground covers the whole roamable map;
// the geometry UVs are pre-scaled so the per-1000-units tile density set by `repeat` is preserved at any size.
const UV_REF = 1000; // the size at which `repeat` was authored (legacy plane size)

// The textured PBR plane itself (no groundType gate) — reused by FlatPbrGround AND as the infinite base
// beyond a heightfield's sculpted terrain. `y` places it (flat ground surface vs below the terrain).
export const PbrGroundPlane = ({ areaId, size = GROUND_SIZE, y = 0.015 }: { areaId: string; size?: number; y?: number }) => {
  useEditorEnvironmentStore((s) => s.overrides);
  useEditorEnvironmentStore((s) => s.defaultMode);
  const env = resolveAreaEnvironment(areaId);
  const g = env.pbrGround;
  const { albedo, normal, rough, ao } = useGroundTextures(g);

  // Plane geometry with a uv1 set so aoMap works (three r152+ reads the uv1 attribute). UVs are scaled by
  // size/UV_REF so the texture keeps the same world-space tile size as the legacy 1000-unit plane.
  const geom = useMemo(() => {
    const p = new PlaneGeometry(size, size, 1, 1);
    const uv = p.getAttribute('uv');
    const s = size / UV_REF;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * s, uv.getY(i) * s);
    uv.needsUpdate = true;
    p.setAttribute('uv1', uv.clone());
    return p;
  }, [size]);
  useEffect(() => () => geom.dispose(), [geom]);

  return (
    <mesh geometry={geom} rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]} receiveShadow>
      {/* key forces a material rebuild when the SET of maps changes (shader recompile). */}
      <meshStandardMaterial
        key={`${!!albedo}-${!!normal}-${!!rough}-${!!ao}`}
        color={g.tint}
        map={albedo ?? undefined}
        normalMap={normal ?? undefined}
        roughnessMap={rough ?? undefined}
        aoMap={ao ?? undefined}
        roughness={g.roughness}
        metalness={g.metalness}
        normalScale={[g.normalScale, g.normalScale]}
      />
    </mesh>
  );
};

export const FlatPbrGround = ({ areaId, size = GROUND_SIZE }: { areaId: string; size?: number }) => {
  // Subscribe so the gate re-resolves when overrides / default mode change.
  useEditorEnvironmentStore((s) => s.overrides);
  useEditorEnvironmentStore((s) => s.defaultMode);
  const env = resolveAreaEnvironment(areaId);
  if (env.isIndoor || env.groundType !== 'flatPbr') return null;
  return <PbrGroundPlane areaId={areaId} size={size} y={0.015} />;
};
