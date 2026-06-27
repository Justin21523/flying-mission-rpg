import { nanoid } from 'nanoid';
import { createEditorCollection } from './createEditorCollection';
import type { RunConfig } from '../../data/progression/runConfig';
import { SEED_RUN_CONFIG } from '../../data/progression/runConfig';

// Batch N — editable arena-run tuning (single record, ⬆ Progression tab). getRunConfig() is the runtime
// accessor used by RunDirector / HUD; lives here (not in the data file) to avoid a data↔store import cycle.
export const useRunConfigStore = createEditorCollection<RunConfig>({
  storageKey: 'aero-rescue-run-config-v1',
  seed: [SEED_RUN_CONFIG],
  makeId: () => `run_config_${nanoid(6)}`,
});

export function getRunConfig(): RunConfig {
  return useRunConfigStore.getState().items.find((c) => c.id === 'run_config') ?? SEED_RUN_CONFIG;
}
