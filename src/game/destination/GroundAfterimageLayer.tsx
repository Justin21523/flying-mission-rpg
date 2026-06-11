import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Color, MeshStandardMaterial, type Group, type Mesh } from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { resolveModelAsset } from '../../stores/modelStudioStore';
import { useCharacterStore } from '../../stores/game/useCharacterStore';
import { getEditorCharacter, useEditorCharacterStore } from '../../stores/game/editorCharacterStore';
import { useGroundAbilityStore } from '../../stores/game/groundAbilityStore';
import { robotHandle } from './robotHandle';
import { groundCharacterScale } from './groundCharacterScale';
import { superBoost } from './superBoost';

const MAX = 18;
// Afterimage params for the R super-speed boost (the rescue surge uses its own authored params instead).
const BOOST_INTERVAL = 0.045;
const BOOST_LIFE = 0.85;
const BOOST_OPACITY = 0.55;

interface Ghost {
  t: number;
  x: number;
  y: number;
  z: number;
  ry: number;
}

const GhostModel = ({
  index,
  path,
  position,
  rotation,
  scale,
  baseScale,
  setGroup,
  setMat,
}: {
  index: number;
  path: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  baseScale: number;
  setGroup: (i: number, g: Group | null) => void;
  setMat: (i: number, m: MeshStandardMaterial | null) => void;
}) => {
  const { scene } = useGLTF(encodeURI(path));
  const { clone, mat } = useMemo(() => {
    const cloned = SkeletonUtils.clone(scene);
    const material = new MeshStandardMaterial({ transparent: true, opacity: 0.4, depthWrite: false, emissiveIntensity: 0.8 });
    cloned.traverse((obj) => {
      const mesh = obj as Mesh;
      if (mesh.isMesh) mesh.material = material;
    });
    return { clone: cloned, mat: material };
  }, [scene]);

  useEffect(() => {
    setMat(index, mat);
    return () => {
      mat.dispose();
      setMat(index, null);
    };
  }, [index, mat, setMat]);

  return (
    <group ref={(el) => setGroup(index, el)} visible={false}>
      <group position={[0, -0.8, 0]} scale={baseScale}>
        <primitive object={clone} position={position} rotation={rotation} scale={scale} />
      </group>
    </group>
  );
};

export const GroundAfterimageLayer = () => {
  const charId = useCharacterStore((s) => s.selectedCharacterId);
  useEditorCharacterStore((s) => s.items);
  const character = charId ? getEditorCharacter(charId) : undefined;
  const asset = character?.modelAssetId ? resolveModelAsset(character.modelAssetId) : undefined;
  const groups = useRef<(Group | null)[]>(Array.from({ length: MAX }, () => null));
  const mats = useRef<(MeshStandardMaterial | null)[]>(Array.from({ length: MAX }, () => null));
  const ghosts = useRef<Ghost[]>(Array.from({ length: MAX }, () => ({ t: -99, x: 0, y: 0, z: 0, ry: 0 })));
  const tint = useRef(new Color('#38bdf8'));
  const head = useRef(0);
  const lastSpawn = useRef(0);
  const setGroup = useCallback((i: number, el: Group | null) => { groups.current[i] = el; }, []);
  const setMat = useCallback((i: number, mat: MeshStandardMaterial | null) => { mats.current[i] = mat; }, []);

  useFrame(() => {
    const now = performance.now() / 1000;
    const ability = useGroundAbilityStore.getState();
    const surging = ability.surgeUntil > now;
    const cfg = ability.surgeConfig;
    // Stream clone ghosts during the rescue surge OR while R super-speed is toggled on. Surge uses its authored
    // afterimage params; the boost uses constant params tinted by the character colour.
    const boosting = superBoost.active && !surging;
    const interval = surging ? cfg.afterimageIntervalSec : BOOST_INTERVAL;
    const life = Math.max(0.1, surging ? cfg.afterimageLifeSec : BOOST_LIFE);
    const opacity = surging ? cfg.afterimageOpacity : BOOST_OPACITY;
    if (surging || boosting) {
      tint.current.set(surging ? cfg.afterimageColor : (character?.color ?? '#38bdf8'));
      if (now - lastSpawn.current >= interval) {
        lastSpawn.current = now;
        const ghost = ghosts.current[head.current % MAX];
        ghost.t = now;
        ghost.x = robotHandle.pos.x;
        ghost.y = robotHandle.pos.y;
        ghost.z = robotHandle.pos.z;
        ghost.ry = robotHandle.heading;
        head.current += 1;
      }
    }
    for (let i = 0; i < MAX; i += 1) {
      const group = groups.current[i];
      const ghost = ghosts.current[i];
      if (!group) continue;
      const age = now - ghost.t;
      if (age < 0 || age > life) {
        group.visible = false;
        continue;
      }
      const k = 1 - age / life;
      group.visible = true;
      group.position.set(ghost.x, ghost.y, ghost.z);
      group.rotation.y = ghost.ry;
      group.scale.setScalar(1);
      const mat = mats.current[i];
      if (mat) {
        mat.opacity = opacity * k;
        mat.color.copy(tint.current);
        mat.emissive.copy(tint.current);
      }
    }
  });

  if (asset) {
    return (
      <>
        {Array.from({ length: MAX }).map((_, i) => (
          <GhostModel
            key={`${asset.id}-${i}`}
            index={i}
            path={asset.path}
            position={asset.position}
            rotation={asset.rotation}
            scale={asset.scale}
            baseScale={groundCharacterScale(character)}
            setGroup={setGroup}
            setMat={setMat}
          />
        ))}
      </>
    );
  }

  return (
    <>
      {Array.from({ length: MAX }).map((_, i) => (
        <group key={i} ref={(el) => setGroup(i, el)} visible={false}>
          <mesh position={[0, 0.1, 0]} ref={(el) => setMat(i, el ? (el.material as MeshStandardMaterial) : null)}>
            <boxGeometry args={[0.8, 1.2, 0.6]} />
            <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.7} transparent opacity={0.4} depthWrite={false} />
          </mesh>
        </group>
      ))}
    </>
  );
};
