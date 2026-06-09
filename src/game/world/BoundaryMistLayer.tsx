import { DoubleSide } from 'three';
import { GradientTexture } from '@react-three/drei';
import { useUiStore } from '../../stores/uiStore';
import { useEditorWorldStore, isAreaIndoor } from '../../stores/editorWorldStore';
import { useEditorLayoutStore } from '../../stores/editorLayoutStore';
import { getEffectiveAreaSize } from './areaExtent';

// POLI — soft mist ONLY at the map's outer boundary (the farthest-object edge), to obscure the void beyond so
// you "can't quite see" past the content. A ground-hugging cylindrical fog band at the boundary radius: dense
// near the ground, fading upward (sky stays visible). Play Mode + outdoor only; non-interactive (no raycast).
const noRaycast = () => null;

export const BoundaryMistLayer = ({ areaId }: { areaId: string }) => {
  const editMode = useUiStore((s) => s.editMode);
  // Subscribe so the mist ring grows/shrinks live with the boundary as content is placed/edited.
  useEditorWorldStore((s) => s.areas);
  useEditorLayoutStore((s) => s.presets[areaId]);
  if (editMode || isAreaIndoor(areaId)) return null;

  // Sit RIGHT AT the boundary wall: the shells straddle the wall (a few inside, the rest outside) so there's a
  // big thick sheet of mist at the wall edge. The wall now hugs the content (margin 5), so this is also close.
  const wall = getEffectiveAreaSize(areaId);
  const H = 200; // very tall wall of mist so it fully hides the void in every view, even looking up.
  // Many tightly-packed concentric shells straddling the wall — from EVERY angle the line of sight crosses
  // several fully-opaque layers → uniform, very thick density forming a big mist sheet all along the wall.
  const SHELLS = 10;
  const start = Math.max(4, wall - 4); // begin a few units before the wall
  return (
    <group renderOrder={3}>
      {Array.from({ length: SHELLS }, (_, i) => (
        <mesh key={i} position={[0, H / 2 - 2, 0]} raycast={noRaycast}>
          <cylinderGeometry args={[start + i * 2, start + i * 2, H, 64, 1, true]} />
          <meshBasicMaterial color="#eef2f7" transparent opacity={1} side={DoubleSide} depthWrite={false} fog={false} toneMapped={false}>
            {/* alpha gradient: fully opaque almost to the top (uniform density), only the very top fades to clear */}
            <GradientTexture attach="alphaMap" stops={[0, 0.92, 1]} colors={['#ffffff', '#ffffff', '#000000']} />
          </meshBasicMaterial>
        </mesh>
      ))}
    </group>
  );
};
