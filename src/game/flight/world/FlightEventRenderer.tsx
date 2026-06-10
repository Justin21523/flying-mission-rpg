import { useFlightEventVersion, ACTIVE_FLIGHT_EVENTS } from './flightEventRuntime';
import { FlightEventVisual } from './FlightEventVisual';

// Pure VIEW over the director's live events — renders each active event at its fixed world position with its
// distinct FlightEventVisual. Re-renders only when the director bumps the version (sparse spawn/despawn);
// the heavy per-frame work stays in the instanced clouds/streaks + the visuals' own local animation.
export const FlightEventRenderer = () => {
  useFlightEventVersion((s) => s.v); // re-render on spawn/resolve
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
