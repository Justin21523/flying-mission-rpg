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

  const size = getEffectiveAreaSize(areaId);
  const H = 18;
  return (
    <mesh position={[0, H / 2 - 1.5, 0]} renderOrder={3} raycast={noRaycast}>
      <cylinderGeometry args={[size, size, H, 48, 1, true]} />
      <meshBasicMaterial color="#e6ebf2" transparent opacity={0.9} side={DoubleSide} depthWrite={false} fog={false} toneMapped={false}>
        {/* alpha gradient: dense at the bottom (ground mist), fading to clear at the top */}
        <GradientTexture attach="alphaMap" stops={[0, 0.45, 1]} colors={['#ffffff', '#9aa3ad', '#000000']} />
      </meshBasicMaterial>
    </mesh>
  );
};
