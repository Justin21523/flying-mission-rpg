import { Component, Suspense, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { SkeletonUtils } from 'three-stdlib';
import { AdditiveBlending, BackSide, BufferAttribute, CanvasTexture, Color, DoubleSide, MeshBasicMaterial, type Group, type Material, type Mesh, type Object3D, type PointLight, type Points, type PointsMaterial } from 'three';
import { resolveModelAsset } from '../../stores/modelStudioStore';
import { txFrame, useTxVersion } from './transformationRuntime';
import { useAudioStore } from '../../stores/audioStore';
import type { ActiveEffect } from './TransformationTimelineRunner';
import type { TransformationPartKey } from '../../types/game/transformation';

// Renders the runner's currently-active effect tracks (sparse) — each keyed by id, so they mount on entry and
// UNMOUNT on exit/replay (no accumulation, no memory growth). Distinct, child-friendly visuals; followTargetPart
// pins an effect to a live part position.
function partPos(key?: TransformationPartKey): [number, number, number] {
  if (!key) return [0, 0.4, 0];
  const st = txFrame.snapshot?.parts.get(key);
  return st ? st.position : [0, 0.4, 0];
}
function effectPos(fx: ActiveEffect): [number, number, number] {
  const p = partPos(fx.followTargetPart);
  const o = fx.spawnOffset ?? [0, 0, 0];
  return [p[0] + o[0], p[1] + o[1], p[2] + o[2]];
}
function liveEffect(fx: ActiveEffect): ActiveEffect {
  return txFrame.snapshot?.activeEffects.find((active) => active.id === fx.id) ?? fx;
}

const EnergyRing = ({ fx }: { fx: ActiveEffect }) => {
  const m = useRef<Mesh>(null);
  useFrame(() => {
    const live = liveEffect(fx);
    const k = live.progress;
    if (m.current) {
      m.current.position.set(...effectPos(live));
      m.current.scale.setScalar(0.4 + k * (live.scale ?? 2));
      (m.current.material as MeshBasicMaterial).opacity = 1 - k;
    }
  });
  return (
    <mesh ref={m} position={effectPos(fx)} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[1, 0.06, 10, 40]} />
      <meshBasicMaterial color={fx.color ?? '#7fd0ff'} toneMapped={false} transparent opacity={1} />
    </mesh>
  );
};

const WhiteFlash = ({ fx }: { fx: ActiveEffect }) => {
  const m = useRef<Mesh>(null);
  // Batch 12 — reduce-motion dims sudden flashes (accessibility: reduce flashing). Cached, not per-frame.
  const flashScale = useRef(useAudioStore.getState().reduceMotion ? 0.3 : 1);
  useEffect(() => useAudioStore.subscribe(() => { flashScale.current = useAudioStore.getState().reduceMotion ? 0.3 : 1; }), []);
  useFrame(() => {
    const live = liveEffect(fx);
    const k = live.progress;
    if (m.current) (m.current.material as MeshBasicMaterial).opacity = (1 - k) * (live.intensity ?? 1) * 0.9 * flashScale.current;
  });
  return (
    <mesh ref={m} scale={60}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshBasicMaterial color={fx.color ?? '#ffffff'} side={BackSide} toneMapped={false} transparent opacity={0.9} depthWrite={false} />
    </mesh>
  );
};

const GlowPulse = ({ fx }: { fx: ActiveEffect }) => {
  const l = useRef<PointLight>(null);
  useFrame(() => {
    const live = liveEffect(fx);
    if (!l.current) return;
    const p = effectPos(live);
    l.current.position.set(p[0], p[1] + 0.5, p[2]);
    l.current.intensity = (1 + Math.abs(Math.sin(live.localTime * 8)) * 2) * (1 - live.progress * 0.35) * (live.intensity ?? 1);
  });
  const p = effectPos(fx);
  return <pointLight ref={l} color={fx.color ?? '#ffffff'} distance={20} position={[p[0], p[1] + 0.5, p[2]]} />;
};

