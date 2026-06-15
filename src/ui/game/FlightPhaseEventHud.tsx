import { useEffect, useRef, useState } from 'react';
import { useFlightPhaseHudStore } from '../../stores/game/flightPhaseHudStore';

// Surfaces fired Flight Phase events: a centre-top notice card (briefing / dialogue / warning) that auto-fades,
// plus a brief screen-edge glow for boost / trail fx pulses. Driven by flightPhaseHudStore (written by
// FlightPhaseEventRuntime in both Edit preview and Play).
const TONE_STYLE: Record<string, string> = {
  mission: 'border-sky-400/70 bg-sky-950/85 text-sky-50',
  warning: 'border-amber-400/70 bg-amber-950/85 text-amber-50',
  info: 'border-slate-400/60 bg-slate-950/85 text-slate-50',
};

export const FlightPhaseEventHud = () => {
  const notice = useFlightPhaseHudStore((s) => s.notice);
  const [glow, setGlow] = useState<string | null>(null);
  const glowTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!notice) return;
    const id = notice.id;
    const t = setTimeout(() => useFlightPhaseHudStore.getState().clearNotice(id), 3500);
    return () => clearTimeout(t);
  }, [notice]);

  // Subscribe to fx pulses (setState in a store-listener callback, not synchronously in the effect body).
  useEffect(() => useFlightPhaseHudStore.subscribe((s, prev) => {
    if (s.boostPulse === prev.boostPulse && s.trailPulse === prev.trailPulse) return;
    setGlow(s.boostPulse >= s.trailPulse ? 'from-orange-500/40' : 'from-sky-400/40');
    if (glowTimer.current) clearTimeout(glowTimer.current);
    glowTimer.current = setTimeout(() => setGlow(null), 600);
  }), []);

  return (
    <>
      {glow && <div className={`pointer-events-none fixed inset-0 z-[58] bg-gradient-to-t ${glow} to-transparent`} />}
      {notice && (
        <div className="pointer-events-none fixed inset-x-0 top-16 z-[62] flex justify-center px-4">
          <div className={`rounded-xl border px-5 py-2.5 text-center text-sm font-medium shadow-2xl backdrop-blur ${TONE_STYLE[notice.tone] ?? TONE_STYLE.info}`}>
            {notice.text}
          </div>
        </div>
      )}
    </>
  );
};
