import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, BufferAttribute, CanvasTexture, Color, type Group, type Mesh, type MeshBasicMaterial, type Points, type PointsMaterial } from 'three';
import { useGroundAbilityStore } from '../../stores/game/groundAbilityStore';
import { useCharacterStore } from '../../stores/game/useCharacterStore';
import { getEditorCharacter, useEditorCharacterStore } from '../../stores/game/editorCharacterStore';
import { robotHandle } from './robotHandle';
import { groundScaleRatio } from './groundCharacterScale';

const SMOKE = 170;
const SPARK = 90;
const RINGS = 5;
const RING_STAGGER = 0.13;
const GLOW_LIFE = 0.55;
const SPARK_LIFE = 0.9;

function makeSoftTexture(): CanvasTexture {
  const s = 64;
  const cv = document.createElement('canvas');
  cv.width = s;
  cv.height = s;
  const ctx = cv.getContext('2d')!;
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.5)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  return new CanvasTexture(cv);
}

const rnd = (a: number, b: number) => a + Math.random() * (b - a);

export const GroundAbilityFx = () => {
  // The FX frame the CURRENT (authored) character size — ratio vs the base look, so editing a character's
  // model scale reframes its Q/R effects too (no hardcoded size).
  const charId = useCharacterStore((s) => s.selectedCharacterId);
  useEditorCharacterStore((s) => s.items);
  const character = charId ? getEditorCharacter(charId) : undefined;
  const ratioRef = useRef(1);
  useEffect(() => { ratioRef.current = groundScaleRatio(character); }, [character]);

  const groupRef = useRef<Group>(null);
  const smokeRef = useRef<Points>(null);
  const sparkRef = useRef<Points>(null);
  const glowRef = useRef<Mesh>(null);
  const ringRefs = useRef<(Mesh | null)[]>([]);
  const tex = useMemo(() => makeSoftTexture(), []);
  const smokeInit = useMemo(() => new Float32Array(SMOKE * 3), []);
  const sparkInit = useMemo(() => new Float32Array(SPARK * 3), []);
  const tint = useMemo(() => new Color('#ffffff'), []);
  const rippleTint = useMemo(() => new Color('#dbeafe'), []);
  const stateRef = useRef({
    smokeVel: new Float32Array(SMOKE * 3),
    sparkVel: new Float32Array(SPARK * 3),
    age: Infinity,
    duration: 1.25,
    ringMax: 7.5,
    lastCloudPulse: 0,
    lastExtraPulse: 0,
  });

  useFrame((_, dtRaw) => {
    const local = stateRef.current;
    const dt = Math.min(dtRaw, 0.05);
    const store = useGroundAbilityStore.getState();
    const sAttr = smokeRef.current?.geometry.attributes.position as BufferAttribute | undefined;
    const sArr = sAttr?.array as Float32Array | undefined;
    const pAttr = sparkRef.current?.geometry.attributes.position as BufferAttribute | undefined;
    const pArr = pAttr?.array as Float32Array | undefined;

    if (store.cloudPulseId !== local.lastCloudPulse && sArr && pArr) {
      local.lastCloudPulse = store.cloudPulseId;
      tint.set(store.cloudConfig.cloudColor);
      rippleTint.set(store.cloudConfig.rippleColor);
      local.duration = Math.max(0.2, store.cloudConfig.durationSec);
      local.ringMax = Math.max(0.5, store.cloudConfig.radius) * ratioRef.current;
      local.age = 0;
      for (let i = 0; i < SMOKE; i += 1) {
        const a = rnd(0, Math.PI * 2);
        const r = rnd(0, 0.9);
        const sp = rnd(1.7, 4.4);
        sArr[i * 3] = Math.cos(a) * r;
        sArr[i * 3 + 1] = rnd(0, 2.1);
        sArr[i * 3 + 2] = Math.sin(a) * r;
        local.smokeVel[i * 3] = Math.cos(a) * sp;
        local.smokeVel[i * 3 + 1] = rnd(0.8, 2.6);
        local.smokeVel[i * 3 + 2] = Math.sin(a) * sp;
      }
      for (let i = 0; i < SPARK; i += 1) {
        const a = rnd(0, Math.PI * 2);
        const sp = rnd(4, 9);
        pArr[i * 3] = 0;
        pArr[i * 3 + 1] = rnd(0.3, 1.2);
        pArr[i * 3 + 2] = 0;
        local.sparkVel[i * 3] = Math.cos(a) * sp;
        local.sparkVel[i * 3 + 1] = rnd(2.5, 6);
        local.sparkVel[i * 3 + 2] = Math.sin(a) * sp;
      }
    }

    if (store.extraPulseId !== local.lastExtraPulse && sArr && pArr) {
      local.lastExtraPulse = store.extraPulseId;
      const extra = store.extraConfig;
      if (extra) {
        tint.set(extra.color);
        rippleTint.set(extra.color);
        local.duration = Math.max(0.2, extra.durationSec);
        local.ringMax = Math.max(0.5, extra.radius) * ratioRef.current;
        local.age = 0;
        for (let i = 0; i < SPARK; i += 1) {
          const a = rnd(0, Math.PI * 2);
          const sp = rnd(5, 10);
          pArr[i * 3] = 0;
          pArr[i * 3 + 1] = rnd(0.2, 1.0);
          pArr[i * 3 + 2] = 0;
          local.sparkVel[i * 3] = Math.cos(a) * sp;
          local.sparkVel[i * 3 + 1] = rnd(2.5, 5.5);
          local.sparkVel[i * 3 + 2] = Math.sin(a) * sp;
        }
        if (sArr) for (let i = 0; i < SMOKE * 3; i += 1) sArr[i] = 0;
      }
    }

    const group = groupRef.current;
    if (group) group.position.set(robotHandle.pos.x, robotHandle.pos.y - 0.45, robotHandle.pos.z);

    const t = local.age;
    const smokeMat = smokeRef.current?.material as PointsMaterial | undefined;
    const sparkMat = sparkRef.current?.material as PointsMaterial | undefined;
    const glowMat = glowRef.current?.material as MeshBasicMaterial | undefined;
    if (smokeMat) smokeMat.color.copy(tint);
    if (sparkMat) sparkMat.color.copy(tint);
    if (glowMat) glowMat.color.copy(tint);

    if (t > local.duration + 1.1) {
      if (smokeMat) smokeMat.opacity = 0;
      if (sparkMat) sparkMat.opacity = 0;
      if (glowMat) glowMat.opacity = 0;
      ringRefs.current.forEach((ring) => {
        const mat = ring?.material as MeshBasicMaterial | undefined;
        if (mat) mat.opacity = 0;
      });
      return;
    }
    local.age += dt;

    if (sArr && sAttr && t <= local.duration) {
      for (let i = 0; i < SMOKE * 3; i += 1) {
        sArr[i] += local.smokeVel[i] * dt;
        local.smokeVel[i] *= 0.9;
      }
      sAttr.needsUpdate = true;
    }
    if (smokeMat) {
      const fade = t < 0.16 ? t / 0.16 : Math.max(0, 1 - (t - 0.16) / Math.max(0.1, local.duration - 0.16));
      smokeMat.opacity = fade * 0.92;
      smokeMat.size = 1.9 + t * 3.4;
    }

    if (pArr && pAttr && t <= SPARK_LIFE) {
      for (let i = 0; i < SPARK; i += 1) {
        local.sparkVel[i * 3 + 1] -= 9 * dt;
        pArr[i * 3] += local.sparkVel[i * 3] * dt;
        pArr[i * 3 + 1] = Math.max(0.05, pArr[i * 3 + 1] + local.sparkVel[i * 3 + 1] * dt);
        pArr[i * 3 + 2] += local.sparkVel[i * 3 + 2] * dt;
      }
      pAttr.needsUpdate = true;
    }
    if (sparkMat) {
      sparkMat.opacity = Math.max(0, 1 - t / SPARK_LIFE);
      sparkMat.size = 0.9;
    }

    if (glowRef.current && glowMat) {
      if (t <= GLOW_LIFE) {
        const k = t / GLOW_LIFE;
        const sc = (0.6 + k * 3.4) * ratioRef.current;
        glowRef.current.scale.set(sc, sc, sc);
        glowMat.opacity = (1 - k) * 0.85;
      } else {
        glowMat.opacity = 0;
      }
    }

    ringRefs.current.forEach((ring, i) => {
      if (!ring) return;
      const rt = t - i * RING_STAGGER;
      const mat = ring.material as MeshBasicMaterial;
      mat.color.copy(rippleTint);
      if (rt < 0 || rt > 1) {
        mat.opacity = 0;
        return;
      }
      const k = rt;
      const radius = 0.4 + k * local.ringMax;
      ring.scale.set(radius, radius, radius);
      mat.opacity = (1 - k) * 0.72;
    });
  });

  return (
    <group ref={groupRef}>
      <points ref={smokeRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[smokeInit, 3]} count={SMOKE} />
        </bufferGeometry>
        <pointsMaterial map={tex} color="#ffffff" size={1.8} transparent opacity={0} depthWrite={false} sizeAttenuation />
      </points>
      <points ref={sparkRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[sparkInit, 3]} count={SPARK} />
        </bufferGeometry>
        <pointsMaterial map={tex} color="#ffffff" size={0.9} transparent opacity={0} depthWrite={false} blending={AdditiveBlending} sizeAttenuation />
      </points>
      <mesh ref={glowRef} position={[0, 1, 0]}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0} depthWrite={false} blending={AdditiveBlending} />
      </mesh>
      {Array.from({ length: RINGS }).map((_, i) => (
        <mesh key={i} ref={(el) => { ringRefs.current[i] = el; }} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
          <ringGeometry args={[0.82, 1.0, 48]} />
          <meshBasicMaterial color="#dbeafe" transparent opacity={0} depthWrite={false} blending={AdditiveBlending} />
        </mesh>
      ))}
    </group>
  );
};
