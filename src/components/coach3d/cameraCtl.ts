// Shared state between the on-screen camera buttons (DOM) and the camera rig (inside the 3D canvas).
// The camera orbits the boxer: az = around (any angle, 360 degrees and more), el = height angle (limited so it can never flip over).
// None of this touches the boxer's body animation: only the camera moves.
export type CameraCtl = { az: number; azTo: number | null; el: number; elTo: number | null; zoom: number; resetting: boolean }
export const EL0 = .1, EL_MIN = -.05, EL_MAX = 1.1, ZOOM_MIN = .55, ZOOM_MAX = 1.6, TAU = Math.PI * 2
export const newCtl = (): CameraCtl => ({ az: 0, azTo: null, el: EL0, elTo: null, zoom: 1, resetting: false })
export const clampZoom = (z: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z))
export const clampEl = (e: number) => Math.min(EL_MAX, Math.max(EL_MIN, e))
export const nearestAngle = (cur: number, target: number) => target + TAU * Math.round((cur - target) / TAU) // shortest way round
