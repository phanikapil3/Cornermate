// Run with: npm run check:audio. Simulates the browser speech engine to test the announcement logic (not the real voice quality).
import { MOVEMENTS, spokenName, impactAt } from '../src/library/movements'
import { Player, schedule } from '../src/library/player'
let bad = 0; const ok = (c: boolean, m: string) => { console.log(c ? 'ok  ' : 'FAIL', m); if (!c) bad++ }
const spoken: { t: number; text: string }[] = []; let t0 = Date.now(), cancels = 0
class Utt { text: string; volume = 1; rate = 1; pitch = 1; lang = ''; voice: unknown = null; constructor(t: string) { this.text = t } }
Object.assign(globalThis, { SpeechSynthesisUtterance: Utt, window: { speechSynthesis: { speak: (u: Utt) => spoken.push({ t: Date.now() - t0, text: u.text }), cancel: () => { cancels++ }, getVoices: () => [], addEventListener() {}, removeEventListener() {} }, setTimeout: globalThis.setTimeout.bind(globalThis), clearTimeout: globalThis.clearTimeout.bind(globalThis) } })
const { audio } = await import('../src/audio/coachAudio'); const sleep = (ms: number) => new Promise(r => setTimeout(r, ms)); const texts = () => spoken.map(s => s.text)
const reset = () => { spoken.length = 0; t0 = Date.now() }
// 1. every movement has a clear spoken name
const names = MOVEMENTS.map(m => spokenName(m.id)); ok(names.every(n => n.length > 0 && n.split(' ').length <= 4), `all ${names.length} movements have a short spoken name`)
ok(new Set(names.map(n => n.toLowerCase())).size === names.length, 'spoken names are unique (no two movements sound the same)')
ok(spokenName('lhook').toLowerCase() === 'left hook' && spokenName('slipR').toLowerCase() === 'slip right' && spokenName('upper').toLowerCase() === 'right uppercut', 'old workout ids are spoken correctly')
ok(MOVEMENTS.every(m => impactAt(m) > 0 && impactAt(m) <= m.duration), 'impact time lies inside every movement')
// 2. schedule timing matches the animation player exactly
for (const ids of [['jab', 'cross'], ['jab', 'cross', 'roll-left', 'lead-hook', 'pivot-right']]) for (const sp of [1, .5, 2]) { const p = new Player(); p.load(ids, { speed: sp }); ok(Math.abs(p.length - schedule(ids, sp).total) < .03, `schedule matches animation length (${ids.length} moves, ${sp}x)`) }
// 3. no overlap: a fast second call replaces the first
reset(); audio.call('jab'); audio.call('cross'); await sleep(200); ok(texts().join() === 'Cross', 'two rapid calls: only the latest is spoken (no overlap)')
// 4. combination announced in order, in sync with the animation timeline
reset(); const combo = ['jab', 'cross', 'lead-hook', 'slip-right']; const sch = schedule(combo, 2); audio.playSequence(combo, { speed: 2 }); await sleep(sch.total * 1000 + 300)
ok(texts().join().toLowerCase() === 'jab,cross,left hook,slip right', 'combination spoken in the correct order: ' + texts().join(' > '))
ok(spoken.every((s, i) => Math.abs(s.t - (sch.items[i].start * 1000 + 40)) < 120), 'each name starts within 120 ms of its animation start')
// 5. stop() silences pending announcements; unknown ids do not crash
reset(); audio.playSequence(['jab', 'cross', 'lead-hook', 'cross'], { speed: 1 }); await sleep(150); audio.stop(); await sleep(1500); ok(texts().length <= 1, 'stop() cancels announcements still scheduled')
reset(); audio.playSequence(['jab', 'not-a-move', 'cross'], { speed: 4 }); await sleep(600); ok(texts().join() === 'Jab,Cross', 'unknown ids are skipped safely')
audio.stop(); console.log(bad ? `${bad} FAILED` : 'audio logic OK'); process.exit(bad ? 1 : 0)
