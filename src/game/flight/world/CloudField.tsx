import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Object3D, type InstancedMesh, type Mesh } from 'three';
import { flightHandle } from '../flightHandle';
import { useEditorFlightStore } from '../../../stores/game/editorFlightStore';
import { useEditorRouteStore } from '../../../stores/game/editorRouteStore';
import { useFlightPreviewStore } from '../../../stores/game/flightPreviewStore';
import { getActiveRoute } from './worldRoute';

// Recycled cloud carpet — a FIXED instanced pool of big soft puffs forming a dense floor WELL BELOW the
// craft, plus a wide soft backing deck, so the craft cruises through open blue sky over a thick carpet of
// cloud that fills the view below. Puffs that fall behind are repositioned ahead (chunk recycling) → flat
// object count for unlimited flight. Count editable (🛩 Flight → World cloud count). No per-frame allocs.
const MAX_CLOUDS = 700;
const AHEAD = 720; // carpet extends far ahead
const SPAWN_MIN = 60;
const LATERAL = 700; // very wide → covers a large area to both sides (a full carpet)
const DROP_MIN = 70; // top of the carpet, below the craft (clear gap → sky + craft visible)
const DROP_RANGE = 90; // carpet depth
const BEHIND = 90;
const DECK_DROP = 120; // soft backing deck below the puffs

const _dummy = new Object3D();
const _fwd = new Vector3();
const _rel = new Vector3();
const POS: Vector3[] = Array.from({ length: MAX_CLOUDS }, () => new Vector3());
const SCALE = new Float32Array(MAX_CLOUDS);

let SCALE_MUL = 2; // editable cloud-size multiplier (worldCloudScale)

// Place puff i ahead of the craft along `fwd`, spread wide to the sides and dropped into the cloud carpet.
function place(i: number, ahead: number): void {
  const lat = (Math.random() * 2 - 1) * LATERAL;
  const p = POS[i];
  p.copy(flightHandle.pos).addScaledVector(_fwd, ahead);
  p.x += -_fwd.z * lat;
  p.z += _fwd.x * lat;
  p.y = flightHandle.pos.y - (DROP_MIN + Math.random() * DROP_RANGE);
  SCALE[i] = (14 + Math.random() * 28) * SCALE_MUL; // big puffs → continuous carpet
}

const CloudFieldInner = ({ count, scale }: { count: number; scale: number }) => {
  const mesh = useRef<InstancedMesh>(null);
  const deck = useRef<Mesh>(null);

  useEffect(() => {
    SCALE_MUL = scale;
    _fwd.set(0, 0, -1).applyQuaternion(flightHandle.quat);
    for (let i = 0; i < count; i++) place(i, (Math.random() * 2 - 1) * AHEAD);
  }, [count, scale]);

  useFrame(() => {
    const m = mesh.current;
    if (!m) return;
    SCALE_MUL = scale;
    _fwd.set(0, 0, -1).applyQuaternion(flightHandle.quat);
    for (let i = 0; i < count; i++) {
      _rel.copy(POS[i]).sub(flightHandle.pos);
      if (_rel.dot(_fwd) < -BEHIND || _rel.length() > AHEAD + 300) place(i, SPAWN_MIN + Math.random() * AHEAD);
      _dummy.position.copy(POS[i]);
      _dummy.scale.setScalar(SCALE[i]);
      _dummy.updateMatrix();
      m.setMatrixAt(i, _dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
    if (deck.current) deck.current.position.set(flightHandle.pos.x, flightHandle.pos.y - DECK_DROP, flightHandle.pos.z);
  });

  return (
    <>
      {/* wide soft backing deck so the carpet reads as continuous (no sky showing through far below) */}
      <mesh ref={deck} rotation={[-Math.PI / 2, 0, 0]} frustumCulled={false}>
        <planeGeometry args={[6000, 6000]} />
        <meshStandardMaterial color="#eef4fb" transparent opacity={0.6} depthWrite={false} roughness={1} />
      </mesh>
      <instancedMesh ref={mesh} args={[undefined, undefined, count]} frustumCulled={false}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.85} depthWrite={false} roughness={1} flatShading />
      </instancedMesh>
    </>
  );
};

export const CloudField = () => {
  useEditorRouteStore((s) => s.items); // reactive: 🌦 cloud-density edits re-resolve the count
  const base = useEditorFlightStore((s) => s.tuning.worldCloudCount);
  const scale = useEditorFlightStore((s) => Math.max(0.25, s.tuning.worldCloudScale));
  const cueHint = useFlightPreviewStore((s) => s.activeEnv?.cloudHint); // environment cue cloud intent (0..1)
  const density = getActiveRoute()?.editorEnvironment?.cloudDensity ?? 1;
  // A cue's cloud intent scales the count (0 → sparse 0.2×, 1 → heavy ~1.9×) so weather changes along the route.
  const cueMul = cueHint != null ? 0.2 + cueHint * 1.7 : 1;
  const count = Math.min(MAX_CLOUDS, Math.max(8, Math.round(base * density * cueMul)));
  // Key by count+scale so changing either (Flight tab / route density) rebuilds the instanced pool cleanly.
  return <CloudFieldInner key={`${count}-${scale}`} count={count} scale={scale} />;
};