const Sparkle = ({ fx }: { fx: ActiveEffect }) => {
  const g = useRef<Group>(null);
  useFrame(() => {
    const live = liveEffect(fx);
    if (!g.current) return;
    const p = effectPos(live);
    g.current.position.set(p[0], p[1] + 0.4, p[2]);
    g.current.rotation.y = live.localTime * 4;
    for (const child of g.current.children) {
      const mesh = child as Mesh;
      if (mesh.isMesh) (mesh.material as MeshBasicMaterial).opacity = Math.max(0, 1 - live.progress);
    }
  });
  const p = effectPos(fx);
  const opacity = Math.max(0, 1 - fx.progress);
  return (
    <group ref={g} position={[p[0], p[1] + 0.4, p[2]]}>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.8, Math.sin(a) * 0.4, Math.sin(a) * 0.8]}>
            <octahedronGeometry args={[0.12, 0]} />
            <meshBasicMaterial color={fx.color ?? '#fde047'} toneMapped={false} transparent opacity={opacity} />
          </mesh>
        );
      })}
    </group>
  );
};

const makeSoftTexture = (): CanvasTexture => {
  const s = 64;
  const cv = document.createElement('canvas');
  cv.width = s;
  cv.height = s;
  const ctx = cv.getContext('2d');
  if (!ctx) return new CanvasTexture(cv);
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.5)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  return new CanvasTexture(cv);
};

interface BurstVectors {
  smokeStart: Float32Array;
  smokeVel: Float32Array;
  sparkStart: Float32Array;
  sparkVel: Float32Array;
}

