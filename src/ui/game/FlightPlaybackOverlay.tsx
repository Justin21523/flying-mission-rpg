import { useFlightTimelineStore, PLAYBACK_SPEEDS } from '../../stores/game/flightTimelineStore';
import { useFlightPhaseStore } from '../../stores/game/flightPhaseStore';
import { evaluateFlightState, resolveCameraAtTime, activeEventsAtTime, getNodeTimes } from '../../game/flight/flightPhaseRuntime';
import { flightHandle } from '../../game/flight/flightHandle';
import { usePoll } from '../usePoll';

// Bottom-left Flight Phase playback overlay (Edit Mode / preview). Full transport for the seconds timeline
// PLUS live status readouts of the Actor / Camera / Event — all derived from the SAME deterministic runtime the
// 3D hosts evaluate (evaluateFlightState + resolveCameraAtTime), so the panel always reflects the previewed (==
// played) state. Scrubbing / node + camera-keyframe stepping write flightTimelineStore.currentTime → instant.
const fmt = (s: number) => `${s.toFixed(2)}s`;
const v3 = (v?: readonly [number, number, number] | number[]) => (v ? `${v[0].toFixed(1)}, ${v[1].toFixed(1)}, ${v[2].toFixed(1)}` : '—');
const btn = 'rounded px-2 py-1 text-[12px] font-medium transition';
const ghost = `${btn} bg-slate-800 text-slate-200 hover:bg-slate-700`;

const Row = ({ k, val }: { k: string; val: string }) => (
  <div className="flex justify-between gap-2"><span className="text-slate-400">{k}</span><span className="truncate font-mono text-slate-200">{val}</span></div>
);
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded border border-slate-700/60 bg-slate-900/50 p-1.5">
    <div className="mb-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">{title}</div>
    <div className="space-y-0.5 text-[10px]">{children}</div>
  </div>
);

