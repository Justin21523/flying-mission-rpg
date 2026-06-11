import { useRef, type ReactElement, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group, Mesh, MeshStandardMaterial } from 'three';
import { AnimatedGlbModel } from '../../world/AnimatedGlbModel';
import type { FlightEventDef, FlightEventKind, FlightEventMotion } from '../../../types/game/flightEvent';

// Distinct, child-friendly 3D placeholders for every flight-event kind (PDF §批次5). All original
// primitives (no copyrighted art); each animates locally (spin / pulse / drift) and is fully driven by the
// editable FlightEventDef (color / size / driftSpeed / optional model). Shared by the live renderer
// (FlightEventRenderer) and the Edit-Mode gallery (FlightEventPreview) → edit/play parity.

// ── cloud hole: a ring opening framed by puffs ──
const CloudHoleViz = ({ color, size }: { color: string; size: number }) => {
  const g = useRef<Group>(null);
  useFrame((_, dt) => { if (g.current) g.current.rotation.z += dt * 0.2; });
  return (
    <group ref={g} scale={size}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1, 0.18, 8, 28]} />
        <meshStandardMaterial color={color} transparent opacity={0.9} />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 1.05, Math.sin(a) * 1.05, 0]}>
            <icosahedronGeometry args={[0.4, 0]} />
            <meshStandardMaterial color="#f1f5f9" flatShading transparent opacity={0.85} />
          </mesh>
        );
      })}
    </group>
  );
};

// ── crosswind: angled wind streaks that sway ──
const CrosswindViz = ({ color, size }: { color: string; size: number }) => {
  const g = useRef<Group>(null);
  useFrame((s) => { if (g.current) g.current.position.x = Math.sin(s.clock.elapsedTime * 2) * 0.6 * size; });
  return (
    <group ref={g} scale={size}>
      {[-1.2, -0.4, 0.4, 1.2].map((y, i) => (
        <mesh key={i} position={[0, y, 0]} rotation={[0, 0, 0.25]}>
          <boxGeometry args={[5.5, 0.1, 0.1]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} transparent opacity={0.7} />
        </mesh>
      ))}
    </group>
  );
};

// ── updraft: a translucent column with rising motes ──
const UpdraftViz = ({ color, size }: { color: string; size: number }) => {
  const motes = useRef<Group>(null);
  useFrame((_, dt) => {
    if (!motes.current) return;
    motes.current.position.y += dt * 6;
    if (motes.current.position.y > 10) motes.current.position.y = -10;
  });
  return (
    <group scale={size}>
      <mesh>
        <cylinderGeometry args={[1, 1.2, 22, 14, 1, true]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} transparent opacity={0.28} side={2} />
      </mesh>
      <group ref={motes}>
        {[-6, -2, 2, 6].map((y, i) => (
          <mesh key={i} position={[Math.sin(i) * 0.5, y, Math.cos(i) * 0.5]}>
            <coneGeometry args={[0.3, 0.8, 6]} />
            <meshStandardMaterial color="#bbf7d0" emissive="#86efac" emissiveIntensity={0.7} />
          </mesh>
        ))}
      </group>
    </group>
  );
};

// ── storm cell: a dark cloud cluster ──
const StormViz = ({ color, size }: { color: string; size: number }) => {
  const g = useRef<Group>(null);
  useFrame((s) => { if (g.current) g.current.rotation.y = Math.sin(s.clock.elapsedTime) * 0.1; });
  return (
    <group ref={g} scale={size}>
      {[[0, 0, 0], [0.9, 0.3, 0.4], [-0.9, 0.2, -0.3], [0.4, -0.3, -0.8], [-0.5, -0.2, 0.7]].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]}>
          <icosahedronGeometry args={[0.9, 0]} />
          <meshStandardMaterial color={color} flatShading roughness={1} />
        </mesh>
      ))}
    </group>
  );
};

// ── lightning warning: a bright zig-zag bolt + flashing glow ──
const LightningViz = ({ color, size }: { color: string; size: number }) => {
  const mat = useRef<MeshStandardMaterial>(null);
  useFrame((s) => {
    if (mat.current) mat.current.emissiveIntensity = Math.sin(s.clock.elapsedTime * 14) > 0.4 ? 2.2 : 0.2;
  });
  const segs: [number, number][] = [[0, 2], [0.5, 1], [-0.4, 0], [0.4, -1], [0, -2]];
  return (
    <group scale={size}>
      {segs.slice(0, -1).map(([x, y], i) => {
        const [nx, ny] = segs[i + 1];
        const mx = (x + nx) / 2, my = (y + ny) / 2;
        const ang = Math.atan2(ny - y, nx - x);
        const len = Math.hypot(nx - x, ny - y);
        return (
          <mesh key={i} position={[mx, my, 0]} rotation={[0, 0, ang]}>
            <boxGeometry args={[len, 0.18, 0.18]} />
            <meshStandardMaterial ref={i === 0 ? mat : undefined} color={color} emissive={color} emissiveIntensity={1.6} />
          </mesh>
        );
      })}
    </group>
  );
};

