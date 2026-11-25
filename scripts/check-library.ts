// Run with: npm run check:library. Validates every movement and preset using the REAL skeleton (rig.ts) and camera framing.
import * as THREE from 'three'
import { MOVEMENTS, PRESETS, getMovement, DEFAULT_RECOVERY } from '../src/library/movements'
import { Player, resolvePose } from '../src/library/player'
import { BASE, KEYS } from '../src/components/coach3d/poses'
import { createBoxer, applyPose, L1, L2 } from '../src/components/coach3d/rig'
import { FOV, solveFrame } from '../src/components/coach3d/framing'
import { measure, bodyPoints } from '../src/components/coach3d/extents'
import { PROGRAMS, getWorkout } from '../src/data'
let bad = 0, warn = 0; const fail = (s: string) => { console.log('FAIL', s); bad++ }, note = (s: string) => { console.log('warn', s); warn++ }
const seen = new Set<string>()
for (const m of MOVEMENTS) {
  if (seen.has(m.id)) fail('duplicate id ' + m.id); seen.add(m.id)
  if (!m.phases.length) fail(m.id + ' has no phases'); if (m.duration + (m.recovery ?? DEFAULT_RECOVERY) > 1.25) note(`${m.id} takes ${(m.duration + (m.recovery ?? DEFAULT_RECOVERY)).toFixed(2)}s: longer than a 1-second workout slot`)
  for (const ph of m.phases) for (const k of Object.keys(ph.p)) if (!(KEYS as readonly string[]).includes(k)) fail(`${m.id} uses unknown pose key "${k}"`) }
for (const p of PRESETS) for (const id of p.ids) if (!getMovement(id)) fail(`preset "${p.name}" uses unknown movement ${id}`)
for (const id of ['lhook', 'rhook', 'upper', 'slipL', 'slipR', 'guard', 'duck', 'roll', 'step', 'jab', 'cross']) if (!getMovement(id)) fail('legacy id missing: ' + id)
// ---- simulate every movement (both stances) with the real skeleton ----
const rig = createBoxer(), P3 = new THREE.Vector3(), tmp = new THREE.Vector3()
const ext = { minX: 9, maxX: -9, minY: 9, maxY: -9, maxZ: -9 }, aspects = [.5, .65, .8, 1, 1.33, 1.6, 1.78, 2.4]
const cams: THREE.PerspectiveCamera[] = [] // (old fixed-camera projection removed: framing is now tested below with the real camera rig maths)
let worstNdc = 0, worstWhere = '', maxReach = 0
const pts: THREE.Vector3[] = []
function collect() { pts.length = 0; rig.root.updateMatrixWorld(true)
  const w = (o: THREE.Object3D, x = 0, y = 0, z = 0) => pts.push(o.localToWorld(new THREE.Vector3(x, y, z)))
  w(rig.head, 0, .14, 0); w(rig.head, 0, -.12, 0); w(rig.pelvis); w(rig.torso, 0, .5, 0)
  for (const g of rig.glove) for (const [x, y] of [[.1, 0], [-.1, 0], [0, .1], [0, -.1]]) w(g, x, y, 0)
  for (const e of rig.el) w(e); for (const s of rig.sh) w(s)
  for (const l of rig.legs) { w(l.knee); w(l.foot); w(l.foot, 0, -.07, .2); w(l.foot, 0, -.07, -.1); w(l.foot, .06, -.07, .05); w(l.foot, -.06, -.07, .05) } }
const punchReach: Record<string, number> = {}
for (const stance of ['orthodox', 'southpaw'] as const) for (const m of MOVEMENTS) {
  const pl = new Player(); pl.load([m.id], { stance }); let best = 0, straight = 0
  for (let i = 0, n = Math.ceil((pl.length + .05) * 60); i < n; i++) {
    const c = pl.update(1 / 60), fit = applyPose(rig, c, 0); maxReach = Math.max(maxReach, fit.reach); straight = Math.max(straight, fit.reach)
    if (fit.err > .001) { fail(`${m.id} (${stance}) leg cannot reach its foot target by ${(fit.err * 100).toFixed(1)}cm`); break }
    collect(); for (const p of pts) { ext.minX = Math.min(ext.minX, p.x); ext.maxX = Math.max(ext.maxX, p.x); ext.minY = Math.min(ext.minY, p.y); ext.maxY = Math.max(ext.maxY, p.y); ext.maxZ = Math.max(ext.maxZ, p.z)
      for (const [ci, cam] of cams.entries()) { tmp.copy(p).project(cam); const v = Math.max(Math.abs(tmp.x), Math.abs(tmp.y)); if (v > worstNdc) { worstNdc = v; worstWhere = `${m.id} ${stance} aspect ${aspects[ci]}` } } }
    for (const l of rig.legs) { const a = l.foot.getWorldPosition(P3); if (a.y < .07 - .002) { fail(`${m.id} (${stance}) a foot goes through the floor (y=${a.y.toFixed(3)})`); break } }
    if (stance === 'orthodox' && m.category === 'punches') { for (const [gi, g] of rig.glove.entries()) best = Math.max(best, g.getWorldPosition(P3).distanceTo(rig.sh[gi].getWorldPosition(tmp))) } }
  if (straight > .875) note(`${m.id} (${stance}) locks a leg almost straight (reach ${straight.toFixed(3)}m of ${(L1 + L2).toFixed(2)}m)`)
  if (stance === 'orthodox' && m.category === 'punches') punchReach[m.id] = best
  const g = resolvePose({}, stance), off = Math.max(...KEYS.map(k => Math.abs(pl.cur[k] - g[k]))); if (off > .01) fail(`${m.id} (${stance}) does not end at guard (off by ${off.toFixed(3)})` ) }
