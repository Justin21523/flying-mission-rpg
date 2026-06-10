# LLM_PROVIDER.md

This file provides guidance to LLMProvider Tooling (llm_provider.ai/code) when working in this repository.

## Two sources of truth

1. **`docs/LLMProvider Tooling 專案總控指令.pdf`** — the **highest source of truth for *what* to build** (gameplay):
   the two core pillars, the full launch→flight→transform→land→rescue→return loop, the fixed stack, the
   strongly-typed ~30-state `GameStateMachine`, the suggested project structure, and the batch 0–13 plan with
   per-batch acceptance criteria. Read it before any gameplay work.
2. **This `LLM_PROVIDER.md` + the existing code** — the **highest source of truth for *how* to build**: the Edit-Mode
   editable-store paradigm, the Editor Hub, i18n, save, the dialogue condition/effect engine, asset
   auto-discovery, and the engineering discipline below.

`docs/prompt.md`, `docs/POLI_RPG_KICKOFF.md`, and other `docs/**` describe the *previous* project (a POLI RPG in
Unity/C#, then an R3F kit). **Ignore their tech stack and gameplay** — only the reusable how-to infrastructure
survives. The `救援小英雄研究遊戲*.pdf` are research references.

## Commands

```bash
npm run dev          # dev server at http://localhost:3000 (auto-opens)
npm run check        # tsc -b + eslint (run before every commit)
npm run build        # tsc -b && vite build (must stay green per batch)
npm run typecheck    # tsc -b only
npm run lint         # eslint only
npm run test         # vitest run (unit/integration)
npm run test:watch   # vitest watch
npm run e2e          # playwright (boots dev server, drives a browser)
npm run format       # prettier --write src
npm run preview      # preview the production build locally
```

Every batch must end with `npm run check` **and** `npm run build` both green, the game playable, and F1 Edit
Mode still working. `npm run e2e` needs a browser: `npx playwright install chromium` once.

## Project identity

This is **aero-rescue-rpg** — an original, personal/non-commercial/research-only single-player 3D web game about
**anthropomorphic flying robots: world delivery, character dispatch, flight, transformation, landing, and
rescue**. Inspired by that *genre*, but **no official models/textures/audio/video/logos/character art** —
only original codenames, primitives, self-made placeholders, original UI, and swappable GLTF interfaces.

The repo was cloned from a finished **POLI RPG / R3F world-builder kit**. We **keep that kit's infrastructure**
(the Edit-Mode paradigm, Editor Hub, i18n, save, dialogue engine, asset auto-discovery, build config) and
**rebuild the gameplay spine on top, per the PDF, batch by batch**. The inherited POLI gameplay is **kept on disk
but dormant** (see *Scene modes* below) and is replaced subsystem-by-subsystem as the flight/transform/mission
FSM lands. **Reuse the POLI kit aggressively** (utilities/stores/editor seams — e.g. `ui/editor/editorShared.tsx`,
the Hub + `editorContentRegistry` seams, dialogue/i18n/save) instead of writing new code; then **gradually
delete the POLI blocks that become unused** — only after absorbing their reusable patterns, never blindly.

## The two core pillars (never compromise)

1. **Flight feel.**
2. **Transformation performance** (real-time 3D vehicle⇄robot, replayable & interactive — not a video swap).

NPC missions only supply a *reason*, *objective*, and *basic interaction*. **If any system degrades flight or
transformation quality, simplify the NPC/mission side first — never sacrifice flight or transformation.**

## Architecture

```
main.tsx (no StrictMode — double-mount disposes the WebGL context under R3F)
 └─ App.tsx ─ DOM overlays (React/Tailwind) + the single <Canvas>
     ├─ Dock · DevPanel (Leva) · Edit-Mode panels (always available)
     ├─ {world && …}  inherited POLI runtime + HUD (dormant in grey-box)
     └─ app/GameCanvas.tsx  (CanvasErrorBoundary → <Canvas> → Suspense<Loading> → Scene)
         └─ game/core/Scene.tsx  branches on devStore.sceneMode:
             ├─ 'greybox' → app/GreyBoxScene.tsx + OrbitControls   (Batch 0 base; default)
             └─ 'world'   → Dynamic/EditModeAmbience + Physics(AreaRenderer + Player) + FollowCamera + VFX
```

**Scene modes** (`src/stores/devStore.ts`, toggled in the Leva dev panel):
- `greybox` (default) — the engineering base scene: ground + grid + test cubes + orbit camera. The flight FSM,
  base hangar, world flight, and transformation stage get built here in later batches.
- `world` — wakes the inherited POLI kit world + its HUD/directors. Reference only; being phased out.

Both DOM and 3D layers share state **exclusively through zustand stores** — never prop-drill between 3D and DOM.

**F1** flips `uiStore.editMode`: swaps lighting to flat-bright, suspends the player, enables transform gizmos and
the Editor Hub. Edit Mode works in **both** scene modes.

## Game state machine (Batch 1)

Build a **strongly-typed** machine (hand-rolled typed FSM — no scattered booleans). States (≥):
`BOOT · MISSION_CONTROL · MISSION_BRIEFING · CHARACTER_SELECTION · HANGAR · PLATFORM_ALIGNMENT ·
LAUNCH_PREPARATION · LAUNCH_TUNNEL · BASE_FLY_AROUND · CLOUD_ASCENT · WORLD_FLIGHT · DESTINATION_APPROACH ·
TRANSFORMATION · DESCENT · LANDING · NPC_GREETING · MISSION_GAMEPLAY · SUPPORT_SELECTION · MISSION_COMPLETE ·
RETURN_TRANSFORMATION · RETURN_FLIGHT · BASE_APPROACH · HANGAR_RETURN · MISSION_RESULTS · PAUSED · ERROR`.
Every transition: validate allowed previous state, define next state, preserve mission data + current character
+ world position, support dev-mode direct jumps, and **never reset on React re-render**. Big flows live in
`GameStateMachine` / `GameDirector` / `EventBus` — **not** in stores.

## Edit Mode discipline (non-negotiable — the inherited paradigm)

Every author-created data object (character, world location, flight route, route event, mission, transformation
timeline, support AI, NPC, game settings…) **must be viewable / editable / duplicable in Edit Mode (F1) with the
3D updating live**. Follow the existing pattern for each new content domain:

1. `src/data/**` — seed data (typed by `src/types/**`).
2. `src/stores/editor<X>Store.ts` — zustand + `localStorage` + `importState` + `reset` + `mergeMissingFromSeed`.
3. `src/ui/editor/<X>EditorTab.tsx` — the authoring tab.
4. Register it in `src/ui/EditorHubPanel.tsx` **and** `src/game/editor/editorContentRegistry.ts`
   (for undo + project JSON export/import).
5. Provide a **non-hook `getEditor*()`** accessor for the 3D layer to read.

**A batch with a new author-created data object is not done until that object has a synced Edit Mode tab.**

## Data-driven pattern

| Concept | Kit equivalent |
|---|---|
| ScriptableObject | Plain TS data modules in `src/data/**` + interfaces in `src/types/**` |
| Singletons / managers | zustand stores in `src/stores/` — one system each, no God-class |
| Scenes / Addressables | data modules + renderers; a place = data |
| NavMesh / routes | Waypoint/path data + `useFrame` lerp along a polyline |

### Asset auto-discovery (drop files in — no registry edits)
- `src/assets/models/` — `.glb`/`.gltf` (subfolders = categories) → Edit Mode → Assets palette
- `src/assets/textures/` — Poly Haven PBR maps (`name_diff/_nor_gl/_arm`) → Environment pickers
- `src/assets/materials/` — whole-material `.glb` + `.bin` → Environment → GLTF material picker

HMR picks up new files without a restart. Large binary asset packs are git-ignored (folder + README stay tracked).

## Stack (fixed — do not change)

TypeScript (strict) · React 19 · @react-three/fiber 9 · drei · @react-three/rapier · zustand · Tailwind v4 ·
Vite · **Phaser 4** (embedded 2D mini-games via a React⇄Phaser⇄zustand bridge) · **Leva** (dev panel) ·
**zod** (validate all AI/imported content) · **Howler** (audio interface) · **postprocessing** +
**@react-three/postprocessing** (Bloom etc.). Helpers: nanoid, clsx, tailwind-merge, lucide-react. Tests:
Vitest + Testing Library + Playwright. Path alias `@/` → `src/`.

## Content / IP / tone rules (non-negotiable)

- Personal / non-commercial / research only. **No copyrighted models/textures/audio/video/logos/character art.**
- Placeholders, primitives, legally-free, or user-provided assets only. Original codenames, not IP names.
- Child-friendly: warm, bright, **tension not horror. No death, blood, or combat.**
- Rescue/mission failure is always **recoverable** (retry / more time / lower score / extra steps). No permadeath.
- **Source-confidence tag** on every authored character/location/incident/tool:
  `OfficialConfirmed · EpisodeObserved · CrossSourceConfirmed · SecondarySource · FanCompiled · Unverified ·
  GameAdaptation`. Never present `GameAdaptation` as official canon. On conflict, keep both + record provenance.
- **Language:** **everything in English** — code, filenames, comments, commits, technical docs, **and all
  in-game content + UI text** (per user rule). No Traditional Chinese in shipped strings or seed data.

## Engineering rules

- TS strict; **no `any`**; SOLID; small focused modules; composition over inheritance; no God-class.
- **React UI and R3F 3D are separated**; they communicate only through zustand stores.
- Stores hold **data + small actions only**; large flows go to `GameStateMachine` / Service / Controller.
- No per-frame allocations in `useFrame` (no object/array literals or closures created inside the callback).
- **No magic-string IDs** — define stable string constants/enums in the relevant `types/` file.
- All subscriptions / listeners / animation frames / timers must be cleaned up. All scene switches have
  loading + error handling. No silent `catch`.
- **Do not** build multiplayer, shop, gacha, login, or payment systems. **Do not** wire an LLM into core game
  judgement — LLMs may only generate constrained content, validated by zod, with a local-template fallback.
- Before editing any file: read it, check `git status`, never overwrite uncommitted work, never delete existing
  assets/PDFs.

## Working protocol (strict batch-by-batch)

Do **only** the batch the user names. Before changing anything: read the project, read the PDF for that batch,
check `package.json` + file structure, and state what the batch will change. Each batch ends with: `npm run
check` + `npm run build` green, fully playable, F1 Edit Mode working, and **one Conventional Commit**
(`feat(flight): …`, `feat(transform): …`, etc.) ending with
`Co-Authored-By: LLMProvider Opus 4.8 <noreply@llm_vendor.com>`. Then **only announce the next batch — do not implement
ahead.** Unfinished work → `docs/implementation/DEFERRED_WORK.md` with reason + dependencies; never a fake
`// TODO`.

## Batch roadmap (PDF)

- **0 — Engineering base (done):** Vite/TS/React 3D base, fixed-stack deps, grey-box `GameCanvas`, Leva dev
  panel, error boundary, Loading, tests + build verified, README + this file. POLI kept dormant under `world`.
- **1:** Types, data models, zustand stores, the typed `GameStateMachine` (+ Debug UI) — no real 3D base yet.
- **2:** Mission Control console + character-card selection (`MISSION_CONTROL → BRIEFING → CHARACTER_SELECTION → HANGAR`).
- **3:** 3D base hangar, ground movement (Rapier), launch platform alignment.
- **4:** Launch tunnel, base take-off, the first real **flight controller** + flight camera.
- **5:** World high-altitude segmented route + flight-event direction (≥10 min flight, chunk pooling).
- **6:** Transformation stage + real-time 3D transform flow (full / interactive / fast modes).
- **7:** Descent, landing, NPC + first basic missions (+ first Phaser mini-game via the bridge).
- **8:** Support-character calling + multi-character AI (Active/Standby/Remote).
- **9:** Return flight, reverse transformation, mission results — full dispatch loop closed.
- **10:** Rule-based mission generator (templates + validation + fixed seed).
- **11:** LLM mission text/dialogue interface (provider abstraction, zod, local fallback — never controls rules).
- **12:** Visual/audio/perf/playability polish (LOD, pooling, settings UI).
- **13:** Save/load (versioned schema + migration), tests, AI auto-playtester, final README.