// ── rainbow: a big multi-band arc ──
const RAINBOW = ['#f87171', '#fb923c', '#fde047', '#86efac', '#60a5fa'];
const RainbowViz = ({ size }: { color: string; size: number }) => (
  <group scale={size}>
    {RAINBOW.map((c, i) => (
      <mesh key={i} rotation={[0, 0, 0]}>
        <torusGeometry args={[1 + i * 0.18, 0.08, 8, 40, Math.PI]} />
        <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.5} transparent opacity={0.85} />
      </mesh>
    ))}
  </group>
);

// ── bird flock placeholder: chevrons that bob + drift ──
const Chevron = ({ color }: { color: string }) => (
  <group>
    <mesh rotation={[0, 0, 0.5]} position={[-0.25, 0, 0]}><boxGeometry args={[0.7, 0.08, 0.08]} /><meshStandardMaterial color={color} /></mesh>
    <mesh rotation={[0, 0, -0.5]} position={[0.25, 0, 0]}><boxGeometry args={[0.7, 0.08, 0.08]} /><meshStandardMaterial color={color} /></mesh>
  </group>
);
const BirdsViz = ({ color, size }: { color: string; size: number }) => {
  const g = useRef<Group>(null);
  useFrame((s) => {
    if (!g.current) return;
    g.current.children.forEach((c, i) => { c.position.y = Math.sin(s.clock.elapsedTime * 6 + i) * 0.2; });
  });
  return (
    <group ref={g} scale={size}>
      {[[0, 0, 0], [1, 0.4, 0.6], [-1, 0.4, 0.6], [2, 0.8, 1.2], [-2, 0.8, 1.2]].map((p, i) => (
        <group key={i} position={p as [number, number, number]}><Chevron color={color} /></group>
      ))}
    </group>
  );
};

// ── energy refill: glowing orb + spinning ring + plus ──
const EnergyViz = ({ color, size }: { color: string; size: number }) => {
  const ring = useRef<Mesh>(null);
  const mat = useRef<MeshStandardMaterial>(null);
  useFrame((s, dt) => {
    if (ring.current) ring.current.rotation.z += dt * 2;
    if (mat.current) mat.current.emissiveIntensity = 0.8 + Math.sin(s.clock.elapsedTime * 5) * 0.6;
  });
  return (
    <group scale={size}>
      <mesh><icosahedronGeometry args={[0.9, 1]} /><meshStandardMaterial ref={mat} color={color} emissive={color} emissiveIntensity={1} /></mesh>
      <mesh ref={ring} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1.4, 0.08, 8, 32]} /><meshStandardMaterial color="#ecfdf5" emissive={color} emissiveIntensity={0.8} /></mesh>
      <mesh position={[0, 0, 0.95]}><boxGeometry args={[0.7, 0.18, 0.05]} /><meshStandardMaterial color="#ffffff" /></mesh>
      <mesh position={[0, 0, 0.95]}><boxGeometry args={[0.18, 0.7, 0.05]} /><meshStandardMaterial color="#ffffff" /></mesh>
    </group>
  );
};

// ── stunt ring: a bright ring to fly through ──
const StuntRingViz = ({ color, size }: { color: string; size: number }) => {
  const g = useRef<Group>(null);
  useFrame((_, dt) => { if (g.current) g.current.rotation.z += dt * 1.2; });
  return (
    <group ref={g} scale={size}>
      <mesh><torusGeometry args={[1.4, 0.16, 12, 40]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.1} /></mesh>
    </group>
  );
};

// ── collectible star ──
const CollectibleViz = ({ color, size }: { color: string; size: number }) => {
  const g = useRef<Group>(null);
  useFrame((s, dt) => {
    if (!g.current) return;
    g.current.rotation.y += dt * 2.5;
    g.current.position.y = Math.sin(s.clock.elapsedTime * 3) * 0.2;
  });
  return (
    <group ref={g} scale={size}>
      <mesh rotation={[0, 0, 0]}><octahedronGeometry args={[0.7, 0]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.2} /></mesh>
      <mesh rotation={[0, 0, Math.PI / 4]}><boxGeometry args={[1.3, 0.18, 0.18]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.9} /></mesh>
    </group>
  );
};