// ---- combinations (all presets + long custom mixes), both stances, normal and slow motion ----
const customCombos: string[][] = [['jab', 'cross', 'roll-left', 'lead-hook', 'pivot-right', 'body-cross', 'slip-left', 'switch-step', 'overhand', 'backward-step'], ['step-jab', 'cross', 'lead-uppercut', 'rear-hook', 'duck', 'bob-weave', 'angle-exit-left', 'forward-step', 'lunge-step', 'jab'], ['jab', 'jab', 'jab', 'cross', 'lead-hook', 'cross', 'lead-hook', 'cross', 'lead-hook', 'rear-uppercut', 'slip-right', 'roll-right', 'v-step', 'l-step', 'pivot-left', 'side-step-left', 'side-step-right', 'shuffle']]
let combosRun = 0
for (const ids of [...PRESETS.map(p => p.ids), ...customCombos]) for (const stance of ['orthodox', 'southpaw'] as const) for (const speed of [1, .25]) {
  const pl = new Player(); pl.load(ids, { stance, speed }); const label = ids.join('>'); combosRun++
  for (let i = 0, n = Math.ceil((pl.length + .05) * 60); i < n; i++) { const c = pl.update(1 / 60), fit = applyPose(rig, c, 0)
    if (fit.err > .001) { fail(`combo ${label} (${stance}) leg cannot reach its foot target`); break }
    collect(); let off = false; for (const p of pts) { for (const [ci, cam] of cams.entries()) { tmp.copy(p).project(cam); const v = Math.max(Math.abs(tmp.x), Math.abs(tmp.y)); if (v > worstNdc) { worstNdc = v; worstWhere = `combo ${label} ${stance} aspect ${aspects[ci]}` } } }
    for (const l of rig.legs) if (l.foot.getWorldPosition(P3).y < .07 - .002) off = true; if (off) { fail(`combo ${label} (${stance}) foot goes through the floor`); break } }
  const g = resolvePose({}, stance), offg = Math.max(...KEYS.map(k => Math.abs(pl.cur[k] - g[k]))); if (offg > .01) fail(`combo ${label} (${stance}) does not end at guard`) }
console.log(`${combosRun} combination runs checked (presets + 3 long custom combos, both stances, 1x and 0.25x)`)
// ---- guard position: gloves up at the chin, in front of the face, both feet flat ----
applyPose(rig, BASE, 0); rig.root.updateMatrixWorld(true); const head = rig.head.getWorldPosition(new THREE.Vector3())
for (const g of rig.glove) { const l = rig.root.worldToLocal(g.getWorldPosition(new THREE.Vector3())), hl = rig.root.worldToLocal(head.clone()); if (!(l.z - hl.z > .12 && Math.abs(l.y - hl.y) < .22)) fail(`guard glove not in front of the chin (z+${(l.z - hl.z).toFixed(2)}, dy ${(l.y - hl.y).toFixed(2)})`) }
// ---- punches must really extend ----
for (const m of MOVEMENTS.filter(x => x.category === 'punches' && x.sub !== 'Feints')) { const r = punchReach[m.id], need = m.sub === 'Straights' || m.sub === 'Overhands' ? .55 : .3; if (r < need) fail(`${m.id} barely extends (glove ${r.toFixed(2)}m from shoulder, needs ${need})`) }

// ---- technique mechanics (measured on the real skeleton, root frame: x +left, y up, z forward) ----
type F = { head: THREE.Vector3; g: THREE.Vector3[]; el: THREE.Vector3[]; foot: THREE.Vector3[]; pelvisY: number; py: number; ty: number }
function frames(id: string): F[] { const pl = new Player(); pl.load([id]); const out: F[] = []
  for (let i = 0, n = Math.ceil(pl.length * 60); i < n; i++) { const c = pl.update(1 / 60); applyPose(rig, c, 0); rig.root.updateMatrixWorld(true)
    const L = (o: THREE.Object3D) => rig.root.worldToLocal(o.getWorldPosition(new THREE.Vector3()))
    out.push({ head: L(rig.head), g: rig.glove.map(L), el: rig.el.map(L), foot: rig.legs.map(l => L(l.foot)), pelvisY: rig.pelvis.position.y, py: c.py, ty: c.ty }) } return out }
