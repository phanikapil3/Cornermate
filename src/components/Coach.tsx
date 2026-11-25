import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react'
import Coach2D from './Coach2D'
import Boundary from './coach3d/Boundary'
import CameraControls from './CameraControls'
import { newCtl } from './coach3d/cameraCtl'
import { to2D } from '../library/movements'
import type { PlayRequest } from '../library/player'
const CoachScene = lazy(() => import('./coach3d/CoachScene')) // 3D code loads only when needed
const webglOk = () => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')) } catch { return false } }
const Spinner = () => <div className="absolute inset-0 grid place-items-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-ring" /></div>
// Same props as before, so Landing and Train need no changes. Falls back to the 2D boxer if WebGL or the 3D scene fails.
export default function Coach({ move = 'guard', tick = 0, play, fit, inspect = false }: { move?: string; tick?: number; play?: PlayRequest; fit?: string[]; inspect?: boolean }) {
  // `inspect` = touch swipes steer the camera in every direction (use where the page need not scroll over the coach). `fit` = movement ids the camera must keep fully in frame (defaults to what is playing). The parent must be `relative` and sized.
  // `move` = one movement id (changes or `tick` changes restart it). `play` = a full sequence request from the library.
  const req: PlayRequest = play ?? { ids: [move], nonce: tick }; const reqKey = JSON.stringify([req.ids, req.speed, req.loop, req.stance, req.nonce]); const m2d = to2D(req.ids[0] ?? 'guard') as never
  const ctl = useMemo(newCtl, []); if (import.meta.env.DEV) (window as unknown as { __coachCtl?: unknown }).__coachCtl = ctl // dev-only, used by browser tests
  const ok = useMemo(webglOk, []); const [failed, setFailed] = useState(false)
  const ref = useRef<HTMLDivElement>(null); const [visible, setVisible] = useState(true)
  useEffect(() => { const el = ref.current; if (!el || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting)); io.observe(el); return () => io.disconnect() }, [])
  if (!ok || failed) return <div className="absolute inset-0"><Coach2D move={m2d} /></div>
  return (
    <div ref={ref} className="absolute inset-0">
      <Boundary fallback={<div className="absolute inset-0"><Coach2D move={m2d} /></div>} onError={() => setFailed(true)}>
        <Suspense fallback={<Spinner />}><CoachScene req={req} reqKey={reqKey} fit={fit ?? req.ids} ctl={ctl} inspect={inspect} active={visible} onFail={() => setFailed(true)} /></Suspense>
      </Boundary>
      <CameraControls ctl={ctl} defaultOpen={inspect} />
    </div>
  )
}