export const FlightPlaybackOverlay = () => {
  const tl = useFlightTimelineStore();
  // Bind to the ACTIVE flight phase (same source the 3D gizmos + camera controller use) so the overlay always
  // matches what's on screen. Each flight scene (base orbit / aerial cruise / return leg) sets the active
  // phase for its FSM phase on mount, so every path-based leg gets its own playback panel — not just base.
  const phase = useFlightPhaseStore((s) => s.phases.find((p) => p.phaseId === s.activePhaseId) ?? s.phases[0]);
  usePoll(tl.playing ? 100 : 250); // refresh live readouts without 60 Hz store churn
  if (!phase) return null;
  const dur = Math.max(0.001, phase.totalDuration);
  const t = tl.currentTime;
  const pct = (x: number) => `${Math.max(0, Math.min(100, (x / dur) * 100))}%`;

  // Deterministic state at the current time — same source as the 3D hosts (preview == play).
  const actor = evaluateFlightState(phase.path, t);
  const cam = phase.cameraKeyframes.length ? resolveCameraAtTime(phase.cameraKeyframes, t) : null;
  const nodeTimes = getNodeTimes(phase.path);
  const curNodeIdx = nodeTimes.reduce((acc, nt, i) => (nt <= t + 1e-3 ? i : acc), 0);
  const curNode = phase.path.nodes[curNodeIdx];
  const nextNode = phase.path.nodes[curNodeIdx + 1];
  const sortedEvents = [...phase.events].sort((a, b) => a.time - b.time);
  const activeEv = activeEventsAtTime(phase.events, t, 0.25)[0];
  const nextEv = sortedEvents.find((e) => e.time > t + 1e-3);
  const camKf = cam ? phase.cameraKeyframes.find((k) => k.nodeId === cam.nodeId) ?? [...phase.cameraKeyframes].sort((a, b) => Math.abs(a.time - t) - Math.abs(b.time - t))[0] : null;

  return (
    <div className="pointer-events-auto fixed bottom-3 left-3 z-[80] w-[27rem] rounded-xl border border-sky-700/50 bg-slate-950/90 p-3 text-slate-100 shadow-2xl backdrop-blur">
      <div className="mb-1.5 flex items-center gap-2">
        <span className="text-[12px] font-bold tracking-wide text-sky-200">🛩 {phase.phaseName}</span>
        <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[11px] text-slate-300">{fmt(t)} / {fmt(phase.totalDuration)}</span>
        <span className="ml-auto rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-slate-400">{(t / dur * 100).toFixed(0)}%</span>
      </div>

      <div className="mb-1.5 flex flex-wrap gap-1">
        <button onClick={() => tl.prevKeyframe()} className={ghost} title="Previous marker">⏮</button>
        {tl.playing
          ? <button onClick={() => tl.pause()} className={`${btn} bg-amber-600/80 text-white hover:bg-amber-600`}>⏸ Pause</button>
          : <button onClick={() => tl.play()} className={`${btn} bg-emerald-600/80 text-white hover:bg-emerald-600`}>▶ Play</button>}
        <button onClick={() => tl.stop()} className={ghost} title="Stop (back to 0)">⏹</button>
        <button onClick={() => tl.restart()} className={ghost} title="Restart from 0">↺</button>
        <button onClick={() => tl.nextKeyframe()} className={ghost} title="Next marker">⏭</button>
        <div className="ml-auto flex items-center gap-1">
          {PLAYBACK_SPEEDS.map((s) => (
            <button key={s} onClick={() => tl.setSpeed(s)} className={`${btn} ${tl.playbackSpeed === s ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>{s}×</button>
          ))}
        </div>
      </div>

      {/* node / camera-keyframe stepping */}
      <div className="mb-1.5 flex flex-wrap gap-1 text-[11px]">
        <button onClick={() => tl.prevNode()} className={ghost} title="Previous node">◀ Node</button>
        <button onClick={() => tl.nextNode()} className={ghost} title="Next node">Node ▶</button>
        <button onClick={() => tl.prevCameraKeyframe()} className={`${ghost} text-fuchsia-200`} title="Previous camera keyframe">◀ 🎥</button>
        <button onClick={() => tl.nextCameraKeyframe()} className={`${ghost} text-fuchsia-200`} title="Next camera keyframe">🎥 ▶</button>
        <div className="ml-auto flex items-center gap-1">
          <button onClick={() => { if (!tl.cameraPreview) tl.toggleCameraPreview(); }} className={`${btn} ${tl.cameraPreview ? 'bg-fuchsia-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`} title="Drive the camera from the authored keyframes">🎥 Preview cam</button>
          <button onClick={() => { if (tl.cameraPreview) tl.toggleCameraPreview(); }} className={`${btn} ${!tl.cameraPreview ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`} title="Free editor camera">🕹 Free cam</button>
        </div>
      </div>

      {/* scrub track with keyframe + event ticks */}
      <div className="relative mb-1.5 h-5">
        <div className="pointer-events-none absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded bg-slate-700" />
        {nodeTimes.map((nt, i) => (
          <div key={`n${i}`} title={`node ${i + 1}`} className="pointer-events-none absolute top-1/2 h-2 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded bg-sky-400/70" style={{ left: pct(nt) }} />
        ))}
        {phase.cameraKeyframes.map((k) => (
          <div key={k.keyframeId} title={`🎥 ${fmt(k.time)}`} className="pointer-events-none absolute top-0 h-3 w-0.5 -translate-x-1/2 rounded bg-fuchsia-400" style={{ left: pct(k.time) }} />
        ))}
        {phase.events.map((e) => (
          <div key={e.eventId} title={`${e.eventType} @ ${fmt(e.time)}`} className="pointer-events-none absolute bottom-0 h-3 w-0.5 -translate-x-1/2 rounded bg-amber-400" style={{ left: pct(e.time) }} />
        ))}
        <input
          type="range" min={0} max={dur} step={0.01} value={t}
          onChange={(e) => tl.scrub(parseFloat(e.target.value))}
          className="absolute inset-0 w-full appearance-none bg-transparent"
        />
      </div>

      {/* live status — Actor / Camera / Event (deterministic, == play) */}
      <div className="mb-1.5 grid grid-cols-3 gap-1.5">
        <Section title="✈ Actor">
          <Row k="pos" val={v3(actor.position)} />
          <Row k="bank°" val={actor.bank.toFixed(1)} />
          <Row k="speed" val={`${actor.speed.toFixed(1)} (${flightHandle.speedNorm.toFixed(2)})`} />
          <Row k="alt" val={actor.altitude.toFixed(1)} />
          <Row k="pose" val={actor.pose} />
          <Row k="seg" val={`${actor.segmentIndex + 1}/${phase.path.nodes.length}`} />
        </Section>
        <Section title="🎥 Camera">
          <Row k="mode" val={cam?.cameraMode ?? '—'} />
          <Row k="key" val={camKf ? fmt(camKf.time) : '—'} />
          <Row k="pos" val={v3(cam?.position)} />
          <Row k="lookAt" val={v3(cam?.lookAt)} />
          <Row k="fov" val={cam ? cam.fov.toFixed(0) : '—'} />
          <Row k="dist/h" val={cam ? `${(cam.distance ?? 0).toFixed(1)}/${(cam.height ?? 0).toFixed(1)}` : '—'} />
        </Section>
        <Section title="⚡ Event / Node">
          <Row k="node" val={curNode ? curNode.nodeName : '—'} />
          <Row k="next" val={nextNode ? nextNode.nodeName : '—'} />
          <Row k="active" val={activeEv ? activeEv.eventType : '—'} />
          <Row k="next ev" val={nextEv ? `${nextEv.eventType}` : '—'} />
          <Row k="ev @" val={nextEv ? fmt(nextEv.time) : '—'} />
          <Row k="phase" val={phase.phaseId} />
        </Section>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
        <label className="flex items-center gap-1 text-slate-300"><input type="checkbox" checked={tl.loop} onChange={() => tl.toggleLoop()} className="accent-sky-500" /> Loop</label>
        <label className="flex items-center gap-1 text-slate-300"><input type="checkbox" checked={tl.scrubPreview} onChange={() => tl.toggleScrubPreview()} className="accent-sky-500" /> Scrub preview</label>
        <button onClick={() => tl.resetPreview()} className="ml-auto rounded bg-rose-700/30 px-2 py-0.5 text-[11px] text-rose-200 hover:bg-rose-700/50">Reset preview</button>
      </div>
    </div>
  );
};
