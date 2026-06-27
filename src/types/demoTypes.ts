export type PortfolioDemoMode = {
  enabled: boolean;
  landingDismissed: boolean;
  hideDebugByDefault: boolean;
  showFeatureHighlights: boolean;
  showControlsOverlay: boolean;
  enableGuidedHints: boolean;
  enableDemoCheckpoints: boolean;
  defaultStageId: string;
  defaultCharacterIds: string[];
  defaultSupportIds: string[];
};

export type DemoChecklistItemId =
  | 'app-starts'
  | 'campaign-map-loads'
  | 'stage-1-unlocked'
  | 'stage-1-briefing-loads'
  | 'character-select-works'
  | 'launch-flight-landing-or-skip'
  | 'stage-1-gameplay-starts'
  | 'objective-hud-appears'
  | 'basic-combat-works'
  | 'incident-can-resolve'
  | 'obstacle-can-clear'
  | 'stage-can-complete'
  | 'stage-clear-ui-appears'
  | 'stage-2-unlocks'
  | 'edit-mode-opens'
  | 'debug-hidden-in-demo'
  | 'build-succeeds';

export type DemoChecklistItem = {
  id: DemoChecklistItemId;
  label: string;
  status: 'pass' | 'warning' | 'fail';
  detail?: string;
};

export type DemoValidationReport = {
  status: 'pass' | 'warning' | 'fail';
  items: DemoChecklistItem[];
  generatedAt: string;
};

export type PortfolioRecordingTarget =
  | 'landing'
  | 'campaign-map'
  | 'stage-briefing'
  | 'stage-gameplay'
  | 'boss-demo'
  | 'edit-mode'
  | 'rc-panel';

export type PortfolioRecordingMode = {
  enabled: boolean;
  currentShotId: string;
  hideDebug: boolean;
  cinematicVfx: boolean;
  showSafeFrame: boolean;
  showShotChecklist: boolean;
  selectedStageId: string;
};

export type PortfolioShotDefinition = {
  id: string;
  title: string;
  purpose: string;
  target: PortfolioRecordingTarget;
  recommendedAction: string;
  acceptanceText: string;
  tags: string[];
  stageId?: string;
};
