# aero-rescue-rpg

An original, **personal / non-commercial / research-only** single-player 3D web game about anthropomorphic
flying robots: **world delivery, character dispatch, flight, transformation, landing, and rescue**. Inspired by
that *genre* — but it ships **no** official models, textures, audio, video, logos, or character art. Everything
is original codenames, primitives, self-made placeholders, original UI, and swappable GLTF interfaces.

The two design pillars are **flight feel** and **real-time 3D transformation** (vehicle ⇄ robot, replayable and
interactive — not a video swap). NPC missions exist only to give a reason to fly and transform.

> Built on the infrastructure of a finished **R3F world-builder kit**: its in-app **Edit Mode**, Editor Hub,
> i18n, save, dialogue engine, and asset auto-discovery are kept and reused. The new gameplay spine (a typed
> game state machine + flight + transformation) is being rebuilt on top, batch by batch, per
> `docs/LLMProvider Tooling 專案總控指令.pdf`.

## Quick start

```bash
npm install
npm run dev      # http://localhost:3000 (auto-opens)
```

A fresh boot shows the **grey-box base scene** (ground + grid + test cubes, orbit camera). This is the
engineering base later batches build the hangar / flight / transformation on.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server at http://localhost:3000 |
| `npm run check` | `tsc -b` + ESLint — run before every commit |
| `npm run build` | `tsc -b && vite build` (production build) |
| `npm run preview` | preview the production build |
| `npm run test` | Vitest unit/integration tests (run once) |
| `npm run test:watch` | Vitest in watch mode |
| `npm run e2e` | Playwright end-to-end (boots the dev server, drives a browser) |
| `npm run format` | Prettier write over `src/` |

E2E needs a browser the first time: `npx playwright install chromium`.

## Controls

- **F1** — toggle **Edit Mode** (flat-bright lighting, free-pan camera, transform gizmos, Editor Hub). Works in
  both scene modes.
- **Leva dev panel** (top-right, dev builds only) → **Dev → Scene**: switch between
  - `greybox` — the new game's base scene (default), and
  - `world` — the inherited kit world + its HUD (dormant reference, being phased out).
- Grey-box camera: orbit / pan / zoom with the mouse.

## Architecture (high level)

```
main.tsx (no StrictMode)
 └─ App.tsx — DOM overlays + the single <Canvas>
     ├─ Dock · Leva DevPanel · Edit-Mode panels        (always available)
     ├─ {world && …} inherited kit runtime + HUD        (dormant in grey-box)
     └─ app/GameCanvas.tsx
          CanvasErrorBoundary → <Canvas> → Suspense<Loading> → game/core/Scene.tsx
            Scene branches on devStore.sceneMode: 'greybox' | 'world'
```

DOM (React/Tailwind) and 3D (R3F) communicate **only through zustand stores**. See `LLM_PROVIDER.md` for the full
engineering rules, the Edit-Mode authoring paradigm, and the batch roadmap.

## Stack

TypeScript (strict) · React 19 · @react-three/fiber 9 · drei · @react-three/rapier · zustand · Tailwind v4 ·
Vite · Phaser 4 · Leva · zod · Howler · postprocessing (+ @react-three/postprocessing). Helpers: nanoid, clsx,
tailwind-merge, lucide-react. Tests: Vitest + Testing Library + Playwright. Path alias `@/` → `src/`.

## Replacing assets (drop-in, auto-discovered)

No manual registries — the kit globs these folders (`import.meta.glob`), HMR picks up new files without a restart:

| Folder | What to drop | Where it shows |
|---|---|---|
| `src/assets/models/` | `.glb` / `.gltf` (subfolders = categories) | Edit Mode → Assets palette |
| `src/assets/textures/` | PBR maps `name_diff/_nor_gl/_arm` (Poly Haven naming) | Environment pickers |
| `src/assets/materials/` | whole-material `.glb` (+ `.bin`) | Environment → GLTF material picker |

Large binary asset packs are **git-ignored** (the folders + their `README`/`.gitkeep` stay tracked so the
drop-in contract is documented). `public/models/` is likewise not version-controlled — drop your models in
locally. `docs/` (design source-of-truth) **is** tracked.

## Known limitations (Batch 0)

- No gameplay yet: no mission system, character selection, real base, flight, or transformation — those are
  Batch 1+. The grey-box scene + the dormant `world` mode are all that render today.
- The inherited POLI kit code is still on disk under scene mode `world`; it is reference only and will be
  replaced subsystem-by-subsystem.
- Tests are a smoke baseline (a store unit test + a canvas-boot e2e). Full coverage + the AI auto-playtester
  land in Batch 13.

Personal / non-commercial / research use only. No copyrighted content.