const seeded01 = (i: number): number => {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

function makeBurstVectors(smokeCount: number, sparkCount: number): BurstVectors {
  const smokeStart = new Float32Array(smokeCount * 3);
  const smokeVel = new Float32Array(smokeCount * 3);
  const sparkStart = new Float32Array(sparkCount * 3);
  const sparkVel = new Float32Array(sparkCount * 3);
  for (let i = 0; i < smokeCount; i += 1) {
    const a = seeded01(i * 5 + 1) * Math.PI * 2;
    const r = seeded01(i * 5 + 2) * 0.9;
    const sp = 1.7 + seeded01(i * 5 + 3) * 2.7;
    smokeStart[i * 3] = Math.cos(a) * r;
    smokeStart[i * 3 + 1] = seeded01(i * 5 + 4) * 2.1;
    smokeStart[i * 3 + 2] = Math.sin(a) * r;
    smokeVel[i * 3] = Math.cos(a) * sp;
    smokeVel[i * 3 + 1] = 0.8 + seeded01(i * 5 + 5) * 1.8;
    smokeVel[i * 3 + 2] = Math.sin(a) * sp;
  }
  for (let i = 0; i < sparkCount; i += 1) {
    const a = seeded01(i * 7 + 101) * Math.PI * 2;
    const sp = 4 + seeded01(i * 7 + 102) * 5;
    sparkStart[i * 3] = 0;
    sparkStart[i * 3 + 1] = 0.3 + seeded01(i * 7 + 103) * 0.9;
    sparkStart[i * 3 + 2] = 0;
    sparkVel[i * 3] = Math.cos(a) * sp;
    sparkVel[i * 3 + 1] = 2.5 + seeded01(i * 7 + 104) * 3.5;
    sparkVel[i * 3 + 2] = Math.sin(a) * sp;
  }
  return { smokeStart, smokeVel, sparkStart, sparkVel };
}

const CloudRippleBurst = ({ fx }: { fx: ActiveEffect }) => {
  const groupRef = useRef<Group>(null);
  const smokeRef = useRef<Points>(null);
  const sparkRef = useRef<Points>(null);
  const glowRef = useRef<Mesh>(null);
  const ringRefs = useRef<(Mesh | null)[]>([]);
  const smokeCount = Math.max(12, Math.min(320, Math.round(fx.particleCount ?? fx.repeat ?? 170)));
  const sparkCount = Math.max(8, Math.round(smokeCount * 0.52));
  const ringCount = Math.max(1, Math.min(10, Math.round(fx.ringCount ?? 5)));
  const vectors = useMemo(() => makeBurstVectors(smokeCount, sparkCount), [smokeCount, sparkCount]);
  const smokePositions = useMemo(() => new Float32Array(smokeCount * 3), [smokeCount]);
  const sparkPositions = useMemo(() => new Float32Array(sparkCount * 3), [sparkCount]);
  const tex = useMemo(() => makeSoftTexture(), []);
  const cloudTint = useMemo(() => new Color(fx.color ?? '#ffffff'), [fx.color]);
  const rippleTint = useMemo(() => new Color(fx.color ?? '#dbeafe'), [fx.color]);
  useEffect(() => () => tex.dispose(), [tex]);

  useFrame(() => {
    const live = liveEffect(fx);
    const group = groupRef.current;
    if (group) group.position.set(...effectPos(live));
    const duration = Math.max(0.2, live.duration);
    const t = Math.max(0, live.localTime);
    const k = Math.max(0, Math.min(1, t / duration));
    const radius = Math.max(0.5, live.scale ?? 7.5);
    const intensity = live.intensity ?? 1;
    const smokeAttr = smokeRef.current?.geometry.attributes.position as BufferAttribute | undefined;
    const sparkAttr = sparkRef.current?.geometry.attributes.position as BufferAttribute | undefined;
    const smokeArr = smokeAttr?.array as Float32Array | undefined;
    const sparkArr = sparkAttr?.array as Float32Array | undefined;
    if (smokeArr && smokeAttr) {
      for (let i = 0; i < smokeCount * 3; i += 1) {
        smokeArr[i] = vectors.smokeStart[i] + vectors.smokeVel[i] * t * (1 - k * 0.45);
      }
      smokeAttr.needsUpdate = true;
    }
    if (sparkArr && sparkAttr) {
      for (let i = 0; i < sparkCount; i += 1) {
        const ii = i * 3;
        sparkArr[ii] = vectors.sparkStart[ii] + vectors.sparkVel[ii] * t;
        sparkArr[ii + 1] = Math.max(0.05, vectors.sparkStart[ii + 1] + vectors.sparkVel[ii + 1] * t - 4.5 * t * t);
        sparkArr[ii + 2] = vectors.sparkStart[ii + 2] + vectors.sparkVel[ii + 2] * t;
      }
      sparkAttr.needsUpdate = true;
    }
    const smokeMat = smokeRef.current?.material as PointsMaterial | undefined;
    if (smokeMat) {
      smokeMat.color.copy(cloudTint);
      smokeMat.opacity = Math.max(0, Math.sin(k * Math.PI)) * 0.86 * intensity;
      smokeMat.size = 1.5 + k * 4.2;
    }
    const sparkMat = sparkRef.current?.material as PointsMaterial | undefined;
    if (sparkMat) {
      sparkMat.color.copy(cloudTint);
      sparkMat.opacity = Math.max(0, 1 - k * 1.2) * intensity;
    }
    const glowMat = glowRef.current?.material as MeshBasicMaterial | undefined;
    if (glowRef.current && glowMat) {
      const glowLife = Math.min(1, k / 0.45);
      glowRef.current.scale.setScalar((0.8 + glowLife * 3.2) * Math.max(0.2, radius / 7.5));
      glowMat.color.copy(cloudTint);
      glowMat.opacity = Math.max(0, 1 - glowLife) * 0.75 * intensity;
    }
    ringRefs.current.forEach((ring, i) => {
      if (!ring) return;
      const rt = k - i * 0.13;
      const mat = ring.material as MeshBasicMaterial;
      mat.color.copy(rippleTint);
      if (rt < 0 || rt > 1) {
        mat.opacity = 0;
        return;
      }
      const ringRadius = 0.4 + rt * radius;
      ring.scale.set(ringRadius, ringRadius, ringRadius);
      mat.opacity = (1 - rt) * 0.72 * intensity;
    });
  });

  return (
    <group ref={groupRef} position={effectPos(fx)}>
      <points ref={smokeRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[smokePositions, 3]} count={smokeCount} />
        </bufferGeometry>
        <pointsMaterial map={tex} color="#ffffff" size={1.8} transparent opacity={0} depthWrite={false} sizeAttenuation />
      </points>
      <points ref={sparkRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[sparkPositions, 3]} count={sparkCount} />
        </bufferGeometry>
        <pointsMaterial map={tex} color="#ffffff" size={0.9} transparent opacity={0} depthWrite={false} blending={AdditiveBlending} sizeAttenuation />
      </points>
      <mesh ref={glowRef} position={[0, 1, 0]}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0} depthWrite={false} blending={AdditiveBlending} />
      </mesh>
      {Array.from({ length: ringCount }).map((_, i) => (
        <mesh key={i} ref={(el) => { ringRefs.current[i] = el; }} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
          <ringGeometry args={[0.82, 1, 48]} />
          <meshBasicMaterial color="#dbeafe" transparent opacity={0} depthWrite={false} blending={AdditiveBlending} />
        </mesh>
      ))}
    </group>
  );
};

function cloneGhostMaterial(material: Material): Material {
  const cloned = material.clone();
  cloned.transparent = true;
  cloned.opacity = 0.62;
  cloned.depthWrite = false;
  cloned.depthTest = false;
  cloned.side = DoubleSide;
  cloned.needsUpdate = true;
  return cloned;
}

