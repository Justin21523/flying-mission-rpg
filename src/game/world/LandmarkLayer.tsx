import { Suspense } from 'react';
import { Text } from '@react-three/drei';
import { useEditorLandmarkStore } from '../../stores/editorLandmarkStore';
import type { Landmark } from '../../stores/editorLandmarkStore';
import { useUiStore } from '../../stores/uiStore';
import { useMergedTransform, useIsDeleted } from '../../stores/sceneEditStore';
import { objKey } from '../edit/sceneEditMerge';
import { EditableObject } from '../edit/EditableObject';
import { markEditHelper } from '../edit/markEditHelper';
import { SceneGlbModel } from './SceneGlbModel';

// POLI — per-area landmarks. Edit Mode: each is an EditableObject (gizmo moves it; position auto-saved
// to the kit sceneEditStore). Play Mode: a stub pillar (or its GLB) with a floating name label at the
// merged position. Editable in the 🗺 Landmarks tab.
export const LandmarkLayer = ({ areaId }: { areaId: string }) => {
  const landmarks = useEditorLandmarkStore((s) => s.landmarks);
  const here = landmarks.filter((l) => l.areaId === areaId);
  if (here.length === 0) return null;
  return <>{here.map((l) => <LandmarkEntity key={l.id} lm={l} />)}</>;
};

const StubPillar = () => (
  <group>
    <mesh castShadow position={[0, 1.1, 0]}>
      <cylinderGeometry args={[0.5, 0.7, 2.2, 6]} />
      <meshStandardMaterial color="#7c8aa0" roughness={0.7} metalness={0.1} />
    </mesh>
    <mesh castShadow position={[0, 2.5, 0]}>
      <coneGeometry args={[0.6, 0.7, 6]} />
      <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.35} />
    </mesh>
  </group>
);

const LandmarkVisual = ({ lm }: { lm: Landmark }) => (
  <>
    {lm.modelAssetId
      ? <Suspense fallback={<StubPillar />}><SceneGlbModel assetId={lm.modelAssetId} /></Suspense>
      : <StubPillar />}
    <Text ref={markEditHelper} raycast={() => null} position={[0, 3.4, 0]} fontSize={0.4} color="#fde68a" anchorX="center" anchorY="middle" outlineWidth={0.04} outlineColor="#000" renderOrder={1}>
      {lm.name}
    </Text>
  </>
);

const LandmarkEntity = ({ lm }: { lm: Landmark }) => {
  const editMode = useUiStore((s) => s.editMode);
  const key = objKey(lm.areaId, 'landmark', lm.id);
  const base = { position: lm.position, rotation: [0, 0, 0] as [number, number, number], scale: 1 };
  const m = useMergedTransform(key, base);
  const deleted = useIsDeleted(key);
  if (deleted) return null; // Edit-Mode Delete (kit soft-delete) hides it

  if (editMode) {
    return <EditableObject objKey={key} base={base}><LandmarkVisual lm={lm} /></EditableObject>;
  }
  return (
    <group position={m.position} rotation={m.rotation} scale={m.scale}>
      <LandmarkVisual lm={lm} />
    </group>
  );
};
