import { create } from 'zustand';
import type { PortfolioRecordingMode } from '../types/demoTypes';
import { PORTFOLIO_SHOT_LIST } from '../data/demo/portfolioShotList';

const STORAGE_KEY = 'aero-rescue-portfolio-recording-mode-v1';

export const DEFAULT_PORTFOLIO_RECORDING_MODE: PortfolioRecordingMode = {
  enabled: false,
  currentShotId: PORTFOLIO_SHOT_LIST[0]?.id ?? 'shot_demo_landing',
  hideDebug: true,
  cinematicVfx: true,
  showSafeFrame: true,
  showShotChecklist: true,
  selectedStageId: 'stage_sunny_harbor_emergency',
};

type RecordingStore = PortfolioRecordingMode & {
  updateRecordingMode: (patch: Partial<PortfolioRecordingMode>) => void;
  setCurrentShot: (shotId: string) => void;
  resetRecordingMode: () => void;
};

function load(): PortfolioRecordingMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_PORTFOLIO_RECORDING_MODE, ...(JSON.parse(raw) as Partial<PortfolioRecordingMode>) } : DEFAULT_PORTFOLIO_RECORDING_MODE;
  } catch {
    return DEFAULT_PORTFOLIO_RECORDING_MODE;
  }
}

function persist(state: PortfolioRecordingMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* localStorage can be unavailable in tests/private contexts */
  }
}

function pickState(state: RecordingStore): PortfolioRecordingMode {
  return {
    enabled: state.enabled,
    currentShotId: state.currentShotId,
    hideDebug: state.hideDebug,
    cinematicVfx: state.cinematicVfx,
    showSafeFrame: state.showSafeFrame,
    showShotChecklist: state.showShotChecklist,
    selectedStageId: state.selectedStageId,
  };
}

export const usePortfolioRecordingStore = create<RecordingStore>((set) => ({
  ...load(),
  updateRecordingMode: (patch) => set((state) => {
    const next = { ...pickState(state), ...patch };
    persist(next);
    return next;
  }),
  setCurrentShot: (currentShotId) => set((state) => {
    const next = { ...pickState(state), currentShotId };
    persist(next);
    return next;
  }),
  resetRecordingMode: () => {
    persist(DEFAULT_PORTFOLIO_RECORDING_MODE);
    set(DEFAULT_PORTFOLIO_RECORDING_MODE);
  },
}));

export function shouldHideDebugForRecording(): boolean {
  const state = usePortfolioRecordingStore.getState();
  return state.enabled && state.hideDebug;
}