function cloneGhostMaterials(material: Mesh['material'], owned: Material[]): Mesh['material'] {
  if (Array.isArray(material)) {
    return material.map((entry) => {
      const cloned = cloneGhostMaterial(entry);
      owned.push(cloned);
      return cloned;
    });
  }
  const cloned = cloneGhostMaterial(material);
  owned.push(cloned);
  return cloned;
}

interface GhostCloneObject {
  object: Object3D;
  materials: Material[];
}

class GhostCloneBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  constructor(props: { fallback: ReactNode; children: ReactNode }) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? <>{this.props.fallback}</> : this.props.children;
  }
}

// One translucent clone of the character's rendered GLB actor. It preserves original textures/colours and
// only changes material visibility rules, so the copy still reads as the same character.
const GhostModelClone = ({
  path,
  position,
  rotation,
  scale,
  opacityRef,
}: {
  path: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  opacityRef: { current: number };
}) => {
  const groupRef = useRef<Group>(null);
  const { scene } = useGLTF(encodeURI(path));
  const cloned = useMemo(() => {
    const owned: Material[] = [];
    const c = SkeletonUtils.clone(scene);
    c.traverse((o) => {
      const m = o as Mesh;
      if (m.isMesh) {
        m.material = cloneGhostMaterials(m.material, owned);
        m.castShadow = false;
        m.receiveShadow = false;
        m.renderOrder = 60;
      }
    });
    return { object: c, materials: owned } satisfies GhostCloneObject;
  }, [scene]);
  useEffect(() => {
    return () => {
      cloned.materials.forEach((material) => material.dispose());
    };
  }, [cloned]);
  useFrame(() => {
    groupRef.current?.traverse((o) => {
      const mesh = o as Mesh;
      if (!mesh.isMesh) return;
      const material = mesh.material;
      if (Array.isArray(material)) {
        material.forEach((entry) => { entry.opacity = opacityRef.current; });
      } else {
        material.opacity = opacityRef.current;
      }
    });
  });
  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      <primitive object={cloned.object} />
    </group>
  );
};

function resolveGhostActor(fx: ActiveEffect) {
  if (fx.modelRef && txFrame.ghostActors.activeRef?.modelId === fx.modelRef) return txFrame.ghostActors.activeRef;
  if (fx.modelSlot) return txFrame.ghostActors[fx.modelSlot] ?? txFrame.ghostActors.robot;
  return txFrame.ghostActors.activeRef ?? txFrame.ghostActors.robot ?? txFrame.ghostActors.shared ?? txFrame.ghostActors.plane;
}

function fallbackGhostModelId(fx: ActiveEffect): string | undefined {
  if (fx.modelRef) return fx.modelRef;
  if (fx.modelSlot === 'plane') return txFrame.def?.planeModelRef;
  if (fx.modelSlot === 'shared') return txFrame.def?.sharedModelRef;
  return txFrame.def?.robotModelRef ?? txFrame.charModelId;
}

function ghostSourceModelId(fx: ActiveEffect): string | undefined {
  return resolveGhostActor(fx)?.modelId ?? fallbackGhostModelId(fx);
}

function ghostTint(fx: ActiveEffect): string {
  return fx.color ?? txFrame.def?.particleColor ?? '#7fd0ff';
}

function makeStarVectors(count: number): Float32Array {
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const a = seeded01(i * 11 + 1) * Math.PI * 2;
    const y = -0.25 + seeded01(i * 11 + 2) * 1.35;
    const r = 0.55 + seeded01(i * 11 + 3) * 0.45;
    out[i * 3] = Math.cos(a) * r;
    out[i * 3 + 1] = y;
    out[i * 3 + 2] = Math.sin(a) * r;
  }
  return out;
}

