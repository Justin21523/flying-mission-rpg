import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { getPath } from '../../../stores/editorPathStore';
import { getCurve, samplePos, sampleTangent } from '../../path/pathCurve';
import { getActivePathId, getActiveRoute, getActiveEventPool } from './worldRoute';
import { getFlightTuning } from '../../../stores/game/editorFlightStore';
import { pickEvent } from './flightEventModel';
import { segmentAtU, allowedKindsAtU, eventDensityAtU } from './WorldFlightRouteRuntime';
import { flightHandle } from '../flightHandle';
import { useWorldFlightRuntimeStore } from '../../../stores/game/worldFlightRuntimeStore';
import { useFlightScoreStore } from '../../../stores/game/flightScoreStore';
import { crossedMilestones } from './flightMilestones';
import {
  ACTIVE_FLIGHT_EVENTS,
  useFlightEventVersion,
  clearActiveFlightEvents,
  activeKinds,
  activeBlockingCount,
  flightDirectorDebug,
} from './flightEventRuntime';
import type { FlightEventKind } from '../../../types/game/flightEvent';

// The world-flight EVENT DIRECTOR (logic only — renders nothing). One useFrame: it gates spawns by the
// editable global gap × the current segment's eventDensity, picks an event from the route pool via the pure
// flightEventModel (respecting cooldown, segment allowed-kinds, route-progress/altitude windows, overlap
// rules and a blocking cap), places it ahead on the 航道 as a static world object, and resolves events on
// fly-through (collect / energy / radio). Lifecycle + a debug snapshot live in flightEventRuntime.
const AHEAD_U = 0.018;
const EVENT_CLEAR_SEC = 2.5;
const COLLECT_KINDS: ReadonlySet<FlightEventKind> = new Set(['collectible', 'energy_refill', 'stunt_ring', 'boost']);
const REWARD_KINDS: ReadonlySet<FlightEventKind> = new Set(['collectible', 'energy_refill', 'stunt_ring', 'boost']);

const _pos = new Vector3();
const _tan = new Vector3();
const _perp = new Vector3();
let _idSeq = 0;

