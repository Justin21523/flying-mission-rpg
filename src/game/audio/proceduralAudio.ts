import { getAudioCtx } from './audioContext';
import { useAudioStore } from '../../stores/audioStore';
import { getEditorMusicTrack, getEditorAmbientLayer } from '../../stores/game/editorMusicStore';
import { MUSIC_TRACKS, type MusicTrack, type MusicTrackId } from '../../data/audio/musicTracks';
import { AMBIENT_LAYERS, type AmbientLayer, type AmbientLayerId } from '../../data/audio/ambientLayers';

// Batch 12.1 — procedural BGM + ambient engine. A single look-ahead scheduler turns the data-defined tracks
// (musicTracks.ts) into looping WebAudio note sequences, and renders an ambient bed from filtered noise +
// sparse chirps. Volumes come from audioStore (master × music / ambient, muted by mute-all, lowered by
// reduce-loud) and the live editable params from the 🎵 Music store. No audio files; never throws if WebAudio
// is unavailable; pauses cleanly when the tab is hidden.

const LOOKAHEAD = 0.12;     // seconds scheduled ahead
const TICK_MS = 25;         // scheduler cadence
const FADE = 0.4;           // track crossfade seconds

let musicGain: GainNode | null = null;
let ambientGain: GainNode | null = null;
let ambientSource: AudioBufferSourceNode | null = null;
let ambientFilter: BiquadFilterNode | null = null;
let noiseBuffer: AudioBuffer | null = null;

let schedulerId: ReturnType<typeof setInterval> | null = null;
let currentTrack: MusicTrack | null = null;
let currentAmbientId: AmbientLayerId | null = null;
let nextNoteTime = 0;
let beat = 0;
let paused = false;

function semitoneHz(rootHz: number, semi: number): number {
  return rootHz * Math.pow(2, semi / 12);
}

function trackFor(id: MusicTrackId): MusicTrack {
  return (getEditorMusicTrack(id) as MusicTrack | undefined) ?? MUSIC_TRACKS.find((t) => t.id === id) ?? MUSIC_TRACKS[0];
}
function ambientFor(id: AmbientLayerId): AmbientLayer {
  return (getEditorAmbientLayer(id) as AmbientLayer | undefined) ?? AMBIENT_LAYERS.find((a) => a.id === id) ?? AMBIENT_LAYERS[0];
}

function ensureGraph(ctx: AudioContext): void {
  if (!musicGain) { musicGain = ctx.createGain(); musicGain.gain.value = 0; musicGain.connect(ctx.destination); }
  if (!ambientGain) { ambientGain = ctx.createGain(); ambientGain.gain.value = 0; ambientGain.connect(ctx.destination); }
  if (!noiseBuffer) {
    const len = ctx.sampleRate * 2;
    noiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = Math.random() * 2 - 1;
  }
}

function masterMusicGain(track: MusicTrack): number {
  const s = useAudioStore.getState();
  if (s.muteAll) return 0;
  return s.masterVolume * s.musicVolume * track.volume * (s.reduceLoud ? 0.6 : 1);
}
function masterAmbientGain(layer: AmbientLayer): number {
  const s = useAudioStore.getState();
  if (s.muteAll) return 0;
  return s.masterVolume * s.ambientVolume * layer.volume * (s.reduceLoud ? 0.6 : 1);
}

function scheduleNote(ctx: AudioContext, hz: number, time: number, dur: number, type: OscillatorType, gain: number): void {
  if (!musicGain) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(hz, time);
  g.gain.setValueAtTime(0, time);
  g.gain.linearRampToValueAtTime(gain, time + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
  osc.connect(g);
  g.connect(musicGain);
  osc.start(time);
  osc.stop(time + dur + 0.02);
}

function scheduleBeat(ctx: AudioContext, track: MusicTrack, beatIndex: number, time: number): void {
  const beatDur = 60 / track.tempo;
  const bass = track.bass[beatIndex % track.bass.length];
  if (bass >= 0) scheduleNote(ctx, semitoneHz(track.rootHz, bass), time, beatDur * 0.95, 'triangle', 0.28);
  const mel = track.melody[beatIndex % track.melody.length];
  if (mel >= 0) scheduleNote(ctx, semitoneHz(track.rootHz, mel), time, beatDur * 0.8, 'sine', 0.22);
  // Soft major triad sustained over each bar.
  if (beatIndex % track.beatsPerBar === 0) {
    const bar = Math.floor(beatIndex / track.beatsPerBar) % track.chords.length;
    const root = track.chords[bar];
    const barDur = beatDur * track.beatsPerBar;
    for (const semi of [root, root + 4, root + 7]) scheduleNote(ctx, semitoneHz(track.rootHz, semi), time, barDur * 0.9, 'sine', 0.08);
  }
}

function maybeChirp(ctx: AudioContext, layer: AmbientLayer): void {
  if (!ambientGain || layer.chirpRate <= 0) return;
  if (Math.random() > layer.chirpRate * (TICK_MS / 1000)) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  const t = ctx.currentTime;
  osc.type = 'sine';
  osc.frequency.setValueAtTime(layer.chirpHz * (0.9 + Math.random() * 0.2), t);
  const peak = masterAmbientGain(layer) * 0.5;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peak, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.16);
}

