import { DoubleSide } from 'three';
import { GradientTexture } from '@react-three/drei';
import { useUiStore } from '../../stores/uiStore';
import { useEditorWorldStore, isAreaIndoor } from '../../stores/editorWorldStore';
import { useEditorLayoutStore } from '../../stores/editorLayoutStore';
import { getContentExtent } from './areaExtent';

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

  // Hug the farthest placed object: the inner shell sits just past the content edge (not at the far boundary),
  // so the mist wraps right around the outermost objects. Small floor so an empty area isn't a tiny ring.
  const inner = Math.max(10, getContentExtent(areaId) + 2);
  const H = 200; // very tall wall of mist so it fully hides the void in every view, even looking up.
  // Concentric shells extending OUTWARD from the content edge — dense, thick, fully opaque to the top.
  const bands = [inner, inner + 3, inner + 6, inner + 9, inner + 12];
  return (
    <group renderOrder={3}>
      {bands.map((r, i) => (
        <mesh key={i} position={[0, H / 2 - 2, 0]} raycast={noRaycast}>
          <cylinderGeometry args={[r, r, H, 56, 1, true]} />
          <meshBasicMaterial color="#eef2f7" transparent opacity={1} side={DoubleSide} depthWrite={false} fog={false} toneMapped={false}>
            {/* alpha gradient: solid/opaque most of the way up (very dense), only the very top fades to clear */}
            <GradientTexture attach="alphaMap" stops={[0, 0.8, 1]} colors={['#ffffff', '#ffffff', '#000000']} />
          </meshBasicMaterial>
        </mesh>
      ))}
    </group>
  );
};
