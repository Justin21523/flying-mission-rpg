import { useEffect } from 'react';
import { tick } from './trafficIncidentRunner';

// Phase F — mounts the Traffic Incident Director loop once (non-visual), beside the rescue IncidentDirector.
// All staging logic lives in trafficIncidentRunner (so this file only exports a component, for fast-refresh).
export const TrafficIncidentDirector = () => {
  useEffect(() => {
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return null;
};