// The hero shot — exactly one semi-transparent copy of the current actor starts fully overlapped with the
// visible model, expands in place from that centre, then fades near the boundary. A star burst sells the
// impact without spawning extra body-shaped clones.
const GhostBurst = ({ fx }: { fx: ActiveEffect }) => {
  const overlayRef = useRef<Group>(null);
  const starRef = useRef<Points>(null);
  const glowRef = useRef<Mesh>(null);
  const cloneOpacityRef = useRef(0.48);
  const starCount = Math.max(12, Math.min(160, Math.round(fx.repeat ?? fx.particleCount ?? 54)));
  const starVectors = useMemo(() => makeStarVectors(starCount), [starCount]);
  const starPositions = useMemo(() => new Float32Array(starCount * 3), [starCount]);
  const starTexture = useMemo(() => makeSoftTexture(), []);
  useEffect(() => () => { starTexture.dispose(); }, [starTexture]);
  // Resolve the overlay model ONCE (stable) — re-resolving + setState in useFrame remounted the GLB clone every
  // frame (key={sourceModelId}), which re-suspended useGLTF and stalled/flickered the whole effect.
  const sourceModelId = useMemo(() => ghostSourceModelId(fx), [fx]);
  const asset = resolveModelAsset(sourceModelId);

  useFrame(() => {
    const live = liveEffect(fx);
    const liveActor = resolveGhostActor(live);
    const nextModelId = liveActor?.modelId ?? fallbackGhostModelId(live);
    const k = Math.max(0, Math.min(1, live.progress));
    const grow = 1 - (1 - k) * (1 - k) * (1 - k);
    const maxScale = Math.max(1, live.scale ?? 14);
    const fadeStart = live.ghostPersist === false ? 0.72 : 0.82;
    const fade = k < fadeStart ? 1 : Math.max(0, 1 - (k - fadeStart) / (1 - fadeStart));
    const intensity = live.intensity ?? 1;
    const overlay = overlayRef.current;
    const offset = live.spawnOffset ?? [0, 0, 0];
    const actorPosition: [number, number, number] | undefined = liveActor
      ? [liveActor.position[0] + offset[0], liveActor.position[1] + offset[1], liveActor.position[2] + offset[2]]
      : undefined;
    if (overlay && liveActor) {
      overlay.visible = true;
      overlay.renderOrder = 60;
      overlay.position.set(...(actorPosition ?? liveActor.position));
      overlay.quaternion.set(...liveActor.quaternion);
      overlay.scale.set(
        liveActor.scale[0] * (1 + grow * (maxScale - 1)),
        liveActor.scale[1] * (1 + grow * (maxScale - 1)),
        liveActor.scale[2] * (1 + grow * (maxScale - 1)),
      );
      cloneOpacityRef.current = Math.max(0, Math.min(0.68, 0.62 * fade * intensity));
    } else if (overlay && (asset || nextModelId)) {
      overlay.visible = true;
      overlay.renderOrder = 60;
      overlay.position.set(...effectPos(live));
      overlay.rotation.set(0, 0, 0);
      overlay.scale.setScalar(txFrame.ghostScale * (1 + grow * (maxScale - 1)));
      cloneOpacityRef.current = Math.max(0, Math.min(0.68, 0.62 * fade * intensity));
    } else if (overlay) {
      overlay.visible = true;
      overlay.position.set(...effectPos(live));
      overlay.rotation.set(0, 0, 0);
      overlay.scale.setScalar(1 + grow * (maxScale - 1));
      cloneOpacityRef.current = Math.max(0, Math.min(0.68, 0.62 * fade * intensity));
    }
    const glowMat = glowRef.current?.material as MeshBasicMaterial | undefined;
    if (glowMat) {
      glowMat.color.set(ghostTint(live));
      glowMat.opacity = 0.14 * fade * intensity;
    }
    const starAttr = starRef.current?.geometry.attributes.position as BufferAttribute | undefined;
    const starArr = starAttr?.array as Float32Array | undefined;
    if (starRef.current) {
      const p = actorPosition ?? effectPos(live);
      starRef.current.position.set(...p);
    }
    const radius = live.ghostSpread ?? 12;
    if (starArr && starAttr) {
      const starGrow = Math.sin(Math.min(1, k / 0.85) * Math.PI * 0.5);
      for (let i = 0; i < starCount; i += 1) {
        const ii = i * 3;
        starArr[ii] = starVectors[ii] * radius * starGrow;
        starArr[ii + 1] = 0.9 + starVectors[ii + 1] * radius * 0.18 * starGrow + Math.sin(k * Math.PI) * 0.8;
        starArr[ii + 2] = starVectors[ii + 2] * radius * starGrow;
      }
      starAttr.needsUpdate = true;
    }
    const starMat = starRef.current?.material as PointsMaterial | undefined;
    if (starMat) {
      starMat.color.set(ghostTint(live));
      starMat.depthTest = false;
      starMat.opacity = Math.max(0, 1 - k) * intensity;
      starMat.size = 0.34 + k * 0.55;
    }
  }, 10);

  const fallback = (
    <group>
      <mesh>
        <capsuleGeometry args={[0.45, 0.9, 4, 16]} />
        <meshBasicMaterial color={ghostTint(fx)} toneMapped={false} transparent opacity={0.7} depthWrite={false} depthTest={false} side={DoubleSide} blending={AdditiveBlending} />
      </mesh>
      <mesh position={[0, 0.45, 0]}>
        <sphereGeometry args={[0.72, 24, 16]} />
        <meshBasicMaterial color={ghostTint(fx)} toneMapped={false} transparent opacity={0.18} depthWrite={false} depthTest={false} side={DoubleSide} blending={AdditiveBlending} />
      </mesh>
    </group>
  );
  return (
    <group>
      <group ref={overlayRef} visible={false}>
        {asset?.path ? (
          <GhostCloneBoundary key={sourceModelId} fallback={fallback}>
            <Suspense fallback={fallback}>
              <GhostModelClone path={asset.path} position={asset.position} rotation={asset.rotation} scale={asset.scale} opacityRef={cloneOpacityRef} />
            </Suspense>
          </GhostCloneBoundary>
        ) : (
          fallback
        )}
        <mesh ref={glowRef} position={[0, 0.9, 0]} renderOrder={59}>
          <sphereGeometry args={[1.05, 24, 16]} />
          <meshBasicMaterial color={ghostTint(fx)} toneMapped={false} transparent opacity={0.14} depthWrite={false} depthTest={false} side={DoubleSide} blending={AdditiveBlending} />
        </mesh>
      </group>
      <points ref={starRef} position={effectPos(fx)}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[starPositions, 3]} count={starCount} />
        </bufferGeometry>
        <pointsMaterial map={starTexture} color={ghostTint(fx)} size={0.5} transparent opacity={0} depthWrite={false} depthTest={false} blending={AdditiveBlending} sizeAttenuation />
      </points>
    </group>
  );
};

