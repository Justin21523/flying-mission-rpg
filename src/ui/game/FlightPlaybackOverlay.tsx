import { useFlightTimelineStore, PLAYBACK_SPEEDS } from '../../stores/game/flightTimelineStore';
import { useFlightPhaseStore } from '../../stores/game/flightPhaseStore';

// Bottom-left Flight Phase playback overlay (Edit Mode). Independent of the right-side editor panel — full
// transport for the seconds timeline: play/pause/stop/restart, prev/next keyframe, a scrub slider with camera-
// keyframe ticks (purple) + event markers (amber), current/total time, playback-speed, loop + scrub toggles,
// and apply/reset. Everything writes flightTimelineStore.currentTime → the 3D hosts re-evaluate instantly.
const fmt = (s: number) => `${s.toFixed(2)}s`;
const btn = 'rounded px-2 py-1 text-[12px] font-medium transition';
const ghost = `${btn} bg-slate-800 text-slate-200 hover:bg-slate-700`;

export const FlightPlaybackOverlay = () => {
  const tl = useFlightTimelineStore();
  const phase = useFlightPhaseStore((s) => s.phases.find((p) => p.phaseId === s.activePhaseId) ?? s.phases[0]);
  if (!phase) return null;
  const dur = Math.max(0.001, phase.totalDuration);
  const pct = (t: number) => `${Math.max(0, Math.min(100, (t / dur) * 100))}%`;

  return (
    <div className="pointer-events-auto fixed bottom-3 left-3 z-[80] w-[26rem] rounded-xl border border-sky-700/50 bg-slate-950/90 p-3 text-slate-100 shadow-2xl backdrop-blur">
      <div className="mb-1.5 flex items-center gap-2">
        <span className="text-[12px] font-bold tracking-wide text-sky-200">🛩 {phase.phaseName}</span>
        <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[11px] text-slate-300">{fmt(tl.currentTime)} / {fmt(phase.totalDuration)}</span>
        <span className="ml-auto rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-slate-400">{phase.path.nodes.length} nodes · {phase.cameraKeyframes.length} cams · {phase.events.length} events</span>
      </div>

      <div className="mb-2 flex flex-wrap gap-1">
        <button onClick={() => tl.prevKeyframe()} className={ghost} title="Previous keyframe">⏮</button>
        {tl.playing
          ? <button onClick={() => tl.pause()} className={`${btn} bg-amber-600/80 text-white hover:bg-amber-600`}>⏸ Pause</button>
          : <button onClick={() => tl.play()} className={`${btn} bg-emerald-600/80 text-white hover:bg-emerald-600`}>▶ Play</button>}
        <button onClick={() => tl.stop()} className={ghost} title="Stop (back to 0)">⏹</button>
        <button onClick={() => tl.restart()} className={ghost} title="Restart from 0">↺</button>
        <button onClick={() => tl.nextKeyframe()} className={ghost} title="Next keyframe">⏭</button>
        <div className="ml-auto flex items-center gap-1">
          {PLAYBACK_SPEEDS.map((s) => (
            <button key={s} onClick={() => tl.setSpeed(s)} className={`${btn} ${tl.playbackSpeed === s ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>{s}×</button>
          ))}
        </div>
      </div>

      {/* scrub track with keyframe + event ticks */}
      <div className="relative mb-1 h-5">
        <div className="pointer-events-none absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded bg-slate-700" />
        {phase.cameraKeyframes.map((k) => (
          <div key={k.keyframeId} title={`🎥 ${fmt(k.time)}`} className="pointer-events-none absolute top-0 h-3 w-0.5 -translate-x-1/2 rounded bg-fuchsia-400" style={{ left: pct(k.time) }} />
        ))}
        {phase.events.map((e) => (
          <div key={e.eventId} title={`${e.eventType} @ ${fmt(e.time)}`} className="pointer-events-none absolute bottom-0 h-3 w-0.5 -translate-x-1/2 rounded bg-amber-400" style={{ left: pct(e.time) }} />
        ))}
        <input
          type="range" min={0} max={dur} step={0.01} value={tl.currentTime}
          onChange={(e) => tl.scrub(parseFloat(e.target.value))}
          className="absolute inset-0 w-full appearance-none bg-transparent"
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
        <label className="flex items-center gap-1 text-slate-300"><input type="checkbox" checked={tl.loop} onChange={() => tl.toggleLoop()} className="accent-sky-500" /> Loop</label>
        <label className="flex items-center gap-1 text-slate-300"><input type="checkbox" checked={tl.scrubPreview} onChange={() => tl.toggleScrubPreview()} className="accent-sky-500" /> Scrub preview</label>
        <label className="flex items-center gap-1 text-slate-300"><input type="checkbox" checked={tl.cameraPreview} onChange={() => tl.toggleCameraPreview()} className="accent-fuchsia-500" /> 🎥 Camera preview</label>
        <button onClick={() => tl.pause()} className="ml-auto rounded bg-sky-700/40 px-2 py-0.5 text-[11px] text-sky-100 hover:bg-sky-700/60">Apply @ {fmt(tl.currentTime)}</button>
        <button onClick={() => tl.resetPreview()} className="rounded bg-rose-700/30 px-2 py-0.5 text-[11px] text-rose-200 hover:bg-rose-700/50">Reset preview</button>
      </div>
    </div>
  );
};
