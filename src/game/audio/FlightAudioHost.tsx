import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { FlightAudioController } from './FlightAudioController';
import { flightHandle } from '../flight/flightHandle';
import { useFlightScoreStore } from '../../stores/game/flightScoreStore';
import { useWorldFlightRuntimeStore } from '../../stores/game/worldFlightRuntimeStore';

// Batch 12.1 — drives the (otherwise dormant) FlightAudioController while a flight scene is mounted. Starts
// the engine/wind loops, updates pitch/volume from the live flight handle ~10 Hz (NOT every frame), and fires
// the crosswind/lightning warning when a hazardous flight event becomes active. Renders nothing; stops on
// unmount so the loops never leak between scenes.
export const FlightAudioHost = () => {
  const ctrl = useRef<FlightAudioController | null>(null);
  const acc = useRef(0);
  const prevLabel = useRef<string | null>(null);

  useEffect(() => {
    const c = new FlightAudioController();
    c.start();
    ctrl.current = c;
    return () => { c.stop(); ctrl.current = null; };
  }, []);

  useFrame((_, dt) => {
    const c = ctrl.current;
    if (!c) return;
    acc.current += dt;
    if (acc.current < 0.1) return;
    acc.current = 0;
    c.update({ speedNorm: flightHandle.speedNorm, throttle: flightHandle.throttle, boost: useFlightScoreStore.getState().boostActive() });
    const label = useWorldFlightRuntimeStore.getState().activeEventLabel;
    if (label && label !== prevLabel.current && /wind|storm|lightning/i.test(label)) c.crosswind();
    prevLabel.current = label;
  });

  return null;
};