const G0 = frames('guard')[0], max = (a: number[]) => Math.max(...a), min = (a: number[]) => Math.min(...a)
const check = (ok: boolean, msg: string) => { if (!ok) fail('mechanics: ' + msg) }
for (const id of ['lead-uppercut', 'rear-uppercut', 'body-uppercut']) { const f = frames(id), arm = id === 'lead-uppercut' || id === 'body-uppercut' ? 0 : 1; const ys = f.map(x => x.g[arm].y); const i = ys.indexOf(max(ys)); check(max(ys) - min(ys.slice(0, i + 1)) > .12, `${id} glove must rise (rose ${(max(ys) - min(ys.slice(0, i + 1))).toFixed(2)}m)`); check(max(f.map(x => x.pelvisY)) - min(f.map(x => x.pelvisY)) > .1, `${id} must dip then drive up through the legs`) }
for (const [id, arm] of [['lead-hook', 0], ['rear-hook', 1]] as const) { const f = frames(id), k = f.map(x => x.g[arm].y).indexOf(max(f.map(x => x.g[arm].y))); const e = f[Math.floor(f.length * .6)]; check(Math.abs(e.g[arm].y - e.el[arm].y) < .14, `${id} elbow should be level with the fist (gap ${(Math.abs(e.g[arm].y - e.el[arm].y)).toFixed(2)}m)`); void k
  const ys = f.slice(Math.floor(f.length * .3), Math.floor(f.length * .7)).map(x => x.g[arm].y); check(max(ys) - min(ys) < .2, `${id} should travel horizontally (vertical drift ${(max(ys) - min(ys)).toFixed(2)}m)`) }
for (const id of ['body-jab', 'body-cross', 'body-hook', 'rear-body-hook', 'body-uppercut']) { const f = frames(id); check(min(f.map(x => x.pelvisY)) < .79, `${id} must bend the knees to change level`); check(min(f.flatMap(x => x.g.map(g => g.y))) < G0.head.y - .4, `${id} glove should reach body height (lowest ${min(f.flatMap(x => x.g.map(g => g.y))).toFixed(2)}m)`) }
{ const f = frames('cross'); check(max(f.map(x => Math.abs(x.py + x.ty))) > .5, 'cross must turn hips and shoulders (>0.5 rad)'); check(max(f.map(x => Math.abs(x.py))) > .25, 'cross: hips must turn, not only the shoulders') }
for (const [id, dir] of [['slip-left', 1], ['slip-right', -1]] as const) { const f = frames(id); check(max(f.map(x => (x.head.x - G0.head.x) * dir)) > .15, `${id} head must move off the centre line (>15cm)`) }
for (const id of ['duck', 'bob-weave', 'roll-left', 'roll-right']) { const f = frames(id); check(G0.head.y - min(f.map(x => x.head.y)) > .3, `${id} head must drop at least 30cm`) }
for (const id of ['roll-left', 'roll-right', 'bob-weave']) { const f = frames(id); check(max(f.map(x => x.head.x)) - min(f.map(x => x.head.x)) > .2, `${id} head must sweep sideways under the punch`) }
for (const id of ['slip-left', 'slip-right', 'duck', 'bob-weave', 'roll-left', 'roll-right', 'pull-back', 'lean-back', 'high-guard', 'jab', 'cross', 'lead-hook', 'rear-hook']) { const f = frames(id); check(max(f.flatMap(x => x.g.map(g => g.distanceTo(x.head)))) < (id.includes('hook') || id === 'jab' || id === 'cross' ? 1 : .6), `${id}: hands must stay near the face (guard kept)`) }
for (const id of ['slip-left', 'slip-right', 'duck', 'bob-weave', 'roll-left', 'roll-right', 'pull-back', 'lean-back']) { const f = frames(id); check(max(f.flatMap(x => x.g.map(g => g.distanceTo(x.head)))) < .6, `${id}: both gloves must stay within 60cm of the head`) }
for (const id of ['pivot-left', 'pivot-right']) { const f = frames(id); const ws = f.map(x => { const v = x.foot[0]; return v }); const drift = max(ws.map(v => v.distanceTo(ws[0]))); check(drift < .06, `${id} front foot must stay planted while the body turns (moved ${(drift * 100).toFixed(0)}cm)`) }
for (const id of ['forward-step', 'backward-step', 'side-step-left', 'side-step-right', 'lunge-step', 'v-step', 'angle-exit-left', 'angle-exit-right']) { const f = frames(id); check(max(f.flatMap(x => x.foot.map(v => v.y))) > .13, `${id}: feet must lift off the floor when stepping`) }
// ---- framing ----
// ---- framing: every context the app uses x every camera angle x every screen shape, projected through a real camera ----
const asp = [.5, .65, .9, 1.33, 1.78, 2.4], views: [number, number][] = [[0, .1], [Math.PI / 2, .1], [Math.PI, .1], [-Math.PI / 2, .1], [0, 1.1], [Math.PI / 4, .6], [0, -.05], [Math.PI / 2, 1.1]]
const cam = new THREE.PerspectiveCamera(FOV, 1, .1, 80); let worst = 0, worstAt = '', projections = 0
function project(fit: string[], plays: string[][], stance: 'orthodox' | 'southpaw', label: string, a: number, az: number, el: number) {
  const f = solveFrame(measure(fit, stance), a, az, el), R = f.z, ce = Math.cos(el)
  cam.aspect = a; cam.position.set(Math.sin(az) * ce * R, f.lookY + Math.sin(el) * R, Math.cos(az) * ce * R); cam.lookAt(0, f.lookY, 0); cam.updateProjectionMatrix(); cam.updateMatrixWorld(true)
  for (const ids of plays) { const p = new Player(); p.load(ids, { stance }); for (let i = 0, n = Math.ceil((p.length + .05) * 40); i <= n; i++) { applyPose(rig, p.update(1 / 40), 0); const q = bodyPoints(rig)
    for (let k = 0; k < q.length; k += 3) { tmp.set(q[k], q[k + 1], q[k + 2]).project(cam); const v = Math.max(Math.abs(tmp.x), Math.abs(tmp.y)); projections++; if (v > worst) { worst = v; worstAt = `${label} ${stance} aspect ${a} az ${az.toFixed(2)} el ${el}` } } } } }
