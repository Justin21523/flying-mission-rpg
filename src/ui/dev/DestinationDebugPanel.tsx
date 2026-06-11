import type { ReactNode } from 'react';
import { usePoll } from '../usePoll';
import { useGameStore } from '../../stores/game/useGameStore';
import { useMissionStore } from '../../stores/game/useMissionStore';
import { useDialogueStore } from '../../stores/dialogueStore';
import { useDestinationRuntimeStore } from '../../stores/game/destinationRuntimeStore';
import { usePhaserOverlayStore, phaserBridge } from '../../game/phaser/phaserBridge';
import { robotHandle } from '../../game/destination/robotHandle';
import { destinationDev } from '../../game/destination/destinationDev';

// Dev/edit destination inspector — phase, robot telemetry, landing eval, dialogue node, objective progress,
// mini-game state; with force buttons (safe landing / greeting / complete mission / reset carry / reopen
// mini-game). Drives the dev-command bridge + legal store actions only.
export const DestinationDebugPanel = () => {
  usePoll(200);
  const phase = useGameStore((s) => s.phase);
  const runtime = useMissionStore((s) => s.runtime);
  const evaluation = useDestinationRuntimeStore((s) => s.evaluation);
  const carryingId = useDestinationRuntimeStore((s) => s.carryingId);
  const interactionOwner = useDestinationRuntimeStore((s) => s.interactionOwnerId);
  const dlgNode = useDialogueStore((s) => s.currentNodeId);
  const miniGame = usePhaserOverlayStore((s) => s.openId);
  const jump = useGameStore((s) => s.jumpTo);

  return (
    <div className="pointer-events-auto fixed bottom-2 left-2 z-[90] w-72 rounded-lg border border-emerald-800/60 bg-slate-950/85 p-3 text-[11px] text-slate-200 shadow-xl backdrop-blur">
      <div className="mb-1 font-bold text-emerald-300">🏙 Destination (dev)</div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
        <Row label="Phase" value={phase} />
        <Row label="Altitude" value={robotHandle.altitude.toFixed(1)} />
        <Row label="vSpeed" value={robotHandle.vSpeed.toFixed(1)} />
        <Row label="hSpeed" value={robotHandle.hSpeed.toFixed(1)} />
        <Row label="Landing" value={evaluation ? evaluation.quality : '—'} />
        <Row label="Carrying" value={carryingId ?? '—'} />
        <Row label="Interaction owner" value={interactionOwner ?? '—'} />
        <Row label="Dialogue" value={dlgNode ?? '—'} />
        <Row label="Mini-game" value={miniGame ?? '—'} />
      </div>
      {runtime && (
        <div className="mt-1 max-h-16 overflow-y-auto rounded bg-slate-900/60 p-1 text-[10px]">
          {Object.entries(runtime.objectiveProgress).map(([id, p]) => (
            <div key={id} className="flex justify-between"><span className="truncate">{id}</span><span className={p.done ? 'text-emerald-300' : 'text-slate-400'}>{p.done ? 'done' : `${p.count}`}</span></div>
          ))}
        </div>
      )}
      <div className="mt-2 flex flex-wrap gap-1">
        <Btn onClick={() => jump('LANDING')}>⏬ Force land</Btn>
        <Btn onClick={() => jump('NPC_GREETING')}>👋 Greeting</Btn>
        <Btn onClick={() => { destinationDev.forceCompleteMission = true; }}>✅ Complete</Btn>
        <Btn onClick={() => { destinationDev.resetCarry = true; }}>↺ Reset carry</Btn>
        <Btn onClick={() => phaserBridge.openMiniGame('repair_wiring')}>🔧 Mini-game</Btn>
      </div>
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between"><span className="text-slate-400">{label}</span><span className="tabular-nums truncate">{value}</span></div>
);
const Btn = ({ onClick, children }: { onClick: () => void; children: ReactNode }) => (
  <button onClick={onClick} className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-200 hover:bg-slate-700">{children}</button>
);
