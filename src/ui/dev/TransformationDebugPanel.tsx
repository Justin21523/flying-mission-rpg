import type { ReactNode } from 'react';
import { usePoll } from '../usePoll';
import { transformationHandle, txFrame } from '../../game/transformation/transformationRuntime';
import { transformationDev } from '../../game/transformation/transformationDev';
import { useTransformationPreviewStore } from '../../stores/game/transformationPreviewStore';
import { useUiStore } from '../../stores/uiStore';

// Dev/edit transformation inspector — timeline/character/form, time, stage, effects, controller + collider
// flags, mode; play/pause/stop/replay/scrub/force-finish/force-quick/reset. In edit it drives the preview
// store; in play it drives the director's dev commands.
export const TransformationDebugPanel = () => {
  usePoll(150);
  const h = transformationHandle;
  const editMode = useUiStore((s) => s.editMode);
  const ps = useTransformationPreviewStore();
  const dur = h.duration || txFrame.def?.totalDurationSec || 1;

  return (
    <div className="pointer-events-auto fixed bottom-2 left-2 z-[90] w-72 rounded-lg border border-fuchsia-800/60 bg-slate-950/85 p-3 text-[11px] text-slate-200 shadow-xl backdrop-blur">
      <div className="mb-1 font-bold text-fuchsia-300">✨ Transformation (dev)</div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
        <Row label="Timeline" value={h.timelineId || '—'} />
        <Row label="Form" value={h.form} />
        <Row label="Mode" value={h.mode} />
        <Row label="Phase" value={h.phase} />
        <Row label="Time" value={`${h.time.toFixed(2)}/${dur.toFixed(1)}`} />
        <Row label="Stage" value={h.stageLabel} />
        <Row label="Effects" value={`${h.effects}`} />
        <Row label="Plane ctrl" value={h.planeCtrl ? 'on' : 'off'} />
        <Row label="Robot ctrl" value={h.robotCtrl ? 'on' : 'off'} />
        <Row label="Plane col" value={h.planeCol ? 'on' : 'off'} />
        <Row label="Robot col" value={h.robotCol ? 'on' : 'off'} />
      </div>

      {editMode ? (
        <>
          <input type="range" min={0} max={dur} step={0.02} value={ps.time} onChange={(e) => ps.scrub(parseFloat(e.target.value))} className="mt-2 w-full" />
          <div className="mt-1 flex flex-wrap gap-1">
            <Btn onClick={() => ps.play()}>▶ Play</Btn>
            <Btn onClick={() => ps.pause()}>⏸ Pause</Btn>
            <Btn onClick={() => ps.stop()}>⏹ Stop</Btn>
            <Btn onClick={() => ps.scrub(dur)}>⏭ End</Btn>
            <Btn onClick={() => ps.setMode(ps.mode === 'quick' ? 'full' : 'quick')}>mode: {ps.mode}</Btn>
          </div>
        </>
      ) : (
        <div className="mt-2 flex flex-wrap gap-1">
          <Btn onClick={() => { transformationDev.reset = true; }}>↻ Replay</Btn>
          <Btn onClick={() => { transformationDev.forceFinish = true; }}>⏭ Finish</Btn>
          <Btn onClick={() => { transformationDev.forceQuick = true; }}>⚡ Quick</Btn>
        </div>
      )}
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between"><span className="text-slate-400">{label}</span><span className="tabular-nums truncate">{value}</span></div>
);
const Btn = ({ onClick, children }: { onClick: () => void; children: ReactNode }) => (
  <button onClick={onClick} className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-200 hover:bg-slate-700">{children}</button>
);
