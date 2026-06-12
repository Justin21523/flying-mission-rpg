import { create } from 'zustand';
import type { FlightLegKind } from '../../game/flight/flightLeg';

export type WorldFlightEditViewMode = 'clean-edit' | 'preview-edit' | 'play-like-edit';
export type WorldFlightPathOverlayMode = 'selected-leg' | 'all-world-routes';

interface WorldFlightEditorState {
  editViewMode: WorldFlightEditViewMode;
  selectedRouteId: string | null;
  selectedLeg: FlightLegKind;
  pathOverlayMode: WorldFlightPathOverlayMode;
  setEditViewMode: (mode: WorldFlightEditViewMode) => void;
  setSelectedRouteId: (id: string | null) => void;
  setSelectedLeg: (leg: FlightLegKind) => void;
  setPathOverlayMode: (mode: WorldFlightPathOverlayMode) => void;
}

const STORAGE_KEY = 'aero-rescue-world-flight-editor-v1';
const MODES: readonly WorldFlightEditViewMode[] = ['clean-edit', 'preview-edit', 'play-like-edit'];
const OVERLAY_MODES: readonly WorldFlightPathOverlayMode[] = ['selected-leg', 'all-world-routes'];

interface PersistedWorldFlightEditor {
  editViewMode?: WorldFlightEditViewMode;
  selectedRouteId?: string | null;
  selectedLeg?: FlightLegKind;
  pathOverlayMode?: WorldFlightPathOverlayMode;
}

function loadState(): Pick<WorldFlightEditorState, 'editViewMode' | 'selectedRouteId' | 'selectedLeg' | 'pathOverlayMode'> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { editViewMode: 'clean-edit', selectedRouteId: null, selectedLeg: 'outbound', pathOverlayMode: 'selected-leg' };
    }
    const parsed = JSON.parse(raw) as PersistedWorldFlightEditor | WorldFlightEditViewMode;
    if (typeof parsed === 'string') {
      return {
        editViewMode: MODES.includes(parsed) ? parsed : 'clean-edit',
        selectedRouteId: null,
        selectedLeg: 'outbound',
        pathOverlayMode: 'selected-leg',
      };
    }
    return {
      editViewMode: parsed.editViewMode && MODES.includes(parsed.editViewMode) ? parsed.editViewMode : 'clean-edit',
      selectedRouteId: typeof parsed.selectedRouteId === 'string' ? parsed.selectedRouteId : null,
      selectedLeg: parsed.selectedLeg === 'return' ? 'return' : 'outbound',
      pathOverlayMode: parsed.pathOverlayMode && OVERLAY_MODES.includes(parsed.pathOverlayMode) ? parsed.pathOverlayMode : 'selected-leg',
    };
  } catch {
    return { editViewMode: 'clean-edit', selectedRouteId: null, selectedLeg: 'outbound', pathOverlayMode: 'selected-leg' };
  }
}

function persist(state: Pick<WorldFlightEditorState, 'editViewMode' | 'selectedRouteId' | 'selectedLeg' | 'pathOverlayMode'>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore unavailable storage */
  }
}

export const useWorldFlightEditorStore = create<WorldFlightEditorState>((set, get) => ({
  ...loadState(),
  setEditViewMode: (editViewMode) => {
    set({ editViewMode });
    persist(get());
  },
  setSelectedRouteId: (selectedRouteId) => {
    set({ selectedRouteId });
    persist(get());
  },
  setSelectedLeg: (selectedLeg) => {
    set({ selectedLeg });
    persist(get());
  },
  setPathOverlayMode: (pathOverlayMode) => {
    set({ pathOverlayMode });
    persist(get());
  },
}));
