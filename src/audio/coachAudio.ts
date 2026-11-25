// Workout audio: spoken movement names (Web Speech) + separate synthesized impact sounds (Web Audio).
// Names come from the movement library (spokenName), so every movement, including new ones, is announced automatically.
import { getMovement, impactAt, spokenName } from '../library/movements'
import { schedule } from '../library/player'
export type AudioSettings = { sound: boolean; voice: boolean; sfx: boolean; volume: number; voiceName: string }
let get: () => AudioSettings = () => ({ sound: true, voice: true, sfx: true, volume: .8, voiceName: '' })
export const bindSettings = (g: () => AudioSettings) => { get = g } // the app passes its settings store here
const synth: SpeechSynthesis | null = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null
let ac: AudioContext | null = null, bus: GainNode | null = null, noiseBuf: AudioBuffer | null = null, token = 0, timers: number[] = []
// ---------- voice ----------
export const englishVoices = () => (synth ? synth.getVoices().filter(v => /^en/i.test(v.lang)) : [])
export const onVoicesChanged = (cb: () => void) => { if (!synth) return () => {}; synth.addEventListener('voiceschanged', cb); return () => synth.removeEventListener('voiceschanged', cb) }
function pickVoice(): SpeechSynthesisVoice | null {
  const vs = englishVoices(); if (!vs.length) return null
  const want = get().voiceName; const hit = want ? vs.find(v => v.name === want) : undefined; if (hit) return hit
  const score = (v: SpeechSynthesisVoice) => (/natural|neural|online/i.test(v.name) ? 4 : 0) + (/google/i.test(v.name) ? 2 : 0) + (/en[-_]IN/i.test(v.lang) ? 2 : /en[-_](US|GB)/i.test(v.lang) ? 1 : 0)
  return [...vs].sort((a, b) => score(b) - score(a))[0]
}
// One voice channel: a new call replaces the current one, so voices can never overlap or queue up behind fast movements.
function speak(text: string) {
  const s = get(); if (!synth || !s.sound || !s.voice || !text) return
  const my = ++token; synth.cancel()
  window.setTimeout(() => { if (my !== token) return
    const u = new SpeechSynthesisUtterance(text), v = pickVoice(); if (v) { u.voice = v; u.lang = v.lang } else u.lang = 'en-US'
    u.rate = 1.05; u.pitch = 1; u.volume = s.volume; synth.speak(u) }, 40)
}
// ---------- sound effects ----------
function ctx(): AudioContext | null { try { const A = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  if (!ac) ac = new A(); if (ac.state === 'suspended') void ac.resume(); return ac } catch { return null } }
const out = (c: AudioContext) => { if (!bus) { bus = c.createGain(); bus.connect(c.destination) } return bus }
const noise = (c: AudioContext) => { if (!noiseBuf) { const n = Math.floor(c.sampleRate * .4); noiseBuf = c.createBuffer(1, n, c.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1 } return noiseBuf }
const level = () => { const s = get(); return s.sound && s.sfx ? s.volume * .55 : 0 }
function burst(c: AudioContext, at: number, vol: number, dur: number, type: BiquadFilterType, f0: number, f1: number) {
  const s = c.createBufferSource(); s.buffer = noise(c); const f = c.createBiquadFilter(); f.type = type; f.Q.value = 1.1
  f.frequency.setValueAtTime(f0, at); f.frequency.exponentialRampToValueAtTime(f1, at + dur)
  const g = c.createGain(); g.gain.setValueAtTime(.0001, at); g.gain.exponentialRampToValueAtTime(Math.max(.0002, vol), at + dur * .4); g.gain.exponentialRampToValueAtTime(.0001, at + dur)
  s.connect(f); f.connect(g); g.connect(out(c)); s.start(at); s.stop(at + dur + .02)
}
function thump(c: AudioContext, at: number, vol: number, low: number) {
  const o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(170 * low, at); o.frequency.exponentialRampToValueAtTime(42, at + .12)
  g.gain.setValueAtTime(Math.max(.0002, vol), at); g.gain.exponentialRampToValueAtTime(.0001, at + .16); o.connect(g); g.connect(out(c)); o.start(at); o.stop(at + .18)
  burst(c, at, vol * .6, .05, 'lowpass', 1600, 500)
}
function tone(c: AudioContext, f: number, at: number, dur: number, vol: number) {
  const o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.value = f
  g.gain.setValueAtTime(.0001, at); g.gain.exponentialRampToValueAtTime(Math.max(.0002, vol), at + .01); g.gain.exponentialRampToValueAtTime(.0001, at + dur); o.connect(g); g.connect(out(c)); o.start(at); o.stop(at + dur + .02)
}
// Impact sounds are separate from the voice. Timing comes from the movement's own animation phases.
function impact(id: string) {
  const m = getMovement(id), v = level(); if (!m || !v) return; const c = ctx(); if (!c) return; const now = c.currentTime, hit = Math.max(.08, impactAt(m))
  if (m.category === 'punches') { burst(c, now + Math.max(0, hit - .13), v * .7, .13, 'bandpass', 500, 2600); if (m.sub !== 'Feints') thump(c, now + hit, v, m.sub === 'Body shots' ? .7 : 1) }
  else if (m.category === 'defense') burst(c, now + .02, v * .35, .2, 'bandpass', 700, 1800)
  else if (m.category === 'footwork') { burst(c, now + .05, v * .5, .04, 'bandpass', 3000, 2500); burst(c, now + .2, v * .4, .04, 'bandpass', 3000, 2500) }
}
const call = (id: string) => { speak(spokenName(id)); impact(id) }
const stop = () => { token++; timers.forEach(t => window.clearTimeout(t)); timers = []; try { synth?.cancel() } catch { /* ignore */ } try { bus?.disconnect() } catch { /* ignore */ } bus = null }
export const audio = {
  /** Call from a click/tap handler so browsers allow sound. */
  unlock() { ctx(); try { if (synth) { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; synth.speak(u) } } catch { /* ignore */ } },
  /** Announce one movement now (name + impact sound). */
  call,
  /** Phase cues: ready / work / rest / done. */
  cue(kind: 'ready' | 'work' | 'rest' | 'done') {
    const c = ctx(), v = level()
    if (c && v) { const t = c.currentTime
      if (kind === 'work') { tone(c, 880, t, .5, v * .5); tone(c, 1320, t, .35, v * .25) }
      else if (kind === 'rest') { tone(c, 440, t, .25, v * .5); tone(c, 440, t + .3, .25, v * .5) }
      else if (kind === 'done') { [660, 880, 1100].forEach((f, i) => tone(c, f, t + i * .15, .35, v * .5)) }
      else tone(c, 520, t, .2, v * .4) }
    if (kind === 'ready') speak('Get ready'); else if (kind === 'rest') speak('Rest'); else if (kind === 'done') speak('Workout complete')
  },
  /** Play a whole sequence (library demo / combo builder), each name and impact at the moment its animation starts. */
  playSequence(ids: string[], o: { speed?: number; loop?: boolean } = {}) {
    stop(); const sch = schedule(ids, o.speed ?? 1)
    const run = () => { sch.items.forEach(it => timers.push(window.setTimeout(() => call(it.id), it.start * 1000))); if (o.loop && sch.total > 0) timers.push(window.setTimeout(run, sch.total * 1000)) }
    run()
  },
  stop,
}