// ── radio call: antenna with expanding broadcast rings ──
const RadioViz = ({ color, size }: { color: string; size: number }) => {
  const r1 = useRef<Mesh>(null);
  const r2 = useRef<Mesh>(null);
  useFrame((s) => {
    const t = (s.clock.elapsedTime % 1.4) / 1.4;
    if (r1.current) { r1.current.scale.setScalar(0.2 + t * 1.8); (r1.current.material as MeshStandardMaterial).opacity = 1 - t; }
    const t2 = ((s.clock.elapsedTime + 0.7) % 1.4) / 1.4;
    if (r2.current) { r2.current.scale.setScalar(0.2 + t2 * 1.8); (r2.current.material as MeshStandardMaterial).opacity = 1 - t2; }
  });
  return (
    <group scale={size}>
      <mesh position={[0, 0.6, 0]}><cylinderGeometry args={[0.06, 0.06, 1.4, 6]} /><meshStandardMaterial color="#cbd5e1" /></mesh>
      <mesh position={[0, 1.4, 0]}><sphereGeometry args={[0.2, 10, 10]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.2} /></mesh>
      <mesh ref={r1} position={[0, 1.4, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1, 0.05, 6, 28]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} transparent /></mesh>
      <mesh ref={r2} position={[0, 1.4, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1, 0.05, 6, 28]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} transparent /></mesh>
    </group>
  );
};

// ── formation flight placeholder: little craft in a V ──
const FormationViz = ({ color, size }: { color: string; size: number }) => {
  const g = useRef<Group>(null);
  useFrame((s) => {
    if (!g.current) return;
    g.current.position.y = Math.sin(s.clock.elapsedTime * 2) * 0.15;
  });
  return (
    <group ref={g} scale={size}>
      {[[0, 0, 0], [0.9, 0, 0.9], [-0.9, 0, 0.9], [1.8, 0, 1.8], [-1.8, 0, 1.8]].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.3, 1, 6]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
        </mesh>
      ))}
    </group>
  );
};

// ── route branch: a Y-fork with diverging arrows ──
const BranchViz = ({ color, size }: { color: string; size: number }) => (
  <group scale={size}>
    <mesh position={[0, -1, 0]}><boxGeometry args={[0.2, 2, 0.2]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} /></mesh>
    {[0.7, -0.7].map((s, i) => (
      <group key={i} rotation={[0, 0, s]}>
        <mesh position={[s, 0.9, 0]}><boxGeometry args={[0.2, 1.6, 0.2]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} /></mesh>
        <mesh position={[s * 1.6, 1.7, 0]} rotation={[0, 0, -s]}><coneGeometry args={[0.3, 0.7, 6]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} /></mesh>
      </group>
    ))}
  </group>
);

const FALLBACK = (color: string, size: number) => (
  <mesh scale={size}><icosahedronGeometry args={[0.8, 1]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} /></mesh>
);

// Optional GLB placeholder model (e.g. real bird / craft assets) — overrides the primitive when set.
const ModelViz = ({ def }: { def: FlightEventDef }) => (
  <group scale={def.size}>
    <AnimatedGlbModel assetId={def.modelAssetId!} fallback={FALLBACK(def.color, 1)} noCull />
  </group>
);

// Whole-event motion (travel) — applied uniformly over any visual/model so the editable `motion` + speed
// drive how the event moves (the per-kind components keep their own in-place "alive" animation).
const MotionGroup = ({ motion, speed, children }: { motion: FlightEventMotion; speed: number; children: ReactNode }) => {
  const g = useRef<Group>(null);
  useFrame((s, dt) => {
    const grp = g.current;
    if (!grp) return;
    if (motion === 'drift') grp.position.x -= speed * dt;
    else if (motion === 'bob') grp.position.y = Math.sin(s.clock.elapsedTime * 2) * speed * 0.12;
    else if (motion === 'orbit') {
      const t = s.clock.elapsedTime;
      grp.position.x = Math.cos(t) * speed * 0.2;
      grp.position.z = Math.sin(t) * speed * 0.2;
    }
  });
  return <group ref={g}>{children}</group>;
};

export const FlightEventVisual = ({ def }: { def: FlightEventDef }) => {
  const { color, size } = def;
  const byKind: Record<FlightEventKind, ReactElement> = {
    cloud_hole: <CloudHoleViz color={color} size={size} />,
    crosswind: <CrosswindViz color={color} size={size} />,
    updraft: <UpdraftViz color={color} size={size} />,
    storm: <StormViz color={color} size={size} />,
    lightning: <LightningViz color={color} size={size} />,
    rainbow: <RainbowViz color={color} size={size} />,
    birds: <BirdsViz color={color} size={size} />,
    energy_refill: <EnergyViz color={color} size={size} />,
    stunt_ring: <StuntRingViz color={color} size={size} />,
    collectible: <CollectibleViz color={color} size={size} />,
    radio: <RadioViz color={color} size={size} />,
    formation: <FormationViz color={color} size={size} />,
    branch: <BranchViz color={color} size={size} />,
    boost: <EnergyViz color={color} size={size} />,
  };
  const inner = def.modelAssetId ? <ModelViz def={def} /> : byKind[def.kind] ?? FALLBACK(color, size);
  const speed = def.driftSpeed ?? 5;
  const motion: FlightEventMotion = def.motion ?? ((def.driftSpeed ?? 0) > 0 ? 'drift' : 'static');
  return (
    <MotionGroup motion={motion} speed={speed}>
      {inner}
      {def.glow && def.glow > 0 && <pointLight color={color} intensity={def.glow} distance={size * 12} />}
    </MotionGroup>
  );
};