export const FlightEventDirectorHost = () => {
  const lastSpawn = useRef<Record<string, number>>({});
  const globalTimer = useRef(0);
  const elapsed = useRef(0);
  const clearTimer = useRef(0);
  const prevU = useRef(0); // last route progress (for distance-milestone bonuses)

  useEffect(() => {
    clearActiveFlightEvents();
    lastSpawn.current = {};
    globalTimer.current = 0;
    elapsed.current = 0;
    prevU.current = 0;
    return () => clearActiveFlightEvents();
  }, []);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    elapsed.current += dt;
    globalTimer.current += dt;
    const tuning = getFlightTuning();
    const route = getActiveRoute();
    const def = getPath(getActivePathId());
    const cc = def ? getCurve(def) : null;
    if (!cc || !route) return;
    const routeU = flightHandle.routeU;
    const rt = useWorldFlightRuntimeStore.getState();
    let changed = false;

    // Distance milestones — a one-off bonus each quarter of the route.
    for (const m of crossedMilestones(prevU.current, routeU, 0.25)) {
      useFlightScoreStore.getState().awardBonus([flightHandle.pos.x, flightHandle.pos.y + 2, flightHandle.pos.z], 15, 8, `${Math.round(m * 100)}%`);
    }
    prevU.current = routeU;

    // resolve / recycle (iterate backwards so splices are safe)
    for (let i = ACTIVE_FLIGHT_EVENTS.length - 1; i >= 0; i--) {
      const ev = ACTIVE_FLIGHT_EVENTS[i];
      const age = elapsed.current - ev.bornAt;
      if (!ev.resolved) {
        // Magnet — reward pickups within range curve toward the craft (the renderer draws at ev.pos).
        if (tuning.worldMagnetRadius > 0 && REWARD_KINDS.has(ev.def.kind)) {
          const mx = flightHandle.pos.x - ev.pos[0], my = flightHandle.pos.y - ev.pos[1], mz = flightHandle.pos.z - ev.pos[2];
          if (mx * mx + my * my + mz * mz < tuning.worldMagnetRadius * tuning.worldMagnetRadius) {
            const pull = Math.min(1, dt * 6);
            ev.pos[0] += mx * pull; ev.pos[1] += my * pull; ev.pos[2] += mz * pull;
          }
        }
        const dx = ev.pos[0] - flightHandle.pos.x;
        const dy = ev.pos[1] - flightHandle.pos.y;
        const dz = ev.pos[2] - flightHandle.pos.z;
        const reach = ev.def.size + 5;
        if (dx * dx + dy * dy + dz * dz < reach * reach) {
          ev.resolved = true;
          ev.state = 'resolving';
          const d = ev.def;
          if (d.kind === 'collectible') rt.addCollectible(d.value ?? 1);
          else if (d.kind === 'energy_refill') rt.addEnergy(d.value ?? 20);
          else if (d.kind === 'radio' && d.radioText) rt.setRadio(d.radioText);
          // Reward + celebration (exp/coins + combo + dancing-clone popup) for rewarding kinds.
          if (REWARD_KINDS.has(d.kind)) {
            useFlightScoreStore.getState().award(d, [ev.pos[0], ev.pos[1], ev.pos[2]], ev.golden);
            // Perfect ring — passed near the ring's centre → a small extra bonus.
            if (d.kind === 'stunt_ring' && dx * dx + dy * dy + dz * dz < (d.size * 0.6) * (d.size * 0.6)) {
              useFlightScoreStore.getState().awardBonus([ev.pos[0], ev.pos[1] + 1, ev.pos[2]], 8, 4, 'Perfect!');
            }
          }
          rt.setActiveEvent(d.label);
          clearTimer.current = EVENT_CLEAR_SEC;
        }
      }
      const collected = ev.resolved && COLLECT_KINDS.has(ev.def.kind);
      if (collected || age > ev.def.durationSec || routeU > ev.spawnU + 0.01) {
        ev.state = 'completed';
        ACTIVE_FLIGHT_EVENTS.splice(i, 1); // → disposed
        changed = true;
      }
    }

    if (clearTimer.current > 0) {
      clearTimer.current -= dt;
      if (clearTimer.current <= 0) { rt.setActiveEvent(null); rt.setRadio(null); }
    }

    // spawn — gated by gap / eventDensity, max-active, and route-progress
    const gap = tuning.worldEventSpawnGap / Math.max(0.1, eventDensityAtU(route, routeU));
    if (globalTimer.current >= gap && ACTIVE_FLIGHT_EVENTS.length < tuning.worldEventMaxActive && routeU < 0.985) {
      const chosen = pickEvent(getActiveEventPool(), elapsed.current, lastSpawn.current, Math.random, {
        allowedKinds: allowedKindsAtU(route, routeU),
        routeU,
        altitude: flightHandle.altitude,
        activeKinds: activeKinds(),
        blockingActiveCount: activeBlockingCount(),
        maxBlocking: 1,
      });
      if (chosen) {
        const aheadU = Math.min(0.999, routeU + AHEAD_U);
        samplePos(cc.curve, aheadU, _pos);
        sampleTangent(cc.curve, aheadU, _tan);
        _perp.set(_tan.z, 0, -_tan.x).normalize();
        // spawnSide chooses the lateral sign (center≈0, left/right pinned, either=random ±).
        const side = chosen.spawnSide ?? 'either';
        const mag = Math.random() * chosen.lateralRange;
        const lateral = side === 'center' ? 0 : side === 'left' ? -mag : side === 'right' ? mag : (Math.random() * 2 - 1) * chosen.lateralRange;
        _pos.addScaledVector(_perp, lateral);
        _pos.y += (Math.random() - 0.5) * 4;
        ACTIVE_FLIGHT_EVENTS.push({
          id: `ev_${_idSeq++}`,
          def: chosen,
          pos: [_pos.x, _pos.y, _pos.z],
          spawnU: aheadU,
          segmentId: segmentAtU(route, routeU)?.id,
          bornAt: elapsed.current,
          state: 'active',
          resolved: false,
          golden: REWARD_KINDS.has(chosen.kind) && Math.random() < tuning.goldenChance,
        });
        lastSpawn.current[chosen.id] = elapsed.current;
        globalTimer.current = 0;
        flightDirectorDebug.lastRejected = null;
        changed = true;
      } else {
        flightDirectorDebug.lastRejected = 'no eligible event (cooldown / segment / overlap / progress)';
        globalTimer.current = 0;
      }
    }

    // debug snapshot
    flightDirectorDebug.routeId = route.id;
    flightDirectorDebug.progress = routeU;
    flightDirectorDebug.segmentId = segmentAtU(route, routeU)?.id ?? '—';
    flightDirectorDebug.cooldowns = Object.entries(lastSpawn.current)
      .map(([id, t]) => ({ id, remaining: Math.max(0, (getActiveEventPool().find((e) => e.id === id)?.minGapSec ?? 0) - (elapsed.current - t)) }))
      .filter((c) => c.remaining > 0);

    if (changed) useFlightEventVersion.getState().bump();
  });

  return null;
};
