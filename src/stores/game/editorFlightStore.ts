import { create } from 'zustand';
import type { FlightTuning } from '../../types/game/flightControl';
import { DEFAULT_FLIGHT_TUNING } from '../../data/game/flightTuning';

// Single editable flight-tuning document (🛩 Flight tab). localStorage-backed; takes effect live so the
// flight feel can be dialed without code. (No-hardcoded-params rule.)
const STORAGE_KEY = 'aero-rescue-flight-tuning-v3';

function persist(t: FlightTuning): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(t));
  } catch {
    /* ignore quota / unavailable */
  }
}
function load(): FlightTuning {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_FLIGHT_TUNING };
    const p: unknown = JSON.parse(raw);
    return { ...DEFAULT_FLIGHT_TUNING, ...(p && typeof p === 'object' ? (p as Partial<FlightTuning>) : {}) };
  } catch {
    return { ...DEFAULT_FLIGHT_TUNING };
  }
}

interface FlightStore {
  tuning: FlightTuning;
  update: (patch: Partial<FlightTuning>) => void;
  importState: (data: { tuning?: Partial<FlightTuning> }) => void;
  reset: () => void;
}

export const useEditorFlightStore = create<FlightStore>((set, get) => ({
  tuning: load(),
  update: (patch) => {
    const tuning = { ...get().tuning, ...patch };
    set({ tuning });
    persist(tuning);
  },
  importState: (data) => {
    const tuning = { ...DEFAULT_FLIGHT_TUNING, ...(data.tuning ?? {}) };
    set({ tuning });
    persist(tuning);
  },
  reset: () => {
    set({ tuning: { ...DEFAULT_FLIGHT_TUNING } });
    persist({ ...DEFAULT_FLIGHT_TUNING });
  },
}));

export function getFlightTuning(): FlightTuning {
  return useEditorFlightStore.getState().tuning;
}
