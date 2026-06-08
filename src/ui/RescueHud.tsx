import { useRescueOperationStore } from '../stores/rescueOperationStore';
import { POLI_INCIDENTS } from '../data/incidents/broomsTownIncidents';

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
      <circle
        cx={55} cy={55} r={RING_RADIUS}
        fill="none" stroke="#374151" strokeWidth={RING_STROKE}
      />
      <circle
        cx={55} cy={55} r={RING_RADIUS}
        fill="none" stroke="#f97316" strokeWidth={RING_STROKE}
        strokeDasharray={RING_CIRC}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 55 55)"
        style={{ transition: 'stroke-dashoffset 0.1s linear' }}
      />
      <text x={55} y={60} textAnchor="middle" fill="#ffffff" fontSize={18} fontWeight="bold">
        {Math.round(progress * 100)}%
      </text>
    </svg>
  );
}

export const RescueHud = () => {
  const { isActive, incidentId, stageIndex, step, actionProgress, waypointsFound, timeLeft, retryCount,
    confirmSuccess, dismissDebrief, retryStage } = useRescueOperationStore();

  if (!isActive || !incidentId) return null;

  const def = POLI_INCIDENTS.find((d) => d.id === incidentId);
  if (!def) return null;
  const stage = def.stages[stageIndex];

  // ---- on_scene ----
  if (step === 'on_scene') {
    const foundCount = waypointsFound.filter(Boolean).length;
    const totalWaypoints = stage.waypointPositions?.length ?? 0;
    return (
      <div className="fixed inset-0 flex items-end justify-center pointer-events-none" style={{ zIndex: 200 }}>
        <div
          className="mb-20 rounded-2xl px-8 py-6 text-center shadow-2xl"
          style={{ background: 'rgba(30,20,5,0.92)', border: '2px solid #f97316', minWidth: 320, pointerEvents: 'none' }}
        >
          <div className="text-xs font-bold tracking-widest mb-1" style={{ color: '#f97316' }}>
            🚒 救援進行中
          </div>
          <div className="text-2xl font-bold text-white mb-1">{stage.titleZhTW}</div>
          <div className="text-sm mb-4" style={{ color: '#d1d5db' }}>{stage.descriptionZhTW}</div>

          {stage.type === 'action' && (
            <>
              <ProgressRing progress={actionProgress} />
              <div className="mt-3 text-lg font-bold" style={{ color: timeLeft <= 5 ? '#ef4444' : '#fbbf24' }}>
                ⏱ {Math.ceil(timeLeft)} 秒
              </div>
              <div className="mt-2 text-base text-white opacity-80">按 [E] 繼續！</div>
            </>
          )}

          {stage.type === 'waypoints' && (
            <>
              <div className="text-4xl my-3">🔍</div>
              <div className="text-xl font-bold text-white">
                找到 {foundCount} / {totalWaypoints} 個地點
              </div>
              <div className="mt-2 text-sm" style={{ color: '#d1d5db' }}>走向黃色標記地點</div>
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
          <div className="text-2xl font-bold text-white mb-3">救援成功！</div>
          <StarRating retryCount={retryCount} />
          <div className="mt-2 text-sm mb-5" style={{ color: '#86efac' }}>
            +{def.reward.exp} EXP
          </div>
          <button
            className="px-8 py-2 rounded-xl font-bold text-white text-lg"
            style={{ background: '#16a34a', cursor: 'pointer' }}
            onClick={confirmSuccess}
          >
            繼續
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
            安全小知識
          </div>
          <div className="text-xl font-bold text-white mb-3">{def.safetyLesson.titleZhTW}</div>
          <div className="text-base leading-relaxed mb-6" style={{ color: '#fef3c7' }}>
            {def.safetyLesson.lessonZhTW}
          </div>
          <button
            className="px-8 py-2 rounded-xl font-bold text-white text-lg"
            style={{ background: '#d97706', cursor: 'pointer' }}
            onClick={dismissDebrief}
          >
            完成
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
          <div className="text-xl font-bold text-white mb-3">需要再試一次！</div>
          <div className="text-base mb-6" style={{ color: '#fdba74' }}>
            {stage.retryHintZhTW}
          </div>
          <button
            className="px-8 py-2 rounded-xl font-bold text-white text-lg"
            style={{ background: '#ea580c', cursor: 'pointer' }}
            onClick={retryStage}
          >
            再試一次
          </button>
        </div>
      </div>
    );
  }

  return null;
};
