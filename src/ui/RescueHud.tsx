import { useRescueOperationStore } from '../stores/rescueOperationStore';
import { getEditorIncident } from '../stores/editorIncidentStore';
import { useToolStore } from '../stores/toolStore';
import { getEditorTool } from '../stores/editorToolStore';
import { usePoll } from './usePoll';
import { useT } from '../i18n/useT';

const nowSec = () => performance.now() / 1000;

// Equipped tools during an action stage: hotkey 1/2/3, cooldown overlay, vfxColor tint, click to use.
function RescueToolBar() {
  usePoll(120);
  const equipped = useToolStore.getState().equippedTools;
  if (equipped.length === 0) return null;
  const { toolCooldownUntil, toolActiveUntil } = useRescueOperationStore.getState();
  const t = nowSec();
  return (
    <div className="mt-3 flex justify-center gap-2" style={{ pointerEvents: 'auto' }}>
      {equipped.map((id, i) => {
        const def = getEditorTool(id);
        if (!def) return null;
        const cd = Math.max(0, (toolCooldownUntil[id] ?? 0) - t);
        const onCd = cd > 0.05;
        const active = (toolActiveUntil[id] ?? 0) > t;
        const color = def.vfxColor ?? '#38bdf8';
        return (
          <button
            key={id}
            onClick={() => useRescueOperationStore.getState().useTool(id)}
            disabled={onCd}
            title={`${def.name} — press ${i + 1}`}
            className="relative flex h-12 w-12 flex-col items-center justify-center rounded-xl border-2 text-white transition-all disabled:cursor-not-allowed"
            style={{ borderColor: color, background: active ? `${color}55` : 'rgba(0,0,0,0.5)', boxShadow: active ? `0 0 12px ${color}` : 'none', cursor: onCd ? 'not-allowed' : 'pointer' }}
          >
            <span className="text-xl leading-none">{def.icon}</span>
            <span className="absolute -left-1 -top-1 rounded bg-slate-900/90 px-1 text-[9px] font-bold">{i + 1}</span>
            {onCd && <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/65 text-[12px] font-bold">{cd.toFixed(1)}</span>}
          </button>
        );
      })}
    </div>
  );
}

// Brief radial flash in the tool's vfxColor each time a tool is used. Keyed by the fx id so each use remounts
// the element and replays a one-shot CSS fade (no state/timer needed — avoids setState-in-effect).
function ToolFxFlash() {
  const fx = useRescueOperationStore((s) => s.lastToolFx);
  if (!fx) return null;
  return (
    <div
      key={fx.id}
      className="pointer-events-none absolute inset-0 rounded-2xl"
      style={{ boxShadow: `inset 0 0 50px ${fx.color}`, animation: 'rescueToolFlash 0.34s ease-out forwards' }}
    />
  );
}

// Circular SVG progress ring — radius 44, stroke-width 8 → circumference ≈ 276.
const RING_RADIUS = 44;
const RING_STROKE = 8;
const RING_CIRC = 2 * Math.PI * RING_RADIUS;

function StarRating({ retryCount }: { retryCount: number }) {
  const stars = retryCount === 0 ? 3 : retryCount === 1 ? 2 : 1;
  return (
    <div className="flex gap-1 text-3xl">
      {[1, 2, 3].map((i) => (
        <span key={i} style={{ color: i <= stars ? '#fbbf24' : '#6b7280' }}>★</span>
      ))}
    </div>
  );
}

function ProgressRing({ progress }: { progress: number }) {
  const offset = RING_CIRC * (1 - Math.min(1, progress));
  return (
    <svg width={110} height={110} className="mx-auto">
      <circle cx={55} cy={55} r={RING_RADIUS} fill="none" stroke="#374151" strokeWidth={RING_STROKE} />
      <circle
        cx={55} cy={55} r={RING_RADIUS}
        fill="none" stroke="#f97316" strokeWidth={RING_STROKE}
        strokeDasharray={RING_CIRC} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 55 55)"
        style={{ transition: 'stroke-dashoffset 0.1s linear' }}
      />
      <text x={55} y={60} textAnchor="middle" fill="#ffffff" fontSize={18} fontWeight="bold">
        {Math.round(progress * 100)}%
      </text>
    </svg>
  );
}

