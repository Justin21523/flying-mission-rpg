import { Suspense, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { SkeletonUtils } from 'three-stdlib';
import { type Group, type Mesh, type MeshStandardMaterial, type MeshBasicMaterial } from 'three';
import { useCombatTargetStore, liveTargets, type CombatTarget } from '../../stores/game/combatTargetStore';
import { getDamageable } from '../../stores/game/editorCombatStore';
import { resolveModelAsset } from '../../stores/modelStudioStore';
import { EnemyArchetypeVisual } from './EnemyArchetypeVisual';
import { getTargetStatusEffects, type StatusEffectType } from './StatusEffectRuntime';
import { getAffixDef } from '../../stores/game/useEliteAffixStore';
import type { AffixId } from '../../data/combat/eliteAffixes';

// Batch P — colour-coded status legibility. Dominant active effect tints a feet aura ring + the body emissive.
const STATUS_COLORS: Partial<Record<StatusEffectType, string>> = {
  burning: '#fb923c', frozen: '#67e8f9', shocked: '#fef9c3', 'armor-broken': '#f87171',
  bleed: '#dc2626', 'poise-broken': '#fbbf24', slowed: '#93c5fd', // Wave 5/6 aura tints
};
const STATUS_PRIORITY: StatusEffectType[] = ['poise-broken', 'armor-broken', 'burning', 'bleed', 'frozen', 'shocked', 'slowed'];
function dominantStatusColor(target: CombatTarget): string | null {
  const active = getTargetStatusEffects(target);
  for (const type of STATUS_PRIORITY) {
    if (active.some((e) => e.type === type)) return STATUS_COLORS[type] ?? null;
  }
  return null;
}

// GLB body for an enemy target (model-first). Falls back to the coloured capsule if no model is set.
const EnemyGlb = ({ assetId, scale }: { assetId: string; scale: number }) => {
  const asset = resolveModelAsset(assetId);
  const { scene } = useGLTF(encodeURI(asset?.path ?? ''));
  const cloned = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const s = asset?.scale;
  const base = (typeof s === 'number' ? s : Array.isArray(s) ? s[0] : 1) * scale;
  return <primitive object={cloned} scale={base} />;
};

// Renders the live dummy combat targets. Each target body + HP (and shield) bar updates per-frame from the
// mutable target record (hp/shield change in place without store writes; the store only bumps `version` when
// the SET changes — spawn/defeat). On defeat the body shrinks into a quick poof.

const DummyTarget = ({ target }: { target: CombatTarget }) => {
  const groupRef = useRef<Group>(null);
  const bodyRef = useRef<Mesh>(null);
  const hpRef = useRef<Mesh>(null);
  const shieldRef = useRef<Mesh>(null);
  const stunRef = useRef<Mesh>(null);
  const scanRef = useRef<Mesh>(null);
  const auraRef = useRef<Mesh>(null);
  const affixAuraRef = useRef<Group>(null);
  const poiseRef = useRef<Mesh>(null);
  const execRef = useRef<Mesh>(null);
  const def = getDamageable(target.definitionId);
  const color = def?.editorMeta?.color ?? '#94a3b8';
  const hasShield = (target.maxShield ?? 0) > 0;
  // Wave 1/6 — elite-affix aura colours: one ring per applied affix (so a multi-affix elite reads all its
  // affixes at a glance, not just the first); fixed for the target's lifetime.
  const affixColors = useMemo(
    () => (target.affixIds ?? []).map((id) => getAffixDef(id as AffixId)?.auraColor).filter((c): c is string => !!c),
    [target.affixIds],
  );

  useFrame(() => {
    const g = groupRef.current;
    if (!g) return;
    if (target.defeatedAt) {
      const t = (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000 - target.defeatedAt;
      const k = Math.max(0, 1 - t / 0.5);
      g.scale.setScalar(k);
      return;
    }
    if (hpRef.current) hpRef.current.scale.x = Math.max(0.001, target.hp / target.maxHp);
    if (shieldRef.current && hasShield) shieldRef.current.scale.x = Math.max(0.001, target.shield / target.maxShield);
    // Batch P — dominant status effect tints the body emissive + a spinning feet aura ring.
    const statusColor = target.isEnemy ? dominantStatusColor(target) : null;
    const body = bodyRef.current?.material as MeshStandardMaterial | undefined;
    if (body) {
      if (statusColor) { body.emissive.set(statusColor); body.emissiveIntensity = 0.7; }
      else { body.emissive.set(target.color ?? color); body.emissiveIntensity = 0.2; }
    }
    if (auraRef.current) {
      auraRef.current.visible = !!statusColor;
      if (statusColor) { (auraRef.current.material as MeshBasicMaterial).color.set(statusColor); auraRef.current.rotation.z += 0.06; }
    }
    if (affixAuraRef.current && affixColors.length) affixAuraRef.current.rotation.y -= 0.04;
    const nowSec = (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;
    if (stunRef.current) { stunRef.current.visible = (target.aiData?.stunUntil ?? 0) > nowSec; stunRef.current.rotation.y += 0.1; }
    if (scanRef.current) scanRef.current.visible = !!target.scanned;
    // Wave 2 — poise bar + execute hint.
    if (poiseRef.current && (target.maxPoise ?? 0) > 0) poiseRef.current.scale.x = Math.max(0.001, (target.poiseValue ?? 0) / (target.maxPoise || 1));
    if (execRef.current) {
      const broken = (target.aiData?.stunUntil ?? 0) > nowSec;
      const lowHp = target.hp / Math.max(1, target.maxHp) <= (broken ? 0.45 : 0.25);
      execRef.current.visible = target.isEnemy === true && lowHp && !target.defeatedAt;
      if (execRef.current.visible) execRef.current.rotation.y += 0.12;
    }
  });

  const isEnemy = target.isEnemy;
  const bodyColor = target.color ?? color;
  return (
    <group ref={groupRef} position={[target.x, target.y, target.z]}>
      {/* Wave 1/6 — elite-affix aura rings (one per affix, concentric). Always visible for affixed enemies. */}
      {isEnemy && affixColors.length > 0 && (
        <group ref={affixAuraRef} position={[0, 0.04, 0]}>
          {affixColors.map((c, i) => (
            <mesh key={i} position={[0, i * 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <torusGeometry args={[1.05 + i * 0.18, 0.06, 8, 28]} />
              <meshBasicMaterial color={c} transparent opacity={0.85} depthWrite={false} />
            </mesh>
          ))}
        </group>
      )}
      {/* Batch P — status aura ring at the feet (colour = dominant status effect). */}
      {isEnemy && (
        <mesh ref={auraRef} position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
          <torusGeometry args={[0.85, 0.1, 8, 24]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.8} depthWrite={false} />
        </mesh>
      )}
      {/* Stun ring (Paul cuff) + scanned weakpoint marker (Chase scan). */}
      {isEnemy && (
        <mesh ref={stunRef} position={[0, 2.8, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
          <torusGeometry args={[0.6, 0.08, 6, 16]} />
          <meshBasicMaterial color="#fde047" />
        </mesh>
      )}
      {isEnemy && (
        <mesh ref={scanRef} position={[0, 2.2, 0]} visible={false}>
          <octahedronGeometry args={[0.25, 0]} />
          <meshBasicMaterial color="#f87171" />
        </mesh>
      )}
      {isEnemy && target.modelAssetId ? (
        <group rotation={[0, target.facingRad ?? 0, 0]}>
          <Suspense fallback={<mesh position={[0, 1, 0]}><capsuleGeometry args={[0.6, 1, 6, 12]} /><meshStandardMaterial color={bodyColor} /></mesh>}>
            <EnemyGlb assetId={target.modelAssetId} scale={target.scale ?? 1} />
          </Suspense>
        </group>
      ) : (
        <mesh ref={bodyRef} position={[0, 1, 0]} castShadow>
          <capsuleGeometry args={[0.6, 1, 6, 12]} />
          <meshStandardMaterial color={bodyColor} emissive={bodyColor} emissiveIntensity={0.2} />
        </mesh>
      )}
      {/* HP bar (red bg + green fill) */}
      <group position={[0, 2.4, 0]}>
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[1.4, 0.16]} />
          <meshBasicMaterial color="#3f1d1d" depthWrite={false} />
        </mesh>
        <mesh ref={hpRef} position={[-0.7, 0, 0.01]}>
          <planeGeometry args={[1.4, 0.16]} />
          <meshBasicMaterial color="#22c55e" depthWrite={false} />
        </mesh>
      </group>
      {hasShield && (
        <group position={[0, 2.62, 0]}>
          <mesh position={[0, 0, 0]}>
            <planeGeometry args={[1.4, 0.1]} />
            <meshBasicMaterial color="#1e3a5f" depthWrite={false} />
          </mesh>
          <mesh ref={shieldRef} position={[-0.7, 0, 0.01]}>
            <planeGeometry args={[1.4, 0.1]} />
            <meshBasicMaterial color="#38bdf8" depthWrite={false} />
          </mesh>
        </group>
      )}
      {/* Wave 2 — poise / break meter (amber), shown only for enemies that have one. */}
      {isEnemy && (target.maxPoise ?? 0) > 0 && (
        <group position={[0, hasShield ? 2.74 : 2.6, 0]}>
          <mesh position={[0, 0, 0]}>
            <planeGeometry args={[1.4, 0.07]} />
            <meshBasicMaterial color="#3a2e10" depthWrite={false} />
          </mesh>
          <mesh ref={poiseRef} position={[-0.7, 0, 0.01]}>
            <planeGeometry args={[1.4, 0.07]} />
            <meshBasicMaterial color="#fbbf24" depthWrite={false} />
          </mesh>
        </group>
      )}
      {/* Wave 2 — execute hint (gold diamond) over finishable enemies. */}
      {isEnemy && (
        <mesh ref={execRef} position={[0, 3.1, 0]} visible={false}>
          <octahedronGeometry args={[0.22, 0]} />
          <meshBasicMaterial color="#fde047" />
        </mesh>
      )}
    </group>
  );
};

export const CombatDummyTargetLayer = () => {
  // Re-render when the SET of targets changes (spawn / defeat sweep).
  useCombatTargetStore((s) => s.version);
  // Obstacle proxies are drawn by ObstacleRenderer; boss body + weakpoints by BossRenderer — skip them here.
  const drawable = liveTargets.filter((t) => !t.isObstacle && !t.isBossEntity && !t.isBossWeakpoint);
  return (
    <>
      {drawable.map((t) => (
        <DummyTarget key={t.id} target={t} />
      ))}
      {drawable.filter((t) => t.isEnemy && t.archetype && t.archetype !== 'generic').map((t) => (
        <EnemyArchetypeVisual key={`av_${t.id}`} target={t} />
      ))}
    </>
  );
};
