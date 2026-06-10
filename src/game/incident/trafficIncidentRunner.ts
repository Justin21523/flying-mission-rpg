import { Vector3 } from 'three';
import { getScenarios, getScenarioDirectorCfg } from '../../stores/editorTrafficScenarioStore';
import { useIncidentScenarioStore, countActive, type ScenarioInstance } from '../../stores/incidentScenarioStore';
import { usePlayerStore } from '../../stores/playerStore';
import { useFlagStore } from '../../stores/flagStore';
import { getPaths } from '../../stores/editorPathStore';
import { getCurve, samplePos } from '../path/pathCurve';
import { setPathBlocked, removeBlocker } from '../path/pathBlocks';
import { unregisterCollision } from '../collision/collisionRegistry';
import { useIncidentFollowerStore } from '../../stores/incidentFollowerStore';
import { runIncidentAction } from './runIncidentAction';
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

// Start a scenario instance now (used by the auto-loop + the Debug ▶ trigger).
export function startScenario(scenarioId: string): void {
  const def = getScenarios().find((d) => d.id === scenarioId);
  if (!def) return;
  const areaId = usePlayerStore.getState().currentAreaId;
  const { pathId, pos } = pickLocation(areaId);
  const instance: ScenarioInstance = {
    instanceId: `inst_${Date.now().toString(36)}${counter++}`,
    scenarioId: def.id, name: def.name, areaId, pathId, position: pos,
    startTime: nowSec(), ranSteps: [], entities: [], blockedPaths: [],
  };
  useIncidentScenarioStore.getState().start(instance);
  for (const a of def.setupActions) runIncidentAction(a, instance.instanceId);
}

function resolveInstance(inst: ScenarioInstance, def: IncidentScenarioDefinition | undefined): void {
  const store = useIncidentScenarioStore.getState();
  const live = store.instances.find((x) => x.instanceId === inst.instanceId) ?? inst;
  if (def) for (const a of def.cleanupActions) runIncidentAction(a, live.instanceId);
  // Cleanup: unregister spawned collidables, unblock roads, drop the scene blocker.
  for (const e of live.entities) unregisterCollision(e.id);
  for (const pid of live.blockedPaths) setPathBlocked(pid, false);
  removeBlocker(`${live.instanceId}#blk`);
  useIncidentFollowerStore.getState().removeForInstance(live.instanceId); // despawn scenario vehicles
  store.end(live.instanceId);
  lastResolved.set(live.scenarioId, nowSec());
  playSfx('rescueSuccess');
}

function resolved(inst: ScenarioInstance, def: IncidentScenarioDefinition): boolean {
  const t = nowSec();
  const elapsed = t - inst.startTime;
  for (const c of def.resolutionConditions) {
    if (c.type === 'timeout' && elapsed >= c.seconds) return true;
    if (c.type === 'flagSet' && useFlagStore.getState().hasFlag(c.flag)) return true;
    if (c.type === 'victimRescued' && useFlagStore.getState().hasFlag(`traffic_resolved_${inst.scenarioId}`)) return true;
    if (c.type === 'playerReached') {
      const p = usePlayerStore.getState().position;
      if (p && Math.hypot(p.x - inst.position[0], p.z - inst.position[2]) <= c.radius) return true;
    }
  }
  return false;
}

export function tick(): void {
  const cfg = getScenarioDirectorCfg();
  const scenarios = getScenarios();
  const store = useIncidentScenarioStore.getState();
  const t = nowSec();

  // Advance + resolve active instances (snapshot first; resolveInstance mutates the store).
  for (const inst of [...store.instances]) {
    const def = scenarios.find((d) => d.id === inst.scenarioId);
    if (!def) { resolveInstance(inst, undefined); continue; }
    const elapsed = t - inst.startTime;
    let ran = inst.ranSteps;
    def.timeline.forEach((step, i) => {
      if (elapsed >= step.atSeconds && !ran.includes(i)) {
        for (const a of step.actions) runIncidentAction(a, inst.instanceId);
        ran = [...ran, i];
        store.update(inst.instanceId, { ranSteps: ran });
      }
    });
    if (resolved(inst, def)) resolveInstance(inst, def);
  }

  // Auto-spawn loop.
  if (!cfg.enabled) { spawnTimer = 0; return; }
  spawnTimer += 1;
  if (spawnTimer < cfg.intervalSec) return;
  spawnTimer = 0;
  if (store.instances.length >= cfg.maxConcurrent) return;

  const eligible = scenarios.filter((d) => d.enabled
    && countActive(d.id) < d.maxConcurrentInstances
    && t - (lastResolved.get(d.id) ?? -Infinity) >= d.cooldown);
  if (eligible.length === 0) return;
  const total = eligible.reduce((s, d) => s + Math.max(0, d.weight), 0);
  if (total <= 0) return;
  let r = Math.random() * total;
  let chosen = eligible[0];
  for (const d of eligible) { r -= Math.max(0, d.weight); if (r <= 0) { chosen = d; break; } }
  startScenario(chosen.id);
}
