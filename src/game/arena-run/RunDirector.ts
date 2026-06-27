import { useArenaRunStore, type RunMode } from '../../stores/game/useArenaRunStore';
import type { RunModeConfig } from '../../data/progression/runConfig';
import { getRunConfig } from '../../stores/game/useRunConfigStore';
import { isBossRound, enemyHpScale, waveForRound, bossIndexForRound } from './runMath';
import { spawnEnemyFromDef } from '../combat/enemyRuntime';
import { rollAffixes, applyAffixesToTarget } from '../combat/EliteAffixRuntime';
import { arenaAffixPolicy, type AffixPolicy } from '../../data/combat/eliteAffixes';
import { getHangarBonuses } from '../progression/HangarBonusResolver';
import { getEnemyDef } from '../../stores/game/editorCombatStore';
import { useCombatTargetStore, liveTargets } from '../../stores/game/combatTargetStore';
import { registerPlayerCombatant, shutdownCombat, activeCombatantId } from '../combat/CombatDirector';
import { useCombatStore } from '../../stores/game/useCombatStore';
import { useCharacterStore } from '../../stores/game/useCharacterStore';
import { useWalletStore } from '../../stores/walletStore';
import { useRunBuffStore } from '../../stores/game/useRunBuffStore';
import { getEnabledRunBuffDefs, getRunBuffDef } from '../../stores/game/useRunBuffDefStore';
import { useRunRecordStore } from '../../stores/game/useRunRecordStore';
import { useGameStore } from '../../stores/game/useGameStore';
import { useAdvancedMissionZoneStore } from '../../stores/game/useAdvancedMissionZoneStore';
import { useBossStore } from '../../stores/game/useBossStore';
import { useBossDefinitionStore } from '../../stores/game/useBossEditorStore';
import { robotHandle } from '../destination/robotHandle';
import { getRoomConfig } from '../../stores/game/useRoomConfigStore';
import * as BossDirector from '../bosses/BossDirector';

// Batch N — orchestrates an Endless / Roguelite arena run by reusing the existing combat seams: ad-hoc enemy
// waves (spawnEnemyFromDef), boss rounds (BossDirector.startBoss), automatic kill rewards
// (combatTargetStore.applyResult → KillRewards), and the player combatant (registerPlayerCombatant). No zone
// system involved. Pure decisions live in runMath; this module owns the side effects + the per-frame loop
// (pumped by ArenaRunHost alongside BossDirector.update()).

