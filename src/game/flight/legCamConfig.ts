// Pure conversion between a per-leg flight-camera config (distance / height / orbit-angle behind the craft) and
// the camera's local offset from the craft (matching FlightCamera's `(dist*sin a, height, dist*cos a)`).
const DEG = Math.PI / 180;

export function localFromConfig(distance: number, height: number, angleDeg: number): [number, number, number] {
  const a = angleDeg * DEG;
  return [distance * Math.sin(a), height, distance * Math.cos(a)];
}

export function configFromLocal(x: number, y: number, z: number): { distance: number; height: number; angleDeg: number } {
  return {
    distance: Math.round(Math.hypot(x, z) * 100) / 100,
    height: Math.round(y * 100) / 100,
    angleDeg: Math.round((Math.atan2(x, z) / DEG) * 100) / 100,
  };
}
