// The boxer's skeleton + body. Used by the 3D view AND by the test scripts, so what is tested is what is drawn.
import * as THREE from 'three'
import { BASE, type Pose } from './poses'
export const L1 = .45, L2 = .45, ANKLE_H = .07, HIP_X = .1
const mat = (color: string, roughness = .7, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness })
const M = { skin: mat('#c08a6e', .65), shirt: mat('#1a1a1a', .75), shorts: mat('#e11d2e', .55), glove: mat('#e11d2e', .3, .12), white: mat('#f4f4f4', .55), hair: mat('#0f0f0f', .9), eye: mat('#0a0a0a', .4) }
// Proportions: about 7.5 heads tall, broad shoulders, thick thighs and calves, big boxing gloves and boots (no stick limbs).
const G = {
  upper: new THREE.CapsuleGeometry(.054, .19, 6, 12), fore: new THREE.CapsuleGeometry(.047, .16, 6, 12), thigh: new THREE.CapsuleGeometry(.088, .27, 6, 14), shin: new THREE.CapsuleGeometry(.066, .3, 6, 12), trunk: new THREE.CapsuleGeometry(.102, .1, 6, 14),
  chest: new THREE.CapsuleGeometry(.15, .3, 6, 16), head: new THREE.SphereGeometry(.118, 24, 18), cap: new THREE.SphereGeometry(.123, 20, 12, 0, Math.PI * 2, 0, Math.PI * .5), band: new THREE.TorusGeometry(.12, .013, 8, 24), eye: new THREE.SphereGeometry(.014, 8, 6),
  glove: new THREE.SphereGeometry(.1, 20, 14), cuff: new THREE.CylinderGeometry(.056, .056, .07, 14), boot: new THREE.BoxGeometry(.115, .1, .27), shaft: new THREE.CylinderGeometry(.062, .066, .15, 12), pelvis: new THREE.SphereGeometry(.12, 18, 14), ball: new THREE.SphereGeometry(.072, 14, 10), neck: new THREE.CylinderGeometry(.048, .055, .12, 12),
}
const add = (parent: THREE.Object3D, g: THREE.BufferGeometry, m: THREE.Material, pos: [number, number, number] = [0, 0, 0], scale?: [number, number, number]) => { const o = new THREE.Mesh(g, m); o.position.set(...pos); if (scale) o.scale.set(...scale); parent.add(o); return o }
export type Leg = { thigh: THREE.Group; knee: THREE.Group; foot: THREE.Group }
export type Rig = { root: THREE.Group; pelvis: THREE.Group; torso: THREE.Group; head: THREE.Group; sh: THREE.Group[]; el: THREE.Group[]; glove: THREE.Object3D[]; legs: Leg[] }
export function createBoxer(): Rig {
  const root = new THREE.Group(), pelvis = new THREE.Group(); root.add(pelvis)
  add(pelvis, G.pelvis, M.shorts, [0, -.03, 0], [1.75, 1.2, 1.3])
  const torso = new THREE.Group(); torso.position.y = .05; pelvis.add(torso)
  add(torso, G.chest, M.shirt, [0, .27, 0], [1.38, 1, .82]); add(torso, G.neck, M.skin, [0, .62, 0])
  const head = new THREE.Group(); head.position.y = .73; torso.add(head)
  add(head, G.head, M.skin, [0, 0, 0], [.95, 1.1, 1]); add(head, G.cap, M.hair, [0, .02, 0], [.95, 1.1, 1]); add(head, G.band, M.glove, [0, .05, 0]).rotation.x = Math.PI / 2
  for (const x of [-.042, .042]) add(head, G.eye, M.eye, [x, .02, .108]) // eyes show which way the head is facing
  const arm = (x: number) => { const sh = new THREE.Group(); sh.position.set(x, .5, 0); torso.add(sh); add(sh, G.ball, M.shirt); add(sh, G.upper, M.skin, [0, -.14, 0])
    const el = new THREE.Group(); el.position.y = -.28; sh.add(el); add(el, G.fore, M.skin, [0, -.13, 0]); add(el, G.cuff, M.white, [0, -.24, 0])
    return { sh, el, glove: add(el, G.glove, M.glove, [0, -.33, 0], [1.05, 1.18, 1.2]) } }
  const leg = (): Leg => { const thigh = new THREE.Group(); root.add(thigh); add(thigh, G.thigh, M.skin, [0, -.225, 0]); add(thigh, G.trunk, M.shorts, [0, -.1, 0])
    const knee = new THREE.Group(); knee.position.y = -L1; thigh.add(knee); add(knee, G.shin, M.skin, [0, -.225, 0])
    const foot = new THREE.Group(); foot.position.y = -L2; knee.add(foot); add(foot, G.boot, M.white, [0, -.02, .07]); add(foot, G.shaft, M.white, [0, .05, 0]); return { thigh, knee, foot } }
  const a0 = arm(.22), a1 = arm(-.22)
  return { root, pelvis, torso, head, sh: [a0.sh, a1.sh], el: [a0.el, a1.el], glove: [a0.glove, a1.glove], legs: [leg(), leg()] }
}
const Y = new THREE.Vector3(0, 1, 0), DOWN = new THREE.Vector3(0, -1, 0)
const v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), v3 = new THREE.Vector3(), hip = new THREE.Vector3(), ank = new THREE.Vector3(), dir = new THREE.Vector3(), pole = new THREE.Vector3(), knee = new THREE.Vector3(), tmp = new THREE.Vector3()
const qT = new THREE.Quaternion(), qS = new THREE.Quaternion(), qF = new THREE.Quaternion(), eul = new THREE.Euler()
// Poses the whole body: pelvis + feet (planted, solved with 2-bone IK), spine, head (auto-levelled), arms. Returns leg reach for testing.
export function applyPose(r: Rig, c: Pose, t = 0): { reach: number; err: number } {
  const frontLeft = c.lfz >= c.rfz, p = frontLeft ? v1.set(c.lfx, 0, c.lfz) : v1.set(c.rfx, 0, c.rfz), yb = frontLeft ? BASE.ryaw : -BASE.ryaw
  v2.copy(p).applyAxisAngle(Y, yb); v3.copy(p).applyAxisAngle(Y, c.ryaw) // pivot: keep the front foot fixed on the floor while the body turns
  r.root.position.set(c.rx + c.pv * (v2.x - v3.x), 0, c.rz + c.pv * (v2.z - v3.z)); r.root.rotation.y = c.ryaw
  r.pelvis.position.set(c.wx, c.wy + Math.sin(t * 3) * .006, c.wz); r.pelvis.rotation.set(0, c.py, c.pr, 'YXZ') // breathing bob
  const feet = [[c.lfx, c.lfz, c.lfl, c.lfr], [c.rfx, c.rfz, c.rfl, c.rfr]]; let reach = 0, err = 0
  r.legs.forEach((lg, i) => {
    const [fx, fz, fl, fr] = feet[i]; hip.set(i ? -HIP_X : HIP_X, -.02, 0).applyEuler(r.pelvis.rotation).add(r.pelvis.position); ank.set(fx, ANKLE_H + fl, fz)
    dir.subVectors(ank, hip); const dist = dir.length(); reach = Math.max(reach, dist); const len = Math.min(Math.max(dist, .1), L1 + L2 - .004); dir.multiplyScalar(1 / (dist || 1))
    err = Math.max(err, Math.abs(dist - len)); ank.copy(hip).addScaledVector(dir, len)
    pole.set(Math.sin(fr), 0, Math.cos(fr)); pole.addScaledVector(dir, -pole.dot(dir)); if (pole.lengthSq() < 1e-6) pole.set(0, 0, 1); pole.normalize() // knees point the way the toes point
    const a = len / 2, h = Math.sqrt(Math.max(0, L1 * L1 - a * a)); knee.copy(hip).addScaledVector(dir, a).addScaledVector(pole, h)
    lg.thigh.position.copy(hip); qT.setFromUnitVectors(DOWN, tmp.subVectors(knee, hip).normalize()); lg.thigh.quaternion.copy(qT)
    qS.setFromUnitVectors(DOWN, tmp.subVectors(ank, knee).normalize()); lg.knee.quaternion.copy(qT).invert().multiply(qS)
    qF.setFromEuler(eul.set(0, fr, 0)); lg.foot.quaternion.copy(qS).invert().multiply(qF) // foot stays flat on the floor
  })
  r.torso.rotation.set(c.tx, c.ty, c.tz)
  r.head.rotation.set(c.hx - .6 * c.tx, c.hy - .65 * (c.py + c.ty), c.hz - .5 * c.tz) // head stays level and looks at the target while the body turns
  const sides = [['l', 0], ['r', 1]] as const
  for (const [s, i] of sides) { const k = (n: string) => c[(s + n) as keyof Pose]; r.sh[i].position.z = k('sp'); r.sh[i].rotation.set(k('sx'), k('sy'), k('sz')); r.el[i].rotation.x = k('e') }
  return { reach, err }
}