function tick(): void {
  const ctx = getAudioCtx();
  if (!ctx || paused) return;
  // Music look-ahead.
  if (currentTrack && musicGain) {
    const track = trackFor(currentTrack.id);
    musicGain.gain.setTargetAtTime(track.enabled ? masterMusicGain(track) : 0, ctx.currentTime, FADE / 3);
    if (track.enabled) {
      const beatDur = 60 / track.tempo;
      const loopBeats = Math.max(track.bass.length, track.melody.length, track.chords.length * track.beatsPerBar);
      while (nextNoteTime < ctx.currentTime + LOOKAHEAD) {
        scheduleBeat(ctx, track, beat, nextNoteTime);
        beat = (beat + 1) % loopBeats;
        nextNoteTime += beatDur;
      }
    }
  }
  // Ambient bed.
  if (currentAmbientId && ambientGain) {
    const layer = ambientFor(currentAmbientId);
    ambientGain.gain.setTargetAtTime(layer.enabled ? masterAmbientGain(layer) : 0, ctx.currentTime, 0.3);
    if (layer.enabled) maybeChirp(ctx, layer);
  }
}

function startScheduler(): void {
  if (schedulerId !== null || typeof setInterval === 'undefined') return;
  const ctx = getAudioCtx();
  if (!ctx) return;
  nextNoteTime = ctx.currentTime + 0.05;
  schedulerId = setInterval(tick, TICK_MS);
}
function stopScheduler(): void {
  if (schedulerId !== null) { clearInterval(schedulerId); schedulerId = null; }
}

/** Switch the BGM track (or stop with null). Crossfades via the per-tick gain target. */
export function setTrack(id: MusicTrackId | null): void {
  const ctx = getAudioCtx();
  if (!ctx) return;
  ensureGraph(ctx);
  if (id === null) { currentTrack = null; if (musicGain) musicGain.gain.setTargetAtTime(0, ctx.currentTime, FADE / 3); return; }
  if (currentTrack?.id === id) return;
  currentTrack = trackFor(id);
  beat = 0;
  nextNoteTime = ctx.currentTime + 0.05;
  startScheduler();
}

/** Switch the ambient bed (or stop with null). */
export function setAmbient(id: AmbientLayerId | null): void {
  const ctx = getAudioCtx();
  if (!ctx) return;
  ensureGraph(ctx);
  if (id === currentAmbientId) return;
  // Tear down the old noise source.
  if (ambientSource) { try { ambientSource.stop(); } catch { /* already stopped */ } ambientSource.disconnect(); ambientSource = null; }
  if (ambientFilter) { ambientFilter.disconnect(); ambientFilter = null; }
  currentAmbientId = id;
  if (id === null) { if (ambientGain) ambientGain.gain.setTargetAtTime(0, ctx.currentTime, 0.3); return; }
  const layer = ambientFor(id);
  if (noiseBuffer && ambientGain) {
    ambientSource = ctx.createBufferSource();
    ambientSource.buffer = noiseBuffer;
    ambientSource.loop = true;
    ambientFilter = ctx.createBiquadFilter();
    ambientFilter.type = layer.kind === 'rain' ? 'bandpass' : 'lowpass';
    ambientFilter.frequency.value = layer.filterHz;
    ambientSource.connect(ambientFilter);
    ambientFilter.connect(ambientGain);
    ambientSource.start();
  }
  startScheduler();
}

export function pauseProcedural(): void {
  paused = true;
  const ctx = getAudioCtx();
  if (musicGain && ctx) musicGain.gain.setTargetAtTime(0, ctx.currentTime, 0.2);
  if (ambientGain && ctx) ambientGain.gain.setTargetAtTime(0, ctx.currentTime, 0.2);
}
export function resumeProcedural(): void {
  paused = false;
  const ctx = getAudioCtx();
  if (ctx) nextNoteTime = ctx.currentTime + 0.05;
}

export function disposeProcedural(): void {
  stopScheduler();
  if (ambientSource) { try { ambientSource.stop(); } catch { /* noop */ } ambientSource.disconnect(); ambientSource = null; }
  ambientFilter?.disconnect(); ambientFilter = null;
  musicGain?.disconnect(); musicGain = null;
  ambientGain?.disconnect(); ambientGain = null;
  currentTrack = null;
  currentAmbientId = null;
}