const DEMO = ['jab', 'cross', 'lhook', 'rhook', 'upper', 'guard', 'slipL', 'slipR', 'duck', 'roll', 'step-jab']
for (const stance of ['orthodox', 'southpaw'] as const) for (const m of MOVEMENTS) for (const a of [.65, 1.78]) for (const [az, el] of views.slice(0, 6)) project([m.id], [[m.id]], stance, m.id, a, az, el) // Library: any single movement
for (const stance of ['orthodox', 'southpaw'] as const) for (const pr of PRESETS) for (const a of asp) for (const [az, el] of views) project(pr.ids, [pr.ids], stance, pr.name, a, az, el) // combos
for (const prog of PROGRAMS) for (const day of [1, prog.days]) { const w = getWorkout(prog, day), fit = [...new Set(w.pool.flatMap(c => c.moves))]; for (const a of asp) for (const [az, el] of views) project(fit, w.pool.map(c => c.moves), 'orthodox', `${prog.id} day ${day}`, a, az, el) } // workouts
for (const a of asp) for (const [az, el] of views) project(DEMO, DEMO.map(x => [x]), 'orthodox', 'landing', a, az, el) // landing hero
console.log(`framing: ${projections.toLocaleString()} body points projected through a real camera (all movements, presets, workouts, landing; both stances; ${asp.length} screen shapes; ${views.length} camera angles incl. front, left, back, right, high, low)`)
if (worst > .985) fail(`something leaves the screen: ${worstAt} reaches ${worst.toFixed(3)} of the frame edge`)
const guardPts = measure(['guard']), t2 = Math.tan(FOV * Math.PI / 360); let gy0 = 9, gy1 = -9; for (let i = 1; i < guardPts.length; i += 3) { if (guardPts[i + 1 - 1] !== undefined) { gy0 = Math.min(gy0, guardPts[i]); gy1 = Math.max(gy1, guardPts[i]) } }
console.log(`closest to screen edge: ${(worst * 100).toFixed(0)}% of half-frame (${worstAt}); longest leg reach ${maxReach.toFixed(3)}m of ${(L1 + L2).toFixed(2)}m`)
const wk = getWorkout(PROGRAMS[0], 1), wf = measure([...new Set(wk.pool.flatMap(c => c.moves))])
console.log('boxer height as share of the coach area (beginner workout): ' + [[.65, 'narrow phone'], [.9, 'phone'], [1.33, 'tablet'], [1.78, 'desktop']].map(([a, n]) => `${n} ${((gy1 - gy0) / (2 * solveFrame(wf, a as number, 0, .1).z * t2) * 100).toFixed(0)}%`).join(', '))
console.log(`${MOVEMENTS.length} movements x 2 stances, ${PRESETS.length} presets checked. ${bad} failures, ${warn} warnings.`)
process.exit(bad ? 1 : 0)
