import { getAudioManager } from './AudioManager';
import { gameEventBus } from '../core/EventBus';
import { useFlightScoreStore } from '../../stores/game/flightScoreStore';
import { useWorldFlightRuntimeStore } from '../../stores/game/worldFlightRuntimeStore';

// Batch 12.1 — event-driven gameplay cues. Subscribes existing stores/events and plays cues, so gameplay
// files stay untouched. All subscriptions are returned for cleanup. Cue ids come from the gameplay/UI audio
// presets; the AudioManager debounce prevents repeats.

export function installAudioObservers(): () => void {
  const mgr = getAudioManager();

  const offPhase = gameEventBus.on('phase:changed', ({ to }) => {
    if (to === 'LANDING') mgr.play('fx.land');
    else if (to === 'MISSION_COMPLETE') mgr.play('ui.missionComplete');
  });
  const offArrived = gameEventBus.on('support:arrived', () => mgr.play('ui.supportArrived'));
  const offSwitch = gameEventBus.on('control:switched', () => mgr.play('ui.select'));

  // Flight score: collectible/coin pickups + boost edge.
  const offScore = useFlightScoreStore.subscribe((s, p) => {
    if (s.collected > p.collected) { mgr.play('fx.pickup'); mgr.play('fx.coin'); }
    if (s.boostUntil > p.boostUntil) mgr.play('fx.boost');
  });

  // World-flight runtime: collectibles + energy refills.
  const offWorld = useWorldFlightRuntimeStore.subscribe((s, p) => {
    if (s.collectibles > p.collectibles) mgr.play('fx.pickup');
    if (s.energy > p.energy + 1) mgr.play('fx.ring');
  });

  return () => { offPhase(); offArrived(); offSwitch(); offScore(); offWorld(); };
}
