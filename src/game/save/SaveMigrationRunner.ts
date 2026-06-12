import { SAVE_VERSION } from '../../types/game/save';
import { SAVE_MIGRATIONS } from '../../data/save/saveSchemaVersions';

// Batch 13 — chains migrations from a save's detected version up to SAVE_VERSION. Safe against unknown
// versions and migration gaps (stops + reports rather than looping forever).

export interface MigrationResult {
  data: unknown;
  fromVersion: number;
  toVersion: number;
  ranMigrations: number[];
  ok: boolean;       // reached the current version
  unknown: boolean;  // could not detect a version at all
}

/** Detect a save's schema version (v2+ uses schemaVersion; v1 used `version`). 0 = undetectable. */
export function detectSaveVersion(input: unknown): number {
  if (!input || typeof input !== 'object') return 0;
  const o = input as Record<string, unknown>;
  if (typeof o.schemaVersion === 'number') return o.schemaVersion;
  if (typeof o.version === 'number') return o.version;
  return 0;
}

export function migrateSave(input: unknown): MigrationResult {
  const fromVersion = detectSaveVersion(input);
  if (fromVersion === 0) {
    return { data: input, fromVersion: 0, toVersion: 0, ranMigrations: [], ok: false, unknown: true };
  }
  let version = fromVersion;
  let current = input;
  const ran: number[] = [];
  let guard = 0;
  while (version < SAVE_VERSION && guard < 32) {
    guard += 1;
    const m = SAVE_MIGRATIONS.find((x) => x.fromVersion === version);
    if (!m) break; // gap in the chain — stop and let the caller validate/fall back
    current = m.migrate(current);
    version = m.toVersion;
    ran.push(version);
  }
  return { data: current, fromVersion, toVersion: version, ranMigrations: ran, ok: version === SAVE_VERSION, unknown: false };
}
