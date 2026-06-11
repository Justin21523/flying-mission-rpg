import { Html } from '@react-three/drei';
import { CapsuleCollider, RigidBody } from '@react-three/rapier';
import { useSupportRuntimeStore } from '../../../stores/game/supportRuntimeStore';
import { getEditorCharacter } from '../../../stores/game/editorCharacterStore';
import { AnimatedGlbModel } from '../../world/AnimatedGlbModel';
import { characterModelForForm } from '../../destination/characterModel';
import { groundCharacterScale } from '../../destination/groundCharacterScale';

export const SupportCompanionLayer = () => {
  const presences = useSupportRuntimeStore((s) => s.presences);
  const controlled = useSupportRuntimeStore((s) => s.ownership.controlledCharacterId);
  return (
    <>
      {presences.filter((p) => p.tier !== 'remote' && p.characterId !== controlled).map((presence) => {
        const character = getEditorCharacter(presence.characterId);
        const fallback = (
          <mesh castShadow>
            <boxGeometry args={[0.8, 1.2, 0.6]} />
            <meshStandardMaterial color={character?.color ?? '#38bdf8'} />
          </mesh>
        );
        const tierScale = presence.tier === 'standby' ? 0.85 : 1;
        return (
          <RigidBody
            key={presence.characterId}
            type="kinematicPosition"
            colliders={false}
            position={presence.position}
            rotation={[0, presence.heading, 0]}
            userData={{ supportCharacterId: presence.characterId }}
          >
            {presence.colliderActive && <CapsuleCollider args={[0.55 * tierScale, 0.42 * tierScale]} position={[0, 0.95 * tierScale, 0]} />}
            <group scale={tierScale}>
              <group scale={groundCharacterScale(character)}>
                {characterModelForForm(character, 'robot') ? (
                  <AnimatedGlbModel assetId={characterModelForForm(character, 'robot')!} animation={character?.idleAnimation} rules={character?.animationRules} fallback={fallback} noCull />
                ) : fallback}
              </group>
              <Html center distanceFactor={28} position={[0, 2.5, 0]}>
                <div className="pointer-events-none whitespace-nowrap rounded-full bg-slate-950/80 px-2 py-0.5 text-[10px] font-semibold text-sky-100">
                  {character?.name ?? presence.characterId} · {presence.tier}
                </div>
              </Html>
            </group>
          </RigidBody>
        );
      })}
    </>
  );
};
