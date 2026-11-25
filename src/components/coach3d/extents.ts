// Measures the space a set of movements occupies, so the camera can frame exactly what will be shown.
import * as THREE from 'three'
import { createBoxer, type Rig } from './rig'
import { applyPose } from './rig'
import { Player, type Stance } from '../../library/player'
import { getMovement } from '../../library/movements'
let rig: Rig | null = null
const cache = new Map<string, number[]>()
/** Key points of the body in world space (head, gloves with their radius, elbows, shoulders, knees, feet). Used by the app and the tests. */
export function bodyPoints(r: Rig, out: number[] = []): number[] {
  r.root.updateMatrixWorld(true); const v = new THREE.Vector3()
  const w = (o: THREE.Object3D, x = 0, y = 0, z = 0) => { o.localToWorld(v.set(x, y, z)); out.push(v.x, v.y, v.z) }
  w(r.head, 0, .16, 0); w(r.head, 0, -.14, 0); w(r.head, .12, 0, 0); w(r.head, -.12, 0, 0); w(r.pelvis); w(r.torso, .2, .5, 0); w(r.torso, -.2, .5, 0)
  for (const g of r.glove) for (const [x, y] of [[.13, 0], [-.13, 0], [0, .13], [0, -.13]]) w(g, x, y, 0)
  for (const e of r.el) w(e); for (const l of r.legs) { w(l.knee); w(l.foot); w(l.foot, 0, -.07, .22); w(l.foot, 0, -.07, -.1); w(l.foot, .07, -.07, .05); w(l.foot, -.07, -.07, .05) }
  return out
}
const dedupe = (flat: number[]) => { const m = new Map<string, number[]>(); for (let i = 0; i < flat.length; i += 3) { const k = `${Math.round(flat[i] * 50)},${Math.round(flat[i + 1] * 50)},${Math.round(flat[i + 2] * 50)}`; if (!m.has(k)) m.set(k, [flat[i], flat[i + 1], flat[i + 2]]) } return [...m.values()].flat() }
function one(id: string, stance: Stance): number[] {
  const key = stance + '|' + id; const hit = cache.get(key); if (hit) return hit
  rig ??= createBoxer(); const pl = new Player(); pl.load([id], { stance }); const pts: number[] = []
  for (let i = 0, n = Math.ceil((pl.length + .05) * 30); i <= n; i++) { applyPose(rig, pl.update(1 / 30), 0); bodyPoints(rig, pts) }
  const res = dedupe(pts); cache.set(key, res); return res
}
/** Points covering every movement in `ids` (plus the resting guard) for the given stance. */
export function measure(ids: string[], stance: Stance = 'orthodox'): number[] {
  const all: number[] = [...one('guard', stance)]
  for (let a = 0; a < 8; a++) all.push(Math.cos(a * Math.PI / 4) * .63, 0, Math.sin(a * Math.PI / 4) * .63) // the floor ring is framed too
  for (const raw of new Set(ids)) { const m = getMovement(raw); if (m) all.push(...one(m.id, stance)) }
  return dedupe(all)
}
