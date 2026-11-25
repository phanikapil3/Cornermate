// Pose = the whole body as numbers. Lengths in metres, angles in radians. Left = +x side. "Lead" side = left in orthodox.
//  root:   rx rz (travel), ryaw (body turn), pv (0..1: pivot about the front foot instead of the body centre)
//  pelvis: wx wz (weight shift sideways/forward), wy (hip height: lower = knees bend), py (hip turn), pr (hip tilt)
//  torso:  tx (lean forward), ty (shoulder turn on top of hips), tz (lean sideways).  head: hx hy hz (extra; head is auto-levelled)
//  arms:   *sx *sy *sz shoulder (x forward/back, y twist, z out/in), *e elbow bend (negative = forward), *sp shoulder reach forward (m)
//  feet:   *fx *fz position on the floor (m, relative to root), *fl lift off the floor (m), *fr foot turn. Legs are solved with IK from these.
export const KEYS = ['rx','rz','ryaw','pv','wx','wy','wz','py','pr','tx','ty','tz','hx','hy','hz','lsx','lsy','lsz','le','lsp','rsx','rsy','rsz','re','rsp','lfx','lfz','lfl','lfr','rfx','rfz','rfl','rfr'] as const
export type Key = typeof KEYS[number]
export type Pose = Record<Key, number>
export const BASE: Pose = { rx:0, rz:0, ryaw:-0.3, pv:0, wx:0, wy:.9, wz:0, py:0, pr:0, tx:.12, ty:0, tz:0, hx:.1, hy:0, hz:0,
  lsx:-.9, lsy:0, lsz:-.15, le:-2, lsp:0, rsx:-.95, rsy:0, rsz:.15, re:-2, rsp:0,
  lfx:.17, lfz:.2, lfl:0, lfr:-.1, rfx:-.17, rfz:-.22, rfl:0, rfr:-.6 }
// Left/right mirror: used for southpaw stance (every movement mirrors automatically).
export const mirrorPose = (p: Pose): Pose => ({ ...p,
  rx:-p.rx, ryaw:-p.ryaw, wx:-p.wx, py:-p.py, pr:-p.pr, ty:-p.ty, tz:-p.tz, hy:-p.hy, hz:-p.hz,
  lsx:p.rsx, lsy:-p.rsy, lsz:-p.rsz, le:p.re, lsp:p.rsp, rsx:p.lsx, rsy:-p.lsy, rsz:-p.lsz, re:p.le, rsp:p.lsp,
  lfx:-p.rfx, lfz:p.rfz, lfl:p.rfl, lfr:-p.rfr, rfx:-p.lfx, rfz:p.lfz, rfl:p.lfl, rfr:-p.lfr })
