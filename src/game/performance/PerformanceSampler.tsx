import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { performanceMonitor } from './PerformanceMonitor';
import { getRuntimeStats } from './RuntimeStatsCollector';
import { usePerformanceStore } from '../../stores/usePerformanceStore';
import { getAudioManager } from '../audio/AudioManager';

// Batch 12 — in-canvas sampler. Feeds every frame's dt to the PerformanceMonitor, then pushes a snapshot
// to usePerformanceStore at ~4 Hz (NOT every frame — keeps the DOM panel cheap). Mounted once in Scene.
// Renders nothing.
export const PerformanceSampler = () => {
  const acc = useRef(0);

  useFrame((_, dt) => {
    performanceMonitor.sample(dt);
    acc.current += dt;
    if (acc.current < 0.25) return;
    acc.current = 0;
    const stats = getRuntimeStats();
    usePerformanceStore.getState().pushSnapshot({
      ...stats,
      audioPlaying: getAudioManager().playingCount(),
      fps: Math.round(performanceMonitor.fps),
      frameTime: round2(performanceMonitor.avgFrameTime),
      minFrameTime: round2(performanceMonitor.minFrameTime),
      maxFrameTime: round2(performanceMonitor.maxFrameTime),
      memoryMb: performanceMonitor.memoryMb(),
    });
  });

  return null;
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
