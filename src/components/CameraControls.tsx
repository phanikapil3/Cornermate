import { useState } from 'react'
import { Orbit, X, RotateCcw, RotateCw, ChevronUp, ChevronDown, ZoomIn, ZoomOut, Crosshair } from 'lucide-react'
import { clampZoom, clampEl, nearestAngle, EL0, type CameraCtl } from './coach3d/cameraCtl'
const btn = 'grid h-8 w-8 place-items-center rounded-full border border-line bg-black/60 text-zinc-200 backdrop-blur transition hover:border-ring hover:text-white'
const chip = 'h-7 rounded-full border border-line bg-black/60 px-2.5 text-[10px] font-bold uppercase tracking-wide text-zinc-200 backdrop-blur transition hover:border-ring hover:text-white'
// On-screen camera controls: rotate, tilt, zoom, reset and Front / Left / Back / Right views. Drag / swipe / pinch work too.
export default function CameraControls({ ctl, defaultOpen = false }: { ctl: CameraCtl; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen) // collapsed = one small button, so the controls never cover the boxer; dragging, pinching and double-click still work
  const go = (f: () => void) => () => { ctl.resetting = false; f() }
  const icons = [
    ['Rotate left 45 degrees', RotateCcw, go(() => { ctl.azTo = (ctl.azTo ?? ctl.az) + Math.PI / 4 })], ['Rotate right 45 degrees', RotateCw, go(() => { ctl.azTo = (ctl.azTo ?? ctl.az) - Math.PI / 4 })],
    ['Camera higher', ChevronUp, go(() => { ctl.elTo = clampEl((ctl.elTo ?? ctl.el) + .2) })], ['Camera lower', ChevronDown, go(() => { ctl.elTo = clampEl((ctl.elTo ?? ctl.el) - .2) })],
    ['Zoom in', ZoomIn, () => { ctl.zoom = clampZoom(ctl.zoom * .85) }], ['Zoom out', ZoomOut, () => { ctl.zoom = clampZoom(ctl.zoom / .85) }],
    ['Reset view', Crosshair, () => { ctl.resetting = true; ctl.azTo = null; ctl.elTo = null }]] as const
  const views = [['Front', 0], ['Left', Math.PI / 2], ['Back', Math.PI], ['Right', -Math.PI / 2]] as const // left = the boxer's left side
  return (
    <div className="absolute right-2 top-2 z-10 flex flex-col items-end gap-1" onPointerDown={e => e.stopPropagation()}>
      <button aria-label={open ? 'Hide camera controls' : 'Show camera controls'} aria-expanded={open} title="Camera controls" onClick={() => setOpen(!open)} className={btn}>{open ? <X size={15} /> : <Orbit size={15} />}</button>
      <div className={open ? 'flex flex-col items-end gap-1' : 'hidden'}>
        <div className="flex gap-1">{icons.map(([label, Icon, fn]) => <button key={label} aria-label={label} title={label} onClick={fn} className={btn}><Icon size={15} /></button>)}</div>
        <div className="flex gap-1">{views.map(([label, a]) => <button key={label} aria-label={`${label} view`} title={`${label} view`} onClick={go(() => { ctl.azTo = nearestAngle(ctl.az, a); ctl.elTo = EL0 })} className={chip}>{label}</button>)}</div>
      </div>
    </div>
  )
}
