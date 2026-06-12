import { getRuntimeStats } from '../performance/RuntimeStatsCollector';
import { phaserBridge } from '../phaser/phaserBridge';

// Batch 13 — reads the runtime stat collector + Phaser bridge to surface "did the last scene clean up?"
// residuals (lingering effects / pooled objects / an open Phaser overlay).
export interface SceneResidual {
  effects: number;
  particles: number;
  poolActive: number;
  phaserOpen: boolean;
}

export function getSceneResidual(): SceneResidual {
  const s = getRuntimeStats();
  return { effects: s.effects, particles: s.particles, poolActive: s.poolActive, phaserOpen: phaserBridge.isOpen() };
}
