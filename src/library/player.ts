import { BASE, KEYS, mirrorPose, type Pose } from '../components/coach3d/poses'
import { getMovement, DEFAULT_RECOVERY } from './movements'
export type Stance = 'orthodox' | 'southpaw'
export type PlayRequest = { ids: string[]; speed?: number; loop?: boolean; stance?: Stance; nonce?: number }
type Key = { t: number; pose: Pose; id: string; m?: Pose }
export const resolvePose = (p: Partial<Pose>, stance: Stance, mirror?: boolean): Pose => { let f: Pose = { ...BASE, ...p }; if (stance === 'southpaw') f = mirrorPose(f); if (mirror) f = mirrorPose(f); return f }
const mix = (a: Pose, b: Pose, w: number): Pose => { const o = { ...a }; for (const k of KEYS) o[k] = a[k] + (b[k] - a[k]) * w; return o }
const zeros = (): Pose => { const o = {} as Pose; for (const k of KEYS) o[k] = 0; return o }
// Turns a list of movement ids into one keyframe timeline and samples it every frame. No per-combination animations needed.
// Between keys it uses a monotone cubic spline: velocity is continuous (no stop-start at every key) and it never overshoots a key pose.
export class Player {
  cur: Pose = { ...BASE }; currentId = 'guard'
  private keys: Key[] = [{ t: 0, pose: { ...BASE }, id: 'guard', m: zeros() }]; private t = 0; private loop = false
  load(ids: string[], o: { speed?: number; stance?: Stance; loop?: boolean } = {}) {
    const sp = Math.max(.1, o.speed ?? 1), st = o.stance ?? 'orthodox', guard = resolvePose({}, st)
    const keys: Key[] = [{ t: 0, pose: { ...this.cur }, id: this.currentId }]; let t = 0 // starts from the current pose: no snapping
    ids.forEach((raw, n) => { const m = getMovement(raw); if (!m) return
      let last = guard
      for (const ph of m.phases) { t += ph.d / sp; last = resolvePose(ph.p, st, ph.mirror); keys.push({ t, pose: last, id: m.id }) }
      const rec = (m.recovery ?? DEFAULT_RECOVERY) / sp
      if (n === ids.length - 1) { t += rec; keys.push({ t, pose: guard, id: m.id }) } // end of sequence: relaxed return to guard
      else { t += rec * .4; keys.push({ t, pose: mix(last, guard, .45), id: m.id }) } // in a combo: partial recovery, flows into next move
    })
    if (keys.length === 1) keys.push({ t: .2, pose: guard, id: 'guard' })
    keys.forEach((k, j) => { const m = zeros(); if (j > 0 && j < keys.length - 1) for (const c of KEYS) {
      const d0 = (k.pose[c] - keys[j - 1].pose[c]) / (k.t - keys[j - 1].t), d1 = (keys[j + 1].pose[c] - k.pose[c]) / (keys[j + 1].t - k.t)
      m[c] = d0 * d1 > 0 ? 2 * d0 * d1 / (d0 + d1) : 0 } k.m = m })
    this.keys = keys; this.t = 0; this.loop = !!o.loop
  }
  get length() { return this.keys[this.keys.length - 1].t }
  seek(t: number) { this.t = Math.min(Math.max(0, t), this.length); this.update(0) } // jump to a moment of the timeline (used by browser tests)
  update(dt: number): Pose {
    const ks = this.keys, end = ks[ks.length - 1].t; this.t += dt
    if (this.t >= end) { if (this.loop && end > 0) { this.t %= end; ks[0] = { t: 0, pose: { ...ks[ks.length - 1].pose }, id: 'guard', m: zeros() } } else this.t = end }
    let i = 0; while (i < ks.length - 2 && this.t >= ks[i + 1].t) i++
    const a = ks[i], b = ks[i + 1], h = b.t - a.t, u = h > 0 ? Math.min(1, Math.max(0, (this.t - a.t) / h)) : 1
    const u2 = u * u, u3 = u2 * u, h00 = 2 * u3 - 3 * u2 + 1, h10 = u3 - 2 * u2 + u, h01 = -2 * u3 + 3 * u2, h11 = u3 - u2
    for (const k of KEYS) this.cur[k] = h00 * a.pose[k] + h10 * h * a.m![k] + h01 * b.pose[k] + h11 * h * b.m![k]
    this.currentId = this.t >= end && !this.loop ? 'guard' : b.id
    return this.cur
  }
}
// When each movement of a sequence starts (same timing rules as Player.load). Used to sync voice and sound effects with the animation.
export function schedule(ids: string[], speed = 1) {
  const sp = Math.max(.1, speed); let t = 0; const items: { id: string; start: number }[] = []
  ids.forEach((raw, n) => { const m = getMovement(raw); if (!m) return; items.push({ id: m.id, start: t })
    t += m.duration / sp + (m.recovery ?? DEFAULT_RECOVERY) * (n === ids.length - 1 ? 1 : .4) / sp })
  return { items, total: t }
}
