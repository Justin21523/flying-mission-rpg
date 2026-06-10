import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { getPath } from '../../../stores/editorPathStore';
import { getCurve, samplePos, sampleTangent } from '../../path/pathCurve';
import { getActivePathId, getActiveEventPool } from './worldRoute';
import { getFlightTuning } from '../../../stores/game/editorFlightStore';
import { pickEvent } from './flightEventModel';
import { flightHandle } from '../flightHandle';
import { useWorldFlightRuntimeStore } from '../../../stores/game/worldFlightRuntimeStore';
import { ACTIVE_FLIGHT_EVENTS, useFlightEventVersion, clearActiveFlightEvents } from './flightEventRuntime';
import { FlightEventVisual } from './FlightEventVisual';
import type { FlightEventKind } from '../../../types/game/flightEvent';

// World-flight event director + renderer. Events are placed AHEAD on the route as static world objects;
// the craft flies past them. The director (one useFrame) picks events from the route's pool respecting
// per-event cooldowns + the editable global gap / max-active (🛩 Flight tab), and resolves them on
// fly-through (collect / energy / radio). Each event renders its distinct FlightEventVisual (so the full
// set — cloud holes, crosswind, updraft, storm, lightning, rainbow, birds, energy, stunt rings,
// collectibles, radio, formation, branch — looks the part). Count/gap/props/model are all Edit-Mode driven.
const AHEAD_U = 0.018;
const EVENT_CLEAR_SEC = 2.5;
const COLLECT_KINDS: ReadonlySet<FlightEventKind> = new Set(['collectible', 'energy_refill']);

const _pos = new Vector3();
const _tan = new Vector3();
const _perp = new Vector3();
let _idSeq = 0;

export const FlightEventLayer = () => {
  const lastSpawn = useRef<Record<string, number>>({});
  const globalTimer = useRef(0);
  const elapsed = useRef(0);
  const clearTimer = useRef(0);
  // Re-render the list when the director mutates it (sparse — spawn/resolve only).
  useFlightEventVersion((s) => s.v);

  useEffect(() => {
    clearActiveFlightEvents();
    lastSpawn.current = {};
    globalTimer.current = 0;
    elapsed.current = 0;
    return () => clearActiveFlightEvents();
  }, []);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    elapsed.current += dt;
    globalTimer.current += dt;
    const tuning = getFlightTuning();
    const def = getPath(getActivePathId());
    const cc = def ? getCurve(def) : null;
    if (!cc) return;
    const routeU = flightHandle.routeU;
    const rt = useWorldFlightRuntimeStore.getState();
    let changed = false;

    // resolve / recycle (iterate backwards so splices are safe)
    for (let i = ACTIVE_FLIGHT_EVENTS.length - 1; i >= 0; i--) {
      const ev = ACTIVE_FLIGHT_EVENTS[i];
      const age = elapsed.current - ev.bornAt;
      if (!ev.resolved) {
        const dx = ev.pos[0] - flightHandle.pos.x;
        const dy = ev.pos[1] - flightHandle.pos.y;
        const dz = ev.pos[2] - flightHandle.pos.z;
        const reach = ev.def.size + 5;
        if (dx * dx + dy * dy + dz * dz < reach * reach) {
          ev.resolved = true;
          const d = ev.def;
          if (d.kind === 'collectible') rt.addCollectible(d.value ?? 1);
          else if (d.kind === 'energy_refill') rt.addEnergy(d.value ?? 20);
          else if (d.kind === 'radio' && d.radioText) rt.setRadio(d.radioText);
          rt.setActiveEvent(d.label);
          clearTimer.current = EVENT_CLEAR_SEC;
        }
      }
      const collected = ev.resolved && COLLECT_KINDS.has(ev.def.kind);
      if (collected || age > ev.def.durationSec || routeU > ev.spawnU + 0.01) {
        ACTIVE_FLIGHT_EVENTS.splice(i, 1);
        changed = true;
      }
    }

    if (clearTimer.current > 0) {
      clearTimer.current -= dt;
      if (clearTimer.current <= 0) { rt.setActiveEvent(null); rt.setRadio(null); }
    }

    // spawn (editable gap + max-active)
    if (globalTimer.current >= tuning.worldEventSpawnGap && ACTIVE_FLIGHT_EVENTS.length < tuning.worldEventMaxActive && routeU < 0.985) {
      const chosen = pickEvent(getActiveEventPool(), elapsed.current, lastSpawn.current, Math.random);
      if (chosen) {
        const aheadU = Math.min(0.999, routeU + AHEAD_U);
        samplePos(cc.curve, aheadU, _pos);
        sampleTangent(cc.curve, aheadU, _tan);
        _perp.set(_tan.z, 0, -_tan.x).normalize();
        const lateral = (Math.random() * 2 - 1) * chosen.lateralRange;
        _pos.addScaledVector(_perp, lateral);
        _pos.y += (Math.random() - 0.5) * 4;
        ACTIVE_FLIGHT_EVENTS.push({
          id: `ev_${_idSeq++}`,
          def: chosen,
          pos: [_pos.x, _pos.y, _pos.z],
          spawnU: aheadU,
          bornAt: elapsed.current,
          resolved: false,
        });
        lastSpawn.current[chosen.id] = elapsed.current;
        globalTimer.current = 0;
        changed = true;
      }
    }

    if (changed) useFlightEventVersion.getState().bump();
  });

  return (
    <>
      {ACTIVE_FLIGHT_EVENTS.map((ev) => (
        <group key={ev.id} position={ev.pos}>
          <FlightEventVisual def={ev.def} />
        </group>
      ))}
    </>
  );
};
