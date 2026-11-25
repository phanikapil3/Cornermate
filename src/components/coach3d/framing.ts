// Camera framing. For the movements that will be shown, solve the closest camera distance that keeps EVERY body point
// (head, gloves, feet) inside the frame, for the actual shape of the display area. No guessing, no stretching:
// the boxer is simply as large as the screen allows. A narrow lens (26 degrees) keeps proportions natural.
export const FOV = 26
export const LIMIT = .93 // the farthest point may use 93% of the half-frame; the rest is safety margin
// Closest camera RADIUS that keeps every body point inside the frame when the viewer has orbited by `az` and tilted by `el` (radians).
// Exact for any angle, so the boxer never clips however the camera is turned.
export function solveFrame(pts: number[], aspect: number, az = 0, el = 0) {
  const t = Math.tan(FOV * Math.PI / 360); let lo = Infinity, hi = -Infinity
  for (let i = 1; i < pts.length; i += 3) { lo = Math.min(lo, pts[i]); hi = Math.max(hi, pts[i]) }
  const ly = (lo + hi) / 2, ce = Math.cos(el), se = Math.sin(el), sa = Math.sin(az), ca = Math.cos(az)
  const dx = sa * ce, dy = se, dz = ca * ce, rx = ca, rz = -sa, ux = dy * rz, uy = dz * rx - dx * rz, uz = -dy * rx // d = target->camera, r = right, u = up
  let z = 2
  for (let i = 0; i < pts.length; i += 3) { const qx = pts[i], qy = pts[i + 1] - ly, qz = pts[i + 2]
    const depth = qx * dx + qy * dy + qz * dz, xc = qx * rx + qz * rz, yc = qx * ux + qy * uy + qz * uz
    z = Math.max(z, depth + Math.max(Math.abs(xc) / (LIMIT * t * aspect), Math.abs(yc) / (LIMIT * t))) }
  return { z, lookY: ly }
}
