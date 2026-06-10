// Eagerly map the project's character card art (src/assets/cards/*.jpeg) to served URLs. These are
// git-ignored binaries: present locally and bundled by Vite. A fresh clone without the art → empty map,
// and cards gracefully fall back to a colour swatch.
const modules = import.meta.glob('../../assets/cards/*.jpeg', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const byFile: Record<string, string> = {};
for (const [path, url] of Object.entries(modules)) {
  const file = path.split('/').pop();
  if (file) byFile[file] = url;
}

export function cardImageUrl(name?: string): string | undefined {
  return name ? byFile[name] : undefined;
}