const ParticleBurst = ({ fx }: { fx: ActiveEffect }) => {
  const g = useRef<Group>(null);
  const count = Math.max(6, Math.round(fx.repeat ?? 12));
  useFrame(() => {
    const live = liveEffect(fx);
    const grp = g.current;
    if (!grp) return;
    grp.position.set(...effectPos(live));
    for (let i = 0; i < grp.children.length; i += 1) {
      const child = grp.children[i];
      const a = (i / count) * Math.PI * 2;
      const r = live.progress * (live.scale ?? 1.8);
      child.position.set(Math.cos(a) * r, Math.sin(a * 2) * r * 0.35, Math.sin(a) * r);
      const mesh = child as Mesh;
      if (mesh.isMesh) (mesh.material as MeshBasicMaterial).opacity = Math.max(0, 1 - live.progress);
    }
  });
  return (
    <group ref={g} position={effectPos(fx)}>
      {Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2;
        const live = liveEffect(fx);
        const r = live.progress * (live.scale ?? 1.8);
        return (
          <mesh key={i} position={[Math.cos(a) * r, Math.sin(a * 2) * r * 0.35, Math.sin(a) * r]}>
            <sphereGeometry args={[0.07, 8, 8]} />
            <meshBasicMaterial color={fx.color ?? '#ffffff'} toneMapped={false} transparent opacity={Math.max(0, 1 - fx.progress)} />
          </mesh>
        );
      })}
    </group>
  );
};

const EffectViz = ({ fx }: { fx: ActiveEffect }) => {
  switch (fx.type) {
    case 'particle-burst':
    case 'thruster-flare':
    case 'outline':
      return <ParticleBurst fx={fx} />;
    case 'energy-ring': return <EnergyRing fx={fx} />;
    case 'white-flash': return <WhiteFlash fx={fx} />;
    case 'sparkle': return <Sparkle fx={fx} />;
    case 'ghost-burst': return <GhostBurst fx={fx} />;
    case 'cloud-ripple-burst': return <CloudRippleBurst fx={fx} />;
    case 'speed-line-burst': return null; // handled by the backdrop
    default: return <GlowPulse fx={fx} />; // glow-pulse / particle-burst / thruster-flare / outline
  }
};

export const TransformationEffects = () => {
  useTxVersion((s) => s.v); // re-render only when the active-effect set changes (director bumps it)
  const active = txFrame.snapshot?.activeEffects ?? [];
  return (
    <>
      {active.map((fx) => (
        <EffectViz key={fx.id} fx={fx} />
      ))}
    </>
  );
};
