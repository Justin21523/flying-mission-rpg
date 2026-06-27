import type { DemoChecklistItem } from '../../types/demoTypes';

export const DEMO_CHECKLIST_LABELS: Record<DemoChecklistItem['id'], string> = {
  'app-starts': 'App starts',
  'campaign-map-loads': 'Campaign map loads',
  'stage-1-unlocked': 'Stage 1 is unlocked',
  'stage-1-briefing-loads': 'Stage 1 briefing loads',
  'character-select-works': 'Character select works',
  'launch-flight-landing-or-skip': 'Launch / flight / landing path or skip works',
  'stage-1-gameplay-starts': 'Stage 1 gameplay starts',
  'objective-hud-appears': 'Objective HUD appears',
  'basic-combat-works': 'Basic combat works',
  'incident-can-resolve': 'Incident can be resolved',
  'obstacle-can-clear': 'Obstacle can be cleared',
  'stage-can-complete': 'Stage can be completed',
  'stage-clear-ui-appears': 'Stage clear UI appears',
  'stage-2-unlocks': 'Stage 2 unlocks',
  'edit-mode-opens': 'Edit Mode opens',
  'debug-hidden-in-demo': 'Debug hidden in Demo Mode',
  'build-succeeds': 'Build succeeds',
};

export function makeChecklistItem(id: DemoChecklistItem['id'], pass: boolean, detail?: string): DemoChecklistItem {
  return { id, label: DEMO_CHECKLIST_LABELS[id], status: pass ? 'pass' : 'fail', detail };
}