export const RescueHud = () => {
  const { isActive, incidentId, stageIndex, step, actionProgress, waypointsFound, timeLeft,
    retryCount, confirmSuccess, dismissDebrief, retryStage } = useRescueOperationStore();
  const t = useT();

  if (!isActive || !incidentId) return null;

  const def = getEditorIncident(incidentId);
  if (!def) return null;
  const stage = def.stages[stageIndex];

  // ---- on_scene ----
  if (step === 'on_scene') {
    const foundCount = waypointsFound.filter(Boolean).length;
    const totalWaypoints = stage.waypointPositions?.length ?? 0;
    return (
      <div className="fixed inset-0 flex items-end justify-center pointer-events-none" style={{ zIndex: 200 }}>
        <div
          className="relative mb-20 rounded-2xl px-8 py-6 text-center shadow-2xl"
          style={{ background: 'rgba(30,20,5,0.92)', border: '2px solid #f97316', minWidth: 320, pointerEvents: 'none' }}
        >
          <ToolFxFlash />
          <div className="text-xs font-bold tracking-widest mb-1" style={{ color: '#f97316' }}>
            🚒 {t('rescueInProgress')}{def.stages.length > 1 ? ` · ${t('stage')} ${stageIndex + 1}/${def.stages.length}` : ''}
          </div>
          <div className="text-2xl font-bold text-white mb-1">{stage.title}</div>
          <div className="text-sm mb-4" style={{ color: '#d1d5db' }}>{stage.description}</div>

          {stage.type === 'action' && (
            <>
              <ProgressRing progress={actionProgress} />
              <div className="mt-3 text-lg font-bold" style={{ color: timeLeft <= 5 ? '#ef4444' : '#fbbf24' }}>
                ⏱ {Math.ceil(timeLeft)}s
              </div>
              <div className="mt-2 text-base text-white opacity-80">{t('pressEToAct')}</div>
              <RescueToolBar />
            </>
          )}

          {stage.type === 'waypoints' && (
            <>
              <div className="text-4xl my-3">🔍</div>
              <div className="text-xl font-bold text-white">
                {foundCount} / {totalWaypoints} {t('locationsFound')}
              </div>
              <div className="mt-2 text-sm" style={{ color: '#d1d5db' }}>{t('walkToMarkers')}</div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ---- success ----
  if (step === 'success') {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 200, background: 'rgba(0,0,0,0.55)' }}>
        <div
          className="rounded-2xl px-10 py-8 text-center shadow-2xl"
          style={{ background: 'rgba(5,30,10,0.97)', border: '2px solid #22c55e', minWidth: 300 }}
        >
          <div className="text-5xl mb-2">✓</div>
          <div className="text-2xl font-bold text-white mb-3">{t('rescueComplete')}</div>
          <StarRating retryCount={retryCount} />
          <div className="mt-2 text-sm mb-5" style={{ color: '#86efac' }}>+{def.reward.exp} EXP</div>
          <button
            className="px-8 py-2 rounded-xl font-bold text-white text-lg"
            style={{ background: '#16a34a', cursor: 'pointer' }}
            onClick={confirmSuccess}
          >
            {t('continue')}
          </button>
        </div>
      </div>
    );
  }

  // ---- debrief ----
  if (step === 'debrief') {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 200, background: 'rgba(0,0,0,0.55)' }}>
        <div
          className="rounded-2xl px-10 py-8 text-center shadow-2xl"
          style={{ background: 'rgba(30,25,0,0.97)', border: '2px solid #fbbf24', minWidth: 320, maxWidth: 420 }}
        >
          <div className="text-3xl mb-2">💡</div>
          <div className="text-xs font-bold tracking-widest mb-2" style={{ color: '#fbbf24' }}>
            {t('safetyTip')}
          </div>
          <div className="text-xl font-bold text-white mb-3">{def.safetyLesson.title}</div>
          <div className="text-base leading-relaxed mb-6" style={{ color: '#fef3c7' }}>
            {def.safetyLesson.lesson}
          </div>
          <button
            className="px-8 py-2 rounded-xl font-bold text-white text-lg"
            style={{ background: '#d97706', cursor: 'pointer' }}
            onClick={dismissDebrief}
          >
            {t('done')}
          </button>
        </div>
      </div>
    );
  }

  // ---- retry ----
  if (step === 'retry') {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 200, background: 'rgba(0,0,0,0.55)' }}>
        <div
          className="rounded-2xl px-10 py-8 text-center shadow-2xl"
          style={{ background: 'rgba(30,10,0,0.97)', border: '2px solid #f97316', minWidth: 300 }}
        >
          <div className="text-3xl mb-2">⚠</div>
          <div className="text-xl font-bold text-white mb-3">{t('tryAgain')}</div>
          <div className="text-base mb-6" style={{ color: '#fdba74' }}>
            {stage.retryHint}
          </div>
          <button
            className="px-8 py-2 rounded-xl font-bold text-white text-lg"
            style={{ background: '#ea580c', cursor: 'pointer' }}
            onClick={retryStage}
          >
            {t('retry')}
          </button>
        </div>
      </div>
    );
  }

  return null;
};
