import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CanvasTexture, SRGBColorSpace, type MeshStandardMaterial } from 'three';

// Shared lift-platform deck — used by BOTH the Edit-Mode layer and the Play-mode LiftPlatform so the
// platform is identical in edit and play (hazard-striped deck + pulsing warning ring + corner posts). The
// pulse runs from its own useFrame, so it animates in both modes (edit/play parity).
function makeHazard(): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#caa53a';
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = '#1b1b1b';
  ctx.lineWidth = 16;
  for (let i = -128; i < 256; i += 40) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 128, 128);
    ctx.stroke();
  }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

export const LiftDeck = ({ size, color }: { size: [number, number, number]; color: string }) => {
  const r = Math.max(size[0], size[2]) / 2;
  const sy = size[1];
  const tex = useMemo(() => makeHazard(), []);
  const ringMat = useRef<MeshStandardMaterial>(null);
  useFrame((state) => {
    if (ringMat.current) ringMat.current.emissiveIntensity = 0.6 + Math.abs(Math.sin(state.clock.elapsedTime * 4)) * 1.0;
  });

  return (
    <group>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[r, r, sy, 40]} />
        <meshStandardMaterial map={tex} metalness={0.2} roughness={0.7} />
      </mesh>
      <mesh position={[0, sy / 2 + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[r - 0.12, 0.1, 12, 48]} />
        <meshStandardMaterial ref={ringMat} color="#ff7a2c" emissive="#ff5a1c" emissiveIntensity={0.9} />
      </mesh>
      {([[-1, -1], [1, -1], [-1, 1], [1, 1]] as const).map(([ax, az], i) => (
        <mesh key={i} position={[ax * (r - 0.3), 1.0, az * (r - 0.3)]} castShadow>
          <boxGeometry args={[0.18, 2.0, 0.18]} />
          <meshStandardMaterial color={color} metalness={0.5} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
};
