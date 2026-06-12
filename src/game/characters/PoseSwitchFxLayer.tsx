import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, type Mesh, type MeshBasicMaterial } from 'three';
import { onPoseSwitch, type PoseSwitchEvent } from './poseSwitchFx';
import { useAudioStore } from '../../stores/audioStore';
import { getAudioManager } from '../audio/AudioManager';

// Post-content — flashy burst when a character's pose/model is switched (energy ring + flash). A fixed pool
// (no per-frame allocation); driven from the poseSwitchFx event. Reduce-motion shrinks/shortens it. Mounted
// in the transformation + destination scenes. Also fires a small audio cue.
const POOL = 3;
const DURATION = 0.6;

interface Burst { active: boolean; start: number; x: number; y: number; z: number; color: string }

export const PoseSwitchFxLayer = () => {
  const rings = useRef<(Mesh | null)[]>([]);
  const flashes = useRef<(Mesh | null)[]>([]);
  const burstsRef = useRef<Burst[]>(Array.from({ length: POOL }, () => ({ active: false, start: 0, x: 0, y: 0, z: 0, color: '#7fd0ff' })));
  const reduceRef = useRef(false);

  useEffect(() => {
    reduceRef.current = useAudioStore.getState().reduceMotion;
    const offRM = useAudioStore.subscribe(() => { reduceRef.current = useAudioStore.getState().reduceMotion; });
    const off = onPoseSwitch((e: PoseSwitchEvent) => {
      const bursts = burstsRef.current;
      const slot = bursts.find((b) => !b.active) ?? bursts[0];
      slot.active = true;
      slot.start = (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;
      [slot.x, slot.y, slot.z] = e.position;
      slot.color = e.color ?? '#7fd0ff';
      getAudioManager().play('transform.ring');
    });
    return () => { off(); offRM(); };
  }, []);

  useFrame((state) => {
    const now = state.clock.elapsedTime;
    const startBase = (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;
    const rm = reduceRef.current;
    const bursts = burstsRef.current;
    for (let i = 0; i < POOL; i += 1) {
      const b = bursts[i];
      const ring = rings.current[i];
      const flash = flashes.current[i];
      if (!ring || !flash) continue;
      if (!b.active) { ring.visible = false; flash.visible = false; continue; }
      // burst.start is in performance-seconds; convert elapsed via wall clock delta.
      const elapsed = startBase - b.start;
      const k = Math.min(1, Math.max(0, elapsed / DURATION));
      if (k >= 1) { b.active = false; ring.visible = false; flash.visible = false; continue; }
      ring.visible = true;
      ring.position.set(b.x, b.y + 0.6, b.z);
      const ringScale = 0.4 + k * (rm ? 1.4 : 3);
      ring.scale.setScalar(ringScale);
      ring.rotation.z = now * 2;
      (ring.material as MeshBasicMaterial).opacity = (1 - k) * (rm ? 0.5 : 0.9);
      (ring.material as MeshBasicMaterial).color.set(b.color);
      flash.visible = !rm; // reduce-motion: no flash sphere
      if (!rm) {
        flash.position.set(b.x, b.y + 0.6, b.z);
        flash.scale.setScalar(1 + k * 2);
        (flash.material as MeshBasicMaterial).opacity = (1 - k) * 0.5;
      }
    }
  });

  return (
    <>
      {Array.from({ length: POOL }, (_, i) => (
        <group key={i}>
          <mesh ref={(m) => { rings.current[i] = m; }} rotation={[Math.PI / 2, 0, 0]} visible={false}>
            <torusGeometry args={[1, 0.07, 10, 40]} />
            <meshBasicMaterial color="#7fd0ff" transparent opacity={0} toneMapped={false} depthWrite={false} />
          </mesh>
          <mesh ref={(m) => { flashes.current[i] = m; }} visible={false}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0} toneMapped={false} depthWrite={false} blending={AdditiveBlending} />
          </mesh>
        </group>
      ))}
    </>
  );
};
