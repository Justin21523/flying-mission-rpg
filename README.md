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
| `npm run e2e` / `npm run test:e2e` | Playwright end-to-end (boots the dev server on :4317, drives a browser) |
| `npm run test:e2e:ui` | Playwright in interactive UI mode |
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

## Game flow (vertical slice)

The typed `GameStateMachine` (`src/game/core/GameStateMachine.ts`) drives one legal transition at a time:

```
MISSION_CONTROL → MISSION_BRIEFING → CHARACTER_SELECTION → HANGAR → PLATFORM_ALIGNMENT →
LAUNCH_PREPARATION → LAUNCH_TUNNEL → BASE_FLY_AROUND → CLOUD_ASCENT → WORLD_FLIGHT →
DESTINATION_APPROACH → TRANSFORMATION → DESCENT → LANDING → NPC_GREETING → MISSION_GAMEPLAY →
MISSION_COMPLETE → RETURN_TRANSFORMATION → RETURN_FLIGHT → BASE_APPROACH → HANGAR_RETURN → MISSION_RESULTS
```

Per-phase detail (entry/exit/controller/scene/cleanup) is in `docs/GAME_FLOW.md`.

## Debug & Edit Mode

- **F1** — Edit Mode (authoring gizmos + Editor Hub). Works in both scene modes.
- **Leva dev panel** → toggle **FSM debug** to reveal the debug overlays:
  - **🤖 Auto Playtester** — runs the whole core flow automatically (debug/test only; see below).
  - **⚡ Performance** — FPS / frame time / pool & effect counts / quality (gate: Settings → Graphics → perf HUD).
  - **🩺 Runtime Health** — ok/warning/error, stuck-phase, save status, residual effects, export diagnostics JSON.
  - **💾 Save Debug** — save now / reload / clear / export / import / reset progress / unlock all / reset settings.

### Auto Playtester
A **debug/test-only** automated player (`src/game/testing/`) that drives the core flow one legal transition at
a time, issuing real inputs (synthetic key events for the 3D controllers) and the existing debug fast-forward
hooks for the long flight / transformation, asserting each step. It is **never** a normal-player feature.
Trigger it from the panel, or from the console / Playwright via `window.__autoPlaytester.start()`. Details in
`docs/AUTO_PLAYTESTER.md`.

## Save system

A **versioned** save (`schemaVersion`, `progress`, `stats`, `settingsSnapshot`, `lastSession`) lives in
`localStorage` behind a storage abstraction (`src/game/save/`). It is created on first run, migrated on schema
bumps (v1 → v2 included), validated with zod (corrupt → safe default), and debounce-persisted (never per-frame).
The settings stores remain the runtime source of truth; the save **mirrors** them (and re-applies on import).
The POLI `world`-mode multi-slot save is a separate, untouched system. Details in `docs/SAVE_SYSTEM.md`.

## LLM provider

LLM only generates **flavour text** (mission / dialogue), validated by zod, with a local-template fallback — it
**never** controls game rules. The only provider is a local **llama.cpp** server (Qwen2.5-14B-Instruct);
disabled by default so the game is fully playable offline. No API keys are hardcoded. See `docs/LLM_PROVIDER.md`.

## Testing

- **Unit / runtime** (`vitest`, `*.test.ts` beside the code): state machine, save + migration, progress/stats,
  settings persistence, world-flight, transformation, objectives, Phaser bridge, support runtime, audio,
  quality presets, and the AutoPlaytester runner.
- **E2E** (`playwright`, `e2e/`): `core-flow` (AutoPlaytester reaches MISSION_COMPLETE), `settings` + `save`
  persistence across reload, and the boot smoke test.

## Replacing assets / GLTF character pipeline

Drop-in folders are auto-discovered (see the table above). Character model refs are centralised in
`src/data/assets/assetRegistry.ts` (`resolveCharacterModel(id, 'plane'|'robot')`, placeholder fallback so the
build never fails for not-yet-shipped art). Point a character's `modelAssetId` / `planeModelAssetId` and
transformation clip names from the **🛩 Characters** / **✨ Transform** Edit-Mode tabs — no code change. Full
pipeline in `docs/ASSET_REPLACEMENT.md` + `docs/GLTF_CHARACTER_PIPELINE.md`.

## Manual QA checklist (vertical slice)

- [ ] Homepage mounts the canvas
- [ ] Mission Control → pick a mission · Character Selection → pick a character
- [ ] Hangar → align to platform → launch
- [ ] World flight reaches the destination
- [ ] Transformation completes (vehicle → robot); replay doesn't stack effects
- [ ] Descent → safe landing → NPC greeting
- [ ] Start + complete an objective (repair objective opens/closes the Phaser mini-game)
- [ ] Mission Complete shows
- [ ] Settings (quality / volume / reduce motion) persist across reload
- [ ] Save export → import round-trips; Runtime Health shows `ok`
- [ ] Auto Playtester completes a full run
- [ ] `npm run check` + `npm run test` + `npm run build` + `npm run e2e` green

## Known limitations

- Character / NPC / destination art is **placeholder** (primitives + swappable GLTF interfaces); ship real
  GLTFs via the asset registry + Edit-Mode tabs.
- Destination scenes are largely grey-box; audio is **procedural/synth** (no audio files) — both are designed
  for drop-in replacement.
- Full-control support dispatch is a runtime shell (deep cross-phase re-entry deferred); see
  `docs/KNOWN_LIMITATIONS.md`.
- The LLM provider defaults to disabled (local llama.cpp only). The inherited POLI `world` mode remains on disk
  as reference.
- The Auto Playtester uses debug fast-forward hooks for the long flight/transformation segments (it still walks
  every phase via legal transitions — it never fakes the ending).

Personal / non-commercial / research use only. No copyrighted content.
