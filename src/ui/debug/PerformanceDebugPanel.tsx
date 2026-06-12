import { usePerformanceStore } from '../../stores/usePerformanceStore';
import { useGraphicsSettingsStore } from '../../stores/graphicsSettingsStore';
import { useAudioStore } from '../../stores/audioStore';
import { useDevStore } from '../../stores/devStore';
import { useGameStore } from '../../stores/game/useGameStore';
import { performanceMonitor } from '../../game/performance/PerformanceMonitor';
import { resetRuntimeStats } from '../../game/performance/RuntimeStatsCollector';
import { effectiveQualityPreset } from '../../game/performance/QualityPresetController';

// Batch 12 — on-screen performance panel (gated by graphicsSettingsStore.showPerfHud). Shows FPS / frame
// time / memory / pool & effect counts / character tiers / quality / scene / phase plus quick toggles.
// DOM overlay — lives outside the Canvas; reads the sampler snapshot, never ticks itself.
export const PerformanceDebugPanel = () => {
  const show = useGraphicsSettingsStore((s) => s.showPerfHud);
  const snap = usePerformanceStore((s) => s.snapshot);
  const tier = useGraphicsSettingsStore((s) => s.tier);
  const setTier = useGraphicsSettingsStore((s) => s.setTier);
  const setCustomPreset = useGraphicsSettingsStore((s) => s.setCustomPreset);
  const particlesEnabled = useAudioStore((s) => s.particlesEnabled);
  const toggleParticles = useAudioStore((s) => s.toggleParticles);
  const sceneMode = useDevStore((s) => s.sceneMode);
  const phase = useGameStore((s) => s.phase);

  if (!show) return null;

  const preset = effectiveQualityPreset();
  const fpsColor = snap.fps >= 50 ? 'text-emerald-300' : snap.fps >= 30 ? 'text-amber-300' : 'text-rose-300';

  return (
    <div className="pointer-events-auto fixed right-2 top-2 z-[60] w-56 rounded-lg border border-slate-700 bg-slate-950/85 p-2 font-mono text-[10px] text-slate-200 shadow-lg backdrop-blur">
      <div className="mb-1 flex items-center justify-between">
        <span className="font-bold text-sky-300">⚡ Performance</span>
        <span className={fpsColor}>{snap.fps} fps</span>
      </div>
      <Row k="frame" v={`${snap.frameTime}ms (${snap.minFrameTime}–${snap.maxFrameTime})`} />
      <Row k="memory" v={snap.memoryMb != null ? `${snap.memoryMb} MB` : 'n/a'} />
      <Row k="quality" v={`${tier} · ${preset.renderLevel}`} />
      <Row k="scene" v={sceneMode} />
      <Row k="phase" v={phase} />
      <div className="my-1 border-t border-slate-800" />
      <Row k="chunks" v={String(snap.activeChunks)} />
      <Row k="flight events" v={String(snap.flightEvents)} />
      <Row k="particles" v={String(snap.particles)} />
      <Row k="effects" v={String(snap.effects)} />
      <Row k="pool act/idle" v={`${snap.poolActive}/${snap.poolIdle}`} />
      <Row k="chars A/S/R" v={`${snap.activeCharacters}/${snap.standbyCharacters}/${snap.remoteCharacters}`} />
      <Row k="ai ticks" v={String(snap.aiTicks)} />
      <Row k="audio loops" v={String(snap.audioPlaying)} />
      <div className="my-1 border-t border-slate-800" />
      <div className="grid grid-cols-2 gap-1">
        <Btn label="Reset" onClick={() => { performanceMonitor.reset(); resetRuntimeStats(); }} />
        <Btn label="Dump" onClick={() => console.info('[perf]', usePerformanceStore.getState().snapshot)} />
        <Btn label="Force Low" onClick={() => setTier('low')} />
        <Btn label="Force High" onClick={() => setTier('high')} />
        <Btn label={`Particles ${particlesEnabled ? 'on' : 'off'}`} onClick={toggleParticles} />
        <Btn label={`Speed ${preset.speedLinesEnabled ? 'on' : 'off'}`} onClick={() => setCustomPreset({ speedLinesEnabled: !preset.speedLinesEnabled })} />
        <Btn label={`Post ${preset.postprocessingEnabled ? 'on' : 'off'}`} onClick={() => setCustomPreset({ postprocessingEnabled: !preset.postprocessingEnabled })} />
        <Btn label={`Shadow ${preset.shadowsEnabled ? 'on' : 'off'}`} onClick={() => setCustomPreset({ shadowsEnabled: !preset.shadowsEnabled })} />
      </div>
    </div>
  );
};

const Row = ({ k, v }: { k: string; v: string }) => (
  <div className="flex items-center justify-between">
    <span className="text-slate-400">{k}</span>
    <span className="text-slate-100">{v}</span>
  </div>
);

const Btn = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <button onClick={onClick} className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] text-slate-200 hover:bg-slate-700">{label}</button>
);
