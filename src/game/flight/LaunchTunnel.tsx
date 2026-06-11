import { BackSide } from 'three';
import { getExteriorByKind } from '../../stores/game/editorExteriorStore';
import { useEditorFlightStore } from '../../stores/game/editorFlightStore';

// The launch tunnel — a lit corridor the craft auto-accelerates out of (LAUNCH_TUNNEL phase). Built from
// the editable flight-spawn marker (the exit). Length is editable (🛩 Flight → Launch tunnel length) so the
// visual matches the (editable) sprint distance. Emissive rings + exit door glow.
const RINGS = 12;

export const LaunchTunnel = () => {
  const sp = getExteriorByKind('flight_spawn');
  const p = sp ? sp.position : [0, 26, 60];
  const LEN = useEditorFlightStore((s) => Math.max(8, s.tuning.launchTunnelLength));
  const cz = p[2] + LEN / 2;

  return (
    <group>
      <mesh position={[p[0], p[1], cz]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[5, 5, LEN, 24, 1, true]} />
        <meshStandardMaterial color="#0c1018" side={BackSide} metalness={0.4} roughness={0.6} />
      </mesh>
      {Array.from({ length: RINGS }, (_, i) => p[2] + (i + 0.5) * (LEN / RINGS)).map((z, i) => (
        <mesh key={i} position={[p[0], p[1], z]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[4.6, 0.12, 8, 32]} />
          <meshStandardMaterial color="#5fd0ff" emissive="#5fd0ff" emissiveIntensity={2.2} />
        </mesh>
      ))}
      {/* exit door ring */}
      <mesh position={[p[0], p[1], p[2]]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[5, 0.4, 8, 32]} />
        <meshStandardMaterial color="#ff8a3c" emissive="#ff6a2c" emissiveIntensity={1.6} />
      </mesh>
    </group>
  );
};
