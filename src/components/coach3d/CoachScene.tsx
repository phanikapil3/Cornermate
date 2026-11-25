import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useProgress } from '@react-three/drei'
import Boxer from './Boxer'
import GlbBoxer from './GlbBoxer'
import Boundary from './Boundary'
import { FOV, solveFrame } from './framing'
import { measure } from './extents'
import { TAU, EL0, clampZoom, clampEl, type CameraCtl } from './cameraCtl'
import { Player, type PlayRequest, type Stance } from '../../library/player'
const GLB_URL = '/models/boxer.glb'
function useGlbAvailable() {
  const [s, setS] = useState<'checking' | 'yes' | 'no'>('checking')
  useEffect(() => { let on = true
    fetch(GLB_URL, { method: 'HEAD' }).then(r => { const t = r.headers.get('content-type') || ''; if (on) setS(r.ok && !t.includes('text/html') ? 'yes' : 'no') }).catch(() => on && setS('no'))
    return () => { on = false } }, [])
  return s
}
// Camera rig: frames exactly the movements being shown (so nothing is clipped at ANY angle), and lets the viewer orbit 360 degrees
// (drag / swipe), tilt up and down, zoom (pinch, Ctrl+wheel or buttons) and reset (double-click or button). Independent of the body animation.
function FitCamera({ ids, stance, ctl, inspect }: { ids: string[]; stance: Stance; ctl: CameraCtl; inspect: boolean }) {
  const size = useThree(s => s.size), camera = useThree(s => s.camera), gl = useThree(s => s.gl); const key = ids.join('|') + stance
  const pts = useMemo(() => measure(ids, stance), [key]); const aspect = size.width / Math.max(1, size.height)
  const cur = useRef<{ r: number; l: number } | null>(null), last = useRef({ az: NaN, el: NaN, aspect: 0, key: '' }), sol = useRef({ z: 4, lookY: 1 })
  useEffect(() => { const el = gl.domElement, ptr = new Map<number, { x: number; y: number; type: string }>(); const gap = () => { const [a, b] = [...ptr.values()]; return Math.hypot(a.x - b.x, a.y - b.y) || 1 }
    const down = (e: PointerEvent) => { try { el.setPointerCapture(e.pointerId) } catch { /* ignore */ } ptr.set(e.pointerId, { x: e.clientX, y: e.clientY, type: e.pointerType }); ctl.resetting = false; ctl.azTo = null; ctl.elTo = null; el.style.cursor = 'grabbing' }
    const move = (e: PointerEvent) => { const p = ptr.get(e.pointerId); if (!p) return
      if (ptr.size === 1) { ctl.az -= (e.clientX - p.x) * .01 // drag / swipe sideways = orbit around the boxer
        if (p.type === 'mouse' || inspect) ctl.el = clampEl(ctl.el + (e.clientY - p.y) * .008) } // drag up/down = camera height (touch only in inspect mode, so the page can still scroll)
      else if (ptr.size === 2) { const before = gap(); p.x = e.clientX; p.y = e.clientY; ctl.zoom = clampZoom(ctl.zoom * before / gap()); return } // pinch = zoom
      p.x = e.clientX; p.y = e.clientY }
    const up = (e: PointerEvent) => { ptr.delete(e.pointerId); if (!ptr.size) el.style.cursor = 'grab' }
    const wheel = (e: WheelEvent) => { if (!(e.ctrlKey || e.metaKey)) return; e.preventDefault(); ctl.zoom = clampZoom(ctl.zoom * Math.exp(e.deltaY * .002)) } // Ctrl/Cmd+wheel or trackpad pinch
    const dbl = () => { ctl.resetting = true; ctl.azTo = null; ctl.elTo = null }
    el.style.cursor = 'grab'; el.style.touchAction = inspect ? 'none' : 'pan-y' /* inspect: all swipes steer the camera; otherwise vertical swipes still scroll the page */
    el.addEventListener('pointerdown', down); el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('wheel', wheel, { passive: false }); el.addEventListener('dblclick', dbl)
    return () => { el.removeEventListener('pointerdown', down); el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); el.removeEventListener('wheel', wheel); el.removeEventListener('dblclick', dbl) } }, [gl, ctl, inspect])
  useFrame((_, dt) => { const k = 1 - Math.exp(-8 * Math.min(dt, .25))
    if (ctl.resetting) { const to = Math.round(ctl.az / TAU) * TAU; ctl.az += (to - ctl.az) * k; ctl.el += (EL0 - ctl.el) * k; ctl.zoom += (1 - ctl.zoom) * k
      if (Math.abs(to - ctl.az) < .002 && Math.abs(EL0 - ctl.el) < .002 && Math.abs(1 - ctl.zoom) < .002) { ctl.az = 0; ctl.el = EL0; ctl.zoom = 1; ctl.resetting = false } }
    if (!ctl.resetting && ctl.azTo !== null) { ctl.az += (ctl.azTo - ctl.az) * k; if (Math.abs(ctl.azTo - ctl.az) < .002) { ctl.az = ctl.azTo; ctl.azTo = null } }
    if (!ctl.resetting && ctl.elTo !== null) { ctl.el += (ctl.elTo - ctl.el) * k; if (Math.abs(ctl.elTo - ctl.el) < .002) { ctl.el = ctl.elTo; ctl.elTo = null } }
    ctl.el = clampEl(ctl.el) // the camera can never pass over the top or under the floor, so it can never flip upside down
    const L = last.current; if (L.az !== ctl.az || L.el !== ctl.el || L.aspect !== aspect || L.key !== key) { sol.current = solveFrame(pts, aspect, ctl.az, ctl.el); last.current = { az: ctl.az, el: ctl.el, aspect, key } }
    const T = sol.current, c = cur.current ??= { r: T.z, l: T.lookY }, k2 = 1 - Math.exp(-5 * Math.min(dt, .25))
    c.r += (T.z - c.r) * (T.z > c.r ? 1 : k2); c.l += (T.lookY - c.l) * k2 // pull back instantly when more room is needed, move in smoothly
    const R = c.r * ctl.zoom, ce = Math.cos(ctl.el); camera.position.set(Math.sin(ctl.az) * ce * R, c.l + Math.sin(ctl.el) * R, Math.cos(ctl.az) * ce * R); camera.lookAt(0, c.l, 0) })
  return null
}
function LoadingOverlay() {
  const { active, progress } = useProgress()
  if (!active) return null
  return <div className="absolute inset-0 grid place-items-center pointer-events-none text-sm text-zinc-300"><div className="text-center"><div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-2 border-line border-t-ring" />Loading coach… {Math.round(progress)}%</div></div>
}
export default function CoachScene({ req, reqKey, fit, ctl, inspect, active, onFail }: { req: PlayRequest; reqKey: string; fit: string[]; ctl: CameraCtl; inspect: boolean; active: boolean; onFail: () => void }) {
  const glb = useGlbAvailable(); const player = useMemo(() => new Player(), []); if (import.meta.env.DEV) (window as unknown as { __coachPlayer?: Player }).__coachPlayer = player; const builtIn = <Boxer player={player} />
  useEffect(() => { player.load(req.ids, { speed: req.speed, stance: req.stance, loop: req.loop }) }, [player, reqKey]) // restarts whenever the request changes
  return (
    <>
      <Canvas dpr={[1, 1.75]} frameloop={active ? 'always' : 'never'} camera={{ position: [0, 1.1, 4.4], fov: FOV }} gl={{ antialias: true, powerPreference: 'high-performance' }} style={{ touchAction: 'pan-y' }}
        onCreated={({ gl }) => { gl.domElement.addEventListener('webglcontextlost', e => { e.preventDefault(); onFail() }) }}>
        <FitCamera ids={fit} stance={req.stance ?? 'orthodox'} ctl={ctl} inspect={inspect} /><hemisphereLight args={['#ffffff', '#3a0d12', .55]} /><ambientLight intensity={.35} /><directionalLight position={[3, 5, 4]} intensity={1.8} /><directionalLight position={[-3, 3, -2]} intensity={1.6} color="#e11d2e" />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .002, 0]}><circleGeometry args={[.63, 40]} /><meshBasicMaterial color="#000" transparent opacity={.45} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .004, 0]}><ringGeometry args={[.6, .63, 48]} /><meshBasicMaterial color="#e11d2e" /></mesh>
        {glb === 'yes' ? <Boundary fallback={builtIn}><Suspense fallback={null}><GlbBoxer url={GLB_URL} player={player} fallback={builtIn} /></Suspense></Boundary> : glb === 'no' ? builtIn : null}
      </Canvas>
      <LoadingOverlay />
    </>
  )
}
