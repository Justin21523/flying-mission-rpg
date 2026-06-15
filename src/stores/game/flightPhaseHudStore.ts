import { create } from 'zustand';
import type { FlightEventType } from '../../types/game/flightPhase';

// Transient HUD surface for fired Flight Phase events (briefing / dialogue / warning text + fx pulses).
// Written by FlightPhaseEventRuntime, read by FlightPhaseEventHud. Auto-expires so scrubbing back/forth
// doesn't leave stale notices.
export type FlightNoticeTone = 'info' | 'warning' | 'mission';

interface FlightPhaseHudState {
  notice: { id: number; text: string; tone: FlightNoticeTone } | null;
  boostPulse: number; // bump → boost fx burst
  trailPulse: number; // bump → trail fx burst
  showNotice: (text: string, tone: FlightNoticeTone) => void;
  clearNotice: (id: number) => void;
  pulseBoost: () => void;
  pulseTrail: () => void;
}

let noticeId = 0;
export const useFlightPhaseHudStore = create<FlightPhaseHudState>((set) => ({
  notice: null,
  boostPulse: 0,
  trailPulse: 0,
  showNotice: (text, tone) => { const id = ++noticeId; set({ notice: { id, text, tone } }); },
  clearNotice: (id) => set((s) => (s.notice?.id === id ? { notice: null } : s)),
  pulseBoost: () => set((s) => ({ boostPulse: s.boostPulse + 1 })),
  pulseTrail: () => set((s) => ({ trailPulse: s.trailPulse + 1 })),
}));

export const NOTICE_TONE: Record<FlightEventType, FlightNoticeTone | null> = {
  missionBriefing: 'mission',
  dialogue: 'info',
  airWarning: 'warning',
  basePanorama: 'info',
  cameraSwitch: null,
  animation: null,
  speedChange: null,
  turn: null,
  boostFx: null,
  trailFx: null,
  nextPhase: null,
};
