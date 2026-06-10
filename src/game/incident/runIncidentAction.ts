import type { IncidentAction } from '../../types/trafficIncident';
import { useIncidentScenarioStore, type SpawnedEntity } from '../../stores/incidentScenarioStore';
import { useFlagStore } from '../../stores/flagStore';
import { setPathBlocked, addBlocker } from '../path/pathBlocks';
import { registerCollision } from '../collision/collisionRegistry';
import { emitGameEvent } from '../collision/gameEventBus';

// Phase F — execute one IncidentAction against a running scenario instance. Spawns entities (registered as
// collidables), blocks roads (followers reroute via pathBlocks), surfaces NPC reactions + events on the game
// bus, and optionally notifies the rescue system. Cleanup (unregister / unblock) is done by the director.
const COLOR: Record<string, string> = { vehicle: '#f87171', obstacle: '#a16207', hazard: '#ef4444' };

function curInstance(instanceId: string) {
  return useIncidentScenarioStore.getState().instances.find((x) => x.instanceId === instanceId);
}

// Place a spawned entity in a small spread around the scene centre so multiple entities don't overlap.
function spreadPos(base: [number, number, number], n: number): [number, number, number] {
  const ring = [[0, 0], [2, 1.5], [-2, 1.5], [2, -1.5], [-2, -1.5]];
  const [ox, oz] = ring[n % ring.length];
  return [base[0] + ox, base[1], base[2] + oz];
}

export function runIncidentAction(action: IncidentAction, instanceId: string): void {
  const inst = curInstance(instanceId);
  if (!inst) return;
  const store = useIncidentScenarioStore.getState();

  switch (action.type) {
    case 'spawnVehicle': {
      const id = `${instanceId}#e${inst.entities.length}`;
      const e: SpawnedEntity = { id, kind: 'vehicle', position: spreadPos(inst.position, inst.entities.length), color: COLOR.vehicle, label: action.vehicleType ?? 'vehicle' };
      registerCollision({ objectId: id, objectType: 'vehicle', tags: ['incident', 'vehicle'], enabled: true });
      store.addEntity(instanceId, e);
      return;
    }
    case 'spawnObstacle': {
      const id = `${instanceId}#e${inst.entities.length}`;
      const e: SpawnedEntity = { id, kind: 'obstacle', position: action.position ?? spreadPos(inst.position, inst.entities.length), color: COLOR.obstacle, label: action.obstacleId };
      registerCollision({ objectId: id, objectType: 'incidentObject', tags: ['incident', 'obstacle'], enabled: true });
      store.addEntity(instanceId, e);
      return;
    }
    case 'setVehicleState': {
      // participant 'vN' → the Nth vehicle entity.
      const n = parseInt(action.participant.replace(/\D/g, ''), 10) || 0;
      const vehicles = inst.entities.filter((x) => x.kind === 'vehicle');
      const target = vehicles[n];
      if (target) {
        store.update(instanceId, {
          entities: inst.entities.map((x) => (x.id === target.id ? { ...x, state: action.state, color: action.state === 'normal' ? COLOR.vehicle : '#fbbf24' } : x)),
        });
      }
      return;
    }
    case 'blockRoad': {
      const pid = action.pathId || inst.pathId;
      if (pid) {
        setPathBlocked(pid, true);
        if (!inst.blockedPaths.includes(pid)) store.update(instanceId, { blockedPaths: [...inst.blockedPaths, pid] });
      }
      // Also a world blocker at the scene so followers on any nearby path slow down.
      addBlocker(`${instanceId}#blk`, inst.areaId, inst.position[0], inst.position[2]);
      return;
    }
    case 'npcReaction':
      addBlocker(`${instanceId}#blk`, inst.areaId, inst.position[0], inst.position[2]);
      emitGameEvent({ kind: 'npcReaction', payload: action.reaction, x: inst.position[0], y: inst.position[1], z: inst.position[2] });
      return;
    case 'notifyRescue':
      // Flag + event the call-for-rescue; a real rescue-incident bridge by id/category is an additive hook.
      useFlagStore.getState().setFlag(`traffic_notified_${inst.scenarioId}`);
      emitGameEvent({ kind: 'gameEvent', payload: 'notifyRescue', x: inst.position[0], y: inst.position[1], z: inst.position[2] });
      return;
    case 'playAnimation':
      emitGameEvent({ kind: 'reaction', payload: action.animationId, x: inst.position[0], y: inst.position[1], z: inst.position[2] });
      return;
    case 'emitEvent':
      emitGameEvent({ kind: 'gameEvent', payload: action.event, x: inst.position[0], y: inst.position[1], z: inst.position[2] });
      return;
    case 'wait':
      return; // timeline timing handles the delay
  }
}
