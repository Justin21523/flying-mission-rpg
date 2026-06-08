import { Suspense, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { Box3, Vector3 } from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { useEditorPoliCharacterStore } from '../../stores/editorPoliCharacterStore';
import { useTransformStore, POLI_ROSTER, type PoliForm } from '../../stores/transformStore';
import { CORE_TEAM } from '../../data/characters/coreTeam';
import { HelicopterRotor } from './HelicopterRotor';

// The player is one of the 4 main characters (cycle with C), each with two forms (toggle with T):
//   • vehicle (default) → the character's car/helicopter model (modelVehiclePath)
//   • robot             → the character's transformer model   (modelRobotPath)
//
// CRITICAL: the ACTIVE character's BOTH models are always mounted together (one <Suspense>) inside
// the same moving+rotating group (Player.tsx). Three keeps updating an invisible object's world
// matrix, so the hidden form keeps following the body — a transform is a pure visibility flip and
// the revealed model is already at the correct position (no remount, no stale spot, no disappear).
// Cloned via SkeletonUtils.clone so rigged models work; auto-normalized (recentred X/Z, feet at y=0).
// Paths default to CORE_TEAM but are overridable per-character in the POLI tab.

const CAR_HEIGHT = 1.4;
const ROBOT_HEIGHT = 1.9;

// Preload all 8 roster models (4 chars × 2 forms) so cycling / transforming is instant.
for (const id of POLI_ROSTER) {
  const c = CORE_TEAM.find((x) => x.id === id);
  if (c?.modelVehiclePath) useGLTF.preload(c.modelVehiclePath);
  if (c?.modelRobotPath) useGLTF.preload(c.modelRobotPath);
}

const Capsule = () => (
  <mesh castShadow position={[0, 0, 0]}>
    <capsuleGeometry args={[0.45, 1.0, 8, 16]} />
    <meshStandardMaterial color="#3b82f6" roughness={0.5} metalness={0.2} />
  </mesh>
);

const ModelView = ({ path, height, visible }: { path: string; height: number; visible: boolean }) => {
  const { scene } = useGLTF(path);
  const { clone, scale, offset } = useMemo(() => {
    const c = SkeletonUtils.clone(scene); // not scene.clone() — keeps rigged models intact
    const box = new Box3().setFromObject(c);
    const size = new Vector3();
    const center = new Vector3();
    box.getSize(size);
    box.getCenter(center);
    const nativeH = Number.isFinite(size.y) && size.y > 1e-4 ? size.y : 1;
    const s = height / nativeH;
    const ox = Number.isFinite(center.x) ? -center.x * s : 0;
    const oy = Number.isFinite(box.min.y) ? -box.min.y * s : 0;
    const oz = Number.isFinite(center.z) ? -center.z * s : 0;
    return { clone: c, scale: s, offset: [ox, oy, oz] as [number, number, number] };
  }, [scene, height]);
  return <primitive object={clone} scale={scale} position={offset} visible={visible} />;
};

// Both forms of one character, always mounted; only visibility differs.
const BothForms = ({ carPath, robotPath, form }: { carPath: string; robotPath: string; form: PoliForm }) => (
  <>
    <ModelView path={carPath} height={CAR_HEIGHT} visible={form === 'vehicle'} />
    <ModelView path={robotPath} height={ROBOT_HEIGHT} visible={form === 'robot'} />
  </>
);

export const PlayerMesh = () => {
  const charId = useTransformStore((s) => s.charId);
  const form = useTransformStore((s) => s.form);
  const flying = useTransformStore((s) => s.flying);
  const override = useEditorPoliCharacterStore((s) => s.overrides[charId]);

  const base = CORE_TEAM.find((c) => c.id === charId);
  const carPath = override?.modelVehiclePath || base?.modelVehiclePath || '';
  const robotPath = override?.modelRobotPath || base?.modelRobotPath || '';
  const canFly = override?.canFly ?? base?.canFly ?? false;

  // Keyed by charId: switching character mounts the new pair (the old unmounts) — hidden under the
  // smoke cover. One <Suspense> so a capsule only shows during the very first load.
  return (
    <>
      <Suspense fallback={<Capsule />}>
        {carPath && robotPath
          ? <BothForms key={charId} carPath={carPath} robotPath={robotPath} form={form} />
          : <Capsule />}
      </Suspense>
      {canFly && flying && <HelicopterRotor />}
    </>
  );
};
