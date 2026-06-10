import { Vector3 } from 'three';
import { getScenarios, getScenarioDirectorCfg } from '../../stores/editorTrafficScenarioStore';
import { useIncidentScenarioStore, countActive, type ScenarioInstance } from '../../stores/incidentScenarioStore';
import { usePlayerStore } from '../../stores/playerStore';
import { useFlagStore } from '../../stores/flagStore';
import { useWorldClockStore } from '../../stores/worldClockStore';
import { useRescueLicenseStore } from '../../stores/rescueLicenseStore';
import { useWalletStore } from '../../stores/walletStore';
import { useRelationshipStore } from '../../stores/relationshipStore';
import { useIncidentStore } from '../../stores/incidentStore';
import { useRescueOperationStore } from '../../stores/rescueOperationStore';
import { getEditorIncident } from '../../stores/editorIncidentStore';
import { getPaths } from '../../stores/editorPathStore';
import { getCurve, samplePos } from '../path/pathCurve';
import { setPathBlocked, removeBlocker } from '../path/pathBlocks';
import { clearReactionsForInstance } from './reactionField';
import { unregisterCollision } from '../collision/collisionRegistry';
import { useIncidentFollowerStore } from '../../stores/incidentFollowerStore';
import { runIncidentAction } from './runIncidentAction';
import { notifyIncident } from './incidentNotify';
import { playSfx } from '../audio/sfx';
import type { IncidentScenarioDefinition } from '../../types/trafficIncident';

// Phase F — the Traffic Incident Director. Stages IncidentScenarioDefinitions over a timeline on the path
// network: picks a path in the player's area, runs setupActions, advances the timeline, and resolves (player
// reaches the scene / timeout / flag) → cleanup restores the road. Mounted once in App (non-visual), mirroring
// the existing rescue IncidentDirector. Recoverable only: every scenario always resolves + cleans up.
const _pos = new Vector3();
const lastResolved = new Map<string, number>(); // scenarioId → seconds
let spawnTimer = 0;
let counter = 0;