const nowS = () => (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;

const counted = new Set<string>(); // enemy target ids already counted as kills
let reviveGraceUntil = 0; // brief grace after (re)entering a round so a 1-frame hp read can't false-trigger death

function modeCfg(mode: RunMode): RunModeConfig {
  const c = getRunConfig();
  return mode === 'endless' ? c.endless : c.roguelite;
}

function bossRoster(): string[] {
  return useBossDefinitionStore.getState().items.filter((b) => b.enabled !== false).map((b) => b.id);
}

function clearCombat(): void {
  useCombatTargetStore.getState().reset();
  BossDirector.cleanup();
}

function spawnWave(round: number, cfg: RunModeConfig): void {
  const entries = waveForRound(round, cfg);
  const hp = enemyHpScale(round, cfg);
  const cx = robotHandle.pos.x, cz = robotHandle.pos.z;
  // Wave 3 — an accepted elite room makes this wave hit harder (richer affixes); the flag is one-shot.
  const store = useArenaRunStore.getState();
  const elite = store.eliteNextRound;
  if (elite) store.setEliteNextRound(false);
  const policy: AffixPolicy = elite
    ? { allowedAffixIds: ['shielded', 'volatile', 'swift', 'regenerating', 'vampiric'], chancePerEnemy: 0.95, maxPerEnemy: 2 }
    : arenaAffixPolicy(round);
  let i = 0;
  const total = entries.reduce((s, e) => s + e.count, 0);
  for (const e of entries) {
    const def = getEnemyDef(e.enemyId);
    if (!def) continue;
    for (let k = 0; k < e.count; k++) {
      const a = (i / Math.max(1, total)) * Math.PI * 2;
      const r = 12 + (i % 3) * 2;
      const t = spawnEnemyFromDef(def, cx + Math.cos(a) * r, cz + Math.sin(a) * r);
      t.maxHp = Math.round(t.maxHp * (elite ? hp * 1.25 : hp)); t.hp = t.maxHp; // per-round (+elite) HP escalation
      applyAffixesToTarget(t, rollAffixes(policy)); // Wave 1/3 — arena affix escalation (richer if elite)
      i++;
    }
  }
}

// Enter round R: spawn its content (boss round → boss; else → wave) and set status.
function enterRound(round: number): void {
  const store = useArenaRunStore.getState();
  const cfg = modeCfg(store.mode);
  clearCombat();
  store.setRound(round);
  reviveGraceUntil = nowS() + 1.5;
  if (isBossRound(round, cfg)) {
    const roster = bossRoster();
    const bossId = roster[bossIndexForRound(round, cfg, roster.length)];
    if (bossId) BossDirector.startBoss(bossId, [robotHandle.pos.x, 0, robotHandle.pos.z]); // Batch P — spawn on the player
    store.setStatus('boss');
  } else {
    spawnWave(round, cfg);
    store.setStatus('combat');
  }
}

export function startRun(mode: RunMode): void {
  const cfg = getRunConfig();
  counted.clear();
  useRunBuffStore.getState().resetRun();
  // Clear any stale advanced-zone state so BossHost.initializeBossForSegment(activeSegmentId) can't auto-start
  // a leftover campaign boss, and MissionZoneHud stays hidden during the run.
  useAdvancedMissionZoneStore.getState().resetZone();
  useCombatStore.getState().setGodMode(false); // deaths must matter in a run
  shutdownCombat();
  useCombatStore.getState().resetCombat();
  clearCombat();
  const charId = activeCombatantId() ?? useCharacterStore.getState().selectedCharacterId ?? undefined;
  registerPlayerCombatant(charId);
  useArenaRunStore.getState().start(mode, cfg.startingLives, useWalletStore.getState().coins);
  // Wave 3 — Hangar 'Emergency Recall' grants free auto-revives for this run (consumed before a life is lost).
  useArenaRunStore.getState().setFreeRevivesRemaining(getHangarBonuses().reviveCharges);
  useGameStore.getState().requestTransition('ARENA_RUN');
  enterRound(1);
}

function fullHealPlayer(): void {
  const id = activeCombatantId();
  const stats = id ? useCombatStore.getState().playerStatsByCharacterId[id] : undefined;
  if (id && stats) useCombatStore.getState().updateCombatStats(id, { hp: stats.maxHp, shield: stats.maxShield, energy: stats.maxEnergy });
}

function recordBest(): void {
  const s = useArenaRunStore.getState();
  useRunRecordStore.getState().record(s.mode, s.round);
}

function onPlayerDead(): void {
  const store = useArenaRunStore.getState();
  // Wave 3 — spend a free auto-revive first (no life cost), then fall back to losing a life.
  if (store.freeRevivesRemaining > 0) {
    store.setFreeRevivesRemaining(store.freeRevivesRemaining - 1);
    fullHealPlayer();
    enterRound(store.round);
    return;
  }
  store.loseLife();
  if (useArenaRunStore.getState().lives > 0) {
    fullHealPlayer();
    enterRound(useArenaRunStore.getState().round); // restart current round
  } else {
    clearCombat();
    recordBest();
    store.setStatus('gameover');
  }
}

function onRoundCleared(): void {
  const store = useArenaRunStore.getState();
  const cfg = modeCfg(store.mode);
  clearCombat();
  // Roguelite win after clearing the final round.
  if (store.mode === 'roguelite' && cfg.totalRounds != null && store.round >= cfg.totalRounds) {
    recordBest();
    store.setStatus('won');
    return;
  }
  // Wave 3 — roguelite enters an interstitial ROOM between rounds (boon falls back to the classic 3-buff pick;
  // shop / gamble / rest / elite show the RoomInteractionOverlay). Endless advances directly.
  if (store.mode === 'roguelite') {
    const room = pickRoom();
    if (room === 'boon') { store.setPendingChoices(pickBuffChoices(3)); store.setStatus('choosing'); return; }
    store.setPendingRoom(room);
    store.setRoomResult(undefined);
    store.setStatus('room');
    return;
  }
  enterRound(store.round + 1);
}

// Wave 3 — sample a room from the (weighted) pool.
function pickRoom(): import('../../stores/game/useArenaRunStore').RoomId {
  const pool = getRoomConfig().roomPool;
  if (pool.length === 0) return 'boon';
  return pool[Math.floor(Math.random() * pool.length) % pool.length];
}

// Wave 3 — the shop's offered run-buffs (computed once per visit by the overlay).
export function roomShopOffers(): string[] {
  const cfg = getRoomConfig();
  const pool = getEnabledRunBuffDefs().map((d) => d.id);
  const out: string[] = [];
  while (out.length < cfg.shopOfferCount && pool.length > 0) out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  return out;
}

// Wave 3 — buy a run-buff for coins (shop). Returns true if purchased.
export function roomShopBuy(buffId: string): boolean {
  const cfg = getRoomConfig();
  if (!useWalletStore.getState().spend(cfg.shopCost)) { useArenaRunStore.getState().setRoomResult('Not enough coins.'); return false; }
  applyBuff(buffId);
  useArenaRunStore.getState().setRoomResult(`Installed ${getRunBuffDef(buffId)?.name ?? 'an upgrade'}.`);
  return true;
}

// Wave 3 — gamble a fixed stake for a chance at a multiplied payout. rng injectable for tests.
export function roomGamble(rng: () => number = Math.random): boolean {
  const cfg = getRoomConfig();
  if (!useWalletStore.getState().spend(cfg.gambleStake)) { useArenaRunStore.getState().setRoomResult('Not enough coins.'); return false; }
  const won = rng() < cfg.gambleWinChance;
  if (won) useWalletStore.getState().addCoins(Math.round(cfg.gambleStake * cfg.gambleWinMultiplier));
  useArenaRunStore.getState().setRoomResult(won ? `Won ${Math.round(cfg.gambleStake * cfg.gambleWinMultiplier)} coins!` : `Lost ${cfg.gambleStake} coins.`);
  return won;
}

// Wave 3 — rest room: heal the active combatant by a fraction of max.
export function roomRest(): void {
  const cfg = getRoomConfig();
  const id = activeCombatantId();
  const stats = id ? useCombatStore.getState().playerStatsByCharacterId[id] : undefined;
  if (id && stats) {
    useCombatStore.getState().updateCombatStats(id, {
      hp: Math.min(stats.maxHp, stats.hp + stats.maxHp * cfg.restHealFraction),
      shield: Math.min(stats.maxShield, stats.shield + stats.maxShield * cfg.restHealFraction),
      energy: Math.min(stats.maxEnergy, stats.energy + stats.maxEnergy * cfg.restHealFraction),
    });
  }
  useArenaRunStore.getState().setRoomResult('Systems restored.');
}

// Wave 3 — elite room: accept a harder next wave for bonus coins.
export function roomElite(): void {
  const cfg = getRoomConfig();
  useWalletStore.getState().addCoins(cfg.eliteRewardCoins);
  useArenaRunStore.getState().setEliteNextRound(true);
  useArenaRunStore.getState().setRoomResult(`+${cfg.eliteRewardCoins} coins — next wave is elite.`);
}

// Wave 3 — leave the room and start the next round.
export function completeRoom(): void {
  const store = useArenaRunStore.getState();
  store.setPendingRoom(undefined);
  enterRound(store.round + 1);
}

// Pick up to `n` distinct enabled buffs at random for the choice overlay.
function pickBuffChoices(n: number): string[] {
  const pool = getEnabledRunBuffDefs().map((d) => d.id);
  const out: string[] = [];
  while (out.length < n && pool.length > 0) {
    const i = Math.floor(Math.random() * pool.length);
    out.push(pool.splice(i, 1)[0]);
  }
  return out;
}

// Add a run-buff to the run + apply any immediate stat effect (live; cast-time mults read the store). Shared by
// the boon-choice overlay (chooseBuff) and the Wave 3 shop room.
function applyBuff(buffId: string): void {
  const def = getRunBuffDef(buffId);
  if (!def) return;
  useRunBuffStore.getState().addBuff(buffId);
  const id = activeCombatantId();
  const cur = id ? useCombatStore.getState().playerStatsByCharacterId[id] : undefined;
  if (id && cur) {
    if (def.category === 'maxHp') useCombatStore.getState().updateCombatStats(id, { maxHp: cur.maxHp + def.value, hp: cur.hp + def.value });
    else if (def.category === 'maxEnergy') useCombatStore.getState().updateCombatStats(id, { maxEnergy: cur.maxEnergy + def.value, energy: cur.energy + def.value });
    else if (def.category === 'healFull') useCombatStore.getState().updateCombatStats(id, { hp: cur.maxHp, shield: cur.maxShield, energy: cur.maxEnergy });
  }
}

// Apply a chosen buff and advance to the next round (boon room / classic between-round pick).
export function chooseBuff(buffId: string): void {
  applyBuff(buffId);
  const store = useArenaRunStore.getState();
  store.setPendingChoices([]);
  enterRound(store.round + 1);
}

export function buyRevive(): boolean {
  const cfg = getRunConfig();
  if (!useWalletStore.getState().spend(cfg.reviveCost)) return false;
  const store = useArenaRunStore.getState();
  store.addLife();
  fullHealPlayer();
  enterRound(store.round);
  return true;
}

export function endRun(): void {
  shutdownCombat();
  clearCombat();
  useCombatStore.getState().setGodMode(true); // restore the testing-build default
  useRunBuffStore.getState().resetRun();
  useArenaRunStore.getState().reset();
  useGameStore.getState().requestTransition('MISSION_CONTROL');
}

export function update(): void {
  const store = useArenaRunStore.getState();
  if (!store.active) return;
  const status = store.status;
  if (status !== 'combat' && status !== 'boss') return; // choosing / gameover / won → UI drives

  // Count newly-defeated enemies as kills (rewards already granted by KillRewards).
  for (const t of liveTargets) {
    if (t.isEnemy && t.defeatedAt > 0 && !counted.has(t.id)) { counted.add(t.id); store.addKill(); }
  }

  // Player death.
  if (nowS() >= reviveGraceUntil) {
    const id = activeCombatantId();
    const stats = id ? useCombatStore.getState().playerStatsByCharacterId[id] : undefined;
    if (stats && stats.hp <= 0) { onPlayerDead(); return; }
  }

  // Round cleared?
  if (status === 'combat') {
    const anyAlive = liveTargets.some((t) => t.isEnemy && t.defeatedAt === 0);
    if (!anyAlive) onRoundCleared();
  } else {
    const rt = useBossStore.getState().runtime;
    if (rt && rt.status === 'defeated') onRoundCleared();
  }
}
