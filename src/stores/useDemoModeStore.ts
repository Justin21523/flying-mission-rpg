import { create } from 'zustand';
import type { PortfolioDemoMode } from '../types/demoTypes';

const STORAGE_KEY = 'aero-rescue-portfolio-demo-mode-v1';

export const DEFAULT_PORTFOLIO_DEMO_MODE: PortfolioDemoMode = {
  enabled: true,
  landingDismissed: false,
  hideDebugByDefault: true,
  showFeatureHighlights: true,
  showControlsOverlay: true,
  enableGuidedHints: true,
  enableDemoCheckpoints: true,
  defaultStageId: 'stage_sunny_harbor_emergency',
  defaultCharacterIds: ['char_jett', 'char_donnie'],
  defaultSupportIds: ['char_chase', 'char_paul'],
};

type DemoModeState = PortfolioDemoMode & {
  setEnabled: (enabled: boolean) => void;
  dismissLanding: () => void;
  showLanding: () => void;
  updateDemoMode: (patch: Partial<PortfolioDemoMode>) => void;
  resetDemoMode: () => void;
};

function load(): PortfolioDemoMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PORTFOLIO_DEMO_MODE;
    const parsed = JSON.parse(raw) as Partial<PortfolioDemoMode>;
    return { ...DEFAULT_PORTFOLIO_DEMO_MODE, ...parsed };
  } catch {
    return DEFAULT_PORTFOLIO_DEMO_MODE;
  }
}

function persist(state: PortfolioDemoMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* localStorage can be unavailable in test/private contexts */
  }
}

function snapshot(state: DemoModeState): PortfolioDemoMode {
  return {
    enabled: state.enabled,
    landingDismissed: state.landingDismissed,
    hideDebugByDefault: state.hideDebugByDefault,
    showFeatureHighlights: state.showFeatureHighlights,
    showControlsOverlay: state.showControlsOverlay,
    enableGuidedHints: state.enableGuidedHints,
    enableDemoCheckpoints: state.enableDemoCheckpoints,
    defaultStageId: state.defaultStageId,
    defaultCharacterIds: state.defaultCharacterIds,
    defaultSupportIds: state.defaultSupportIds,
  };
}

export const useDemoModeStore = create<DemoModeState>((set) => ({
  ...load(),
  setEnabled: (enabled) => set((state) => {
    const next = { ...snapshot(state), enabled };
    persist(next);
    return next;
  }),
  dismissLanding: () => set((state) => {
    const next = { ...snapshot(state), landingDismissed: true };
    persist(next);
    return next;
  }),
  showLanding: () => set((state) => {
    const next = { ...snapshot(state), landingDismissed: false };
    persist(next);
    return next;
  }),
  updateDemoMode: (patch) => set((state) => {
    const next = { ...snapshot(state), ...patch };
    persist(next);
    return next;
  }),
  resetDemoMode: () => {
    persist(DEFAULT_PORTFOLIO_DEMO_MODE);
    set(DEFAULT_PORTFOLIO_DEMO_MODE);
  },
}));

export function shouldHideDeveloperDebug(): boolean {
  const state = useDemoModeStore.getState();
  return state.enabled && state.hideDebugByDefault;
}