function nowSec(): number { return (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000; }

// Pick a path in the area and sample its midpoint as the scene location.
function pickLocation(areaId: string): { pathId: string; pos: [number, number, number] } {
  const paths = getPaths().filter((p) => (p.areaId ?? 'rescue_hq') === areaId && (p.nodes?.length ?? 0) >= 2);
  if (paths.length === 0) return { pathId: '', pos: [0, 0.5, 0] };
  const path = paths[Math.floor(Math.random() * paths.length)];
  const cc = getCurve(path);
  if (!cc) return { pathId: path.id, pos: [0, 0.5, 0] };
  samplePos(cc.curve, 0.5, _pos);
  return { pathId: path.id, pos: [_pos.x, _pos.y, _pos.z] };
}

const MIN_SPACING = 14; // metres — don't stack scenarios, and don't spawn on top of the player

// World-time + weather gate (used by the auto-loop; the Debug ▶ trigger bypasses it).
function timeWeatherOk(def: IncidentScenarioDefinition): boolean {
  const clock = useWorldClockStore.getState();
  if (def.minWorldTime != null && clock.timeMinutes < def.minWorldTime) return false;
  if (def.maxWorldTime != null && clock.timeMinutes > def.maxWorldTime) return false;
  if (def.weatherConditions && def.weatherConditions.length > 0 && !def.weatherConditions.includes(clock.weather)) return false;
  return true;
}

// A candidate location is OK if it isn't on top of the player or an existing scenario instance.
function locationOk(pos: [number, number, number]): boolean {
  const p = usePlayerStore.getState().position;
  if (p && Math.hypot(p.x - pos[0], p.z - pos[2]) < MIN_SPACING) return false;
  for (const inst of useIncidentScenarioStore.getState().instances) {
    if (Math.hypot(inst.position[0] - pos[0], inst.position[2] - pos[2]) < MIN_SPACING) return false;
  }
  return true;
}

// Start a scenario instance now (used by the auto-loop + the Debug ▶ trigger). Auto-loop passes a pre-picked,
// spacing-checked location; the Debug trigger lets it pick its own.
export function startScenario(scenarioId: string, loc?: { pathId: string; pos: [number, number, number] }): void {
  const def = getScenarios().find((d) => d.id === scenarioId);
  if (!def) return;
  const areaId = usePlayerStore.getState().currentAreaId;
  const { pathId, pos } = loc ?? pickLocation(areaId);
  const instance: ScenarioInstance = {
    instanceId: `inst_${Date.now().toString(36)}${counter++}`,
    scenarioId: def.id, name: def.name, areaId, pathId, position: pos,
    startTime: nowSec(), ranSteps: [], entities: [], blockedPaths: [],
  };
  useIncidentScenarioStore.getState().start(instance);
  for (const a of def.setupActions) runIncidentAction(a, instance.instanceId);
  playSfx('incident');
  notifyIncident('new', def.name);
}

type ResolveCause = 'player' | 'timeout' | null;

function resolveInstance(inst: ScenarioInstance, def: IncidentScenarioDefinition | undefined, cause: ResolveCause): void {
  const store = useIncidentScenarioStore.getState();
  const live = store.instances.find((x) => x.instanceId === inst.instanceId) ?? inst;
  if (def) for (const a of def.cleanupActions) runIncidentAction(a, live.instanceId);
  // Cleanup: unregister spawned collidables, unblock roads, drop the scene blocker, despawn scenario vehicles.
  for (const e of live.entities) unregisterCollision(e.id);
  for (const pid of live.blockedPaths) setPathBlocked(pid, false);
  removeBlocker(`${live.instanceId}#blk`);
  clearReactionsForInstance(live.instanceId);
  useIncidentFollowerStore.getState().removeForInstance(live.instanceId);
  store.end(live.instanceId);
  lastResolved.set(live.scenarioId, nowSec());

  if (def && cause === 'player') {
    // Success — severity-scaled coins + a speed bonus (faster response = more), optional trust ↑.
    const elapsed = nowSec() - live.startTime;
    const timeout = def.resolutionConditions.find((c) => c.type === 'timeout');
    const window = timeout && timeout.type === 'timeout' ? timeout.seconds : 60;
    const speed = Math.max(0, Math.min(1, 1 - elapsed / window));
    const base = def.rewardCoins ?? def.severity * 10;
    useWalletStore.getState().addCoins(Math.round(base * (1 + 0.5 * speed)));
    if (def.affectsCharacterId) useRelationshipStore.getState().increaseTrust(def.affectsCharacterId, 1);
    playSfx('rescueSuccess');
    notifyIncident('resolved', def.name);
  } else if (def) {
    // Missed (timeout) — recoverable: a small trust drop + a "missed" flag + toast. No permadeath; the scene
    // simply cleared and can happen again (cooldown). "Not going" now has a (gentle) consequence.
    if (def.affectsCharacterId) useRelationshipStore.getState().decreaseTrust(def.affectsCharacterId, def.failTrust ?? 1);
    useFlagStore.getState().setFlag(`traffic_missed_${live.scenarioId}`);
    playSfx('rescueFail');
    notifyIncident('missed', def.name);
  }
}

function resolved(inst: ScenarioInstance, def: IncidentScenarioDefinition): ResolveCause {
  const t = nowSec();
  const elapsed = t - inst.startTime;
  for (const c of def.resolutionConditions) {
    if (c.type === 'flagSet' && useFlagStore.getState().hasFlag(c.flag)) return 'player';
    if (c.type === 'victimRescued' && useFlagStore.getState().hasFlag(`traffic_resolved_${inst.scenarioId}`)) return 'player';
    if (c.type === 'playerReached') {
      const p = usePlayerStore.getState().position;
      if (p && Math.hypot(p.x - inst.position[0], p.z - inst.position[2]) <= c.radius) return 'player';
    }
  }
  // Timeout is the fallback (a miss) — checked last so a player-resolve always wins.
  for (const c of def.resolutionConditions) if (c.type === 'timeout' && elapsed >= c.seconds) return 'timeout';
  return null;
}

export function tick(): void {
  const cfg = getScenarioDirectorCfg();
  const scenarios = getScenarios();
  const store = useIncidentScenarioStore.getState();
  const t = nowSec();

  // Advance + resolve active instances (snapshot first; resolveInstance mutates the store).
  for (const inst of [...store.instances]) {
    const def = scenarios.find((d) => d.id === inst.scenarioId);
    if (!def) { resolveInstance(inst, undefined, null); continue; }
    const elapsed = t - inst.startTime;
    let ran = inst.ranSteps;
    def.timeline.forEach((step, i) => {
      if (elapsed >= step.atSeconds && !ran.includes(i)) {
        for (const a of step.actions) runIncidentAction(a, inst.instanceId);
        ran = [...ran, i];
        store.update(inst.instanceId, { ranSteps: ran });
      }
    });
    // K2 unified flow: a scenario with a real rescueIncidentId is the front-end of an on-scene rescue.
    const rid = def.rescueIncidentId;
    const hasRescue = !!rid && !!getEditorIncident(rid);
    if (inst.rescueStarted && rid) {
      // Awaiting the rescue mini-game. Resolve+reward when it's completed; re-arm if the player abandoned it.
      if (useIncidentStore.getState().isResolved(rid)) { resolveInstance(inst, def, 'player'); continue; }
      const ro = useRescueOperationStore.getState();
      if (!(ro.isActive && ro.incidentId === rid)) store.update(inst.instanceId, { rescueStarted: false });
      continue; // stay staged while the rescue runs (no timeout-miss mid-rescue)
    }
    const cause = resolved(inst, def);
    if (cause === 'player' && hasRescue) {
      // Hand off to the rescue pipeline on-scene instead of resolving immediately.
      useRescueOperationStore.getState().startRescue(rid!);
      store.update(inst.instanceId, { rescueStarted: true });
      continue;
    }
    if (cause) resolveInstance(inst, def, cause);
  }

  // Auto-spawn loop.
  if (!cfg.enabled) { spawnTimer = 0; return; }
  spawnTimer += 1;
  if (spawnTimer < cfg.intervalSec) return;
  spawnTimer = 0;
  if (store.instances.length >= cfg.maxConcurrent) return;

  const rescues = useRescueLicenseStore.getState().rescuesCompleted;
  const eligible = scenarios.filter((d) => d.enabled
    && countActive(d.id) < d.maxConcurrentInstances
    && t - (lastResolved.get(d.id) ?? -Infinity) >= d.cooldown
    && rescues >= (d.requiredLicense ?? 0)
    && timeWeatherOk(d));
  if (eligible.length === 0) return;
  const total = eligible.reduce((s, d) => s + Math.max(0, d.weight), 0);
  if (total <= 0) return;
  let r = Math.random() * total;
  let chosen = eligible[0];
  for (const d of eligible) { r -= Math.max(0, d.weight); if (r <= 0) { chosen = d; break; } }
  // Spacing: pick a location away from the player + existing scenes (a few tries, else skip this tick).
  const areaId = usePlayerStore.getState().currentAreaId;
  for (let attempt = 0; attempt < 4; attempt++) {
    const loc = pickLocation(areaId);
    if (locationOk(loc.pos)) { startScenario(chosen.id, loc); return; }
  }
}
