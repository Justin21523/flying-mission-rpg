// POLI — auto-discovered HDRI sky panoramas. Drop a CC0 .hdr/.exr into `public/hdri/` (served at /hdri/...)
// or `src/assets/hdri/` (bundled) and it appears in the 🌤 Environment tab's HDRI picker — no registry edits.
// HDRIs give a photoreal sky + matching image-based lighting. Use CC0 sources (Poly Haven, ambientCG).

export interface HdriEntry { id: string; url: string; label: string }

// Bundled (src/assets/hdri) → hashed URLs via Vite; and public/hdri served verbatim at /hdri/...
const SRC = import.meta.glob('/src/assets/hdri/**/*.{hdr,exr}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const PUBLIC_KEYS = Object.keys(import.meta.glob('/public/hdri/**/*.{hdr,exr}'));

const labelFor = (path: string): string => {
  const file = path.split('/').pop() ?? path;
  return file.replace(/\.(hdr|exr)$/i, '').replace(/[_-]+/g, ' ');
};

export const HDRI_LIST: HdriEntry[] = [
  ...Object.entries(SRC).map(([path, url]) => ({ id: path, url, label: labelFor(path) })),
  ...PUBLIC_KEYS.map((path) => { const url = path.replace('/public', ''); return { id: path, url, label: labelFor(path) }; }),
].sort((a, b) => a.label.localeCompare(b.label));

export function resolveHdriUrl(idOrUrl: string | undefined): string | undefined {
  if (!idOrUrl) return undefined;
  const hit = HDRI_LIST.find((h) => h.id === idOrUrl || h.url === idOrUrl);
  return hit?.url ?? idOrUrl; // allow a raw path/URL too
}
