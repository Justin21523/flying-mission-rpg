import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { AnimationMixer, LoopRepeat, type AnimationClip } from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { getModelAsset } from '../../data/modelLibrary';
import type { CharacterForm } from '../../types/game/character';

// Small standalone R3F preview (own WebGL context). The ROBOT form shows the character's real transformer
// GLB; the PLANE form shows a primitive (most characters have no separate plane model yet).
//
// The transformer GLBs are rigged with animations — a STATIC bind pose renders folded/invisible, so we
// PLAY a clip via an AnimationMixer (same approach as the kit's ModelStudio preview). No distance culling
// here (this is an isolated preview, not the world).
const PosedModel = ({ assetId }: { assetId: string }) => {
  const asset = getModelAsset(assetId)!;
  const { scene, animations } = useGLTF(encodeURI(asset.path));
  const cloned = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const mixerRef = useRef<AnimationMixer | null>(null);

  useEffect(() => {
    const clips = (animations ?? []) as AnimationClip[];
    if (clips.length === 0) return;
    const mixer = new AnimationMixer(cloned);
    mixerRef.current = mixer;
    const action = mixer.clipAction(clips[0]);
    action.reset();
    action.setLoop(LoopRepeat, Infinity);
    action.play();
    return () => {
      mixer.stopAllAction();
      mixerRef.current = null;
    };
  }, [cloned, animations]);

  useFrame((_, dt) => mixerRef.current?.update(dt));

  return <primitive object={cloned} />;
};

// Primitive fallback — plane (flat body + wings) or a blocky robot when no model exists.
const PrimitiveModel = ({ color, form }: { color: string; form: CharacterForm }) => {
  if (form === 'robot') {
    return (
      <group position={[0, 1, 0]}>
        <mesh position={[0, 0.7, 0]}><boxGeometry args={[0.7, 0.6, 0.5]} /><meshStandardMaterial color={color} /></mesh>
        <mesh><boxGeometry args={[0.55, 0.8, 0.4]} /><meshStandardMaterial color={color} /></mesh>
        <mesh position={[-0.45, 0.05, 0]}><boxGeometry args={[0.18, 0.7, 0.18]} /><meshStandardMaterial color={color} /></mesh>
        <mesh position={[0.45, 0.05, 0]}><boxGeometry args={[0.18, 0.7, 0.18]} /><meshStandardMaterial color={color} /></mesh>
      </group>
    );
  }
  return (
    <group position={[0, 1, 0]}>
      <mesh><boxGeometry args={[0.55, 0.4, 1.7]} /><meshStandardMaterial color={color} /></mesh>
      <mesh position={[0, 0, 0.1]}><boxGeometry args={[2.2, 0.12, 0.5]} /><meshStandardMaterial color={color} /></mesh>
      <mesh position={[0, 0.28, -0.75]}><boxGeometry args={[0.7, 0.45, 0.1]} /><meshStandardMaterial color={color} /></mesh>
    </group>
  );
};

export const CharacterPreview3D = ({
  color,
  form,
  modelAssetId,
}: {
  color: string;
  form: CharacterForm;
  modelAssetId?: string;
}) => {
  const showModel = form === 'robot' && !!modelAssetId && !!getModelAsset(modelAssetId);
  return (
    <Canvas camera={{ position: [3, 2.4, 3.6], fov: 45 }} dpr={[1, 1.5]} style={{ width: '100%', height: '100%' }}>
      <ambientLight intensity={0.85} />
      <hemisphereLight intensity={0.5} groundColor="#0b1220" />
      <directionalLight position={[4, 6, 3]} intensity={1.3} />
      <directionalLight position={[-3, 2, -2]} intensity={0.5} />
      {showModel ? (
        <Suspense fallback={<PrimitiveModel color={color} form={form} />}>
          <PosedModel assetId={modelAssetId!} />
        </Suspense>
      ) : (
        <PrimitiveModel color={color} form={form} />
      )}
      <OrbitControls makeDefault target={[0, 1, 0]} enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={1.3} />
    </Canvas>
  );
};
