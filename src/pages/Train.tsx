import { useEffect, useMemo, useReducer, useRef } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Pause, Play, SkipForward, Flag } from 'lucide-react'
import AudioControls from '../components/AudioControls'
import { audio } from '../audio/coachAudio'
import Coach from '../components/Coach'
import { buildSeq, getProgram, getWorkout } from '../data'
import { moveName } from '../library/movements'
import { setState, today, useStore, addSession } from '../store'
type Ph = 'idle' | 'ready' | 'work' | 'rest' | 'done'
type S = { ph: Ph; round: number; t: number; el: number; total: number; paused: boolean }
type W = ReturnType<typeof getWorkout>
const step = (s: S, w: W): S => {
  const t = s.t - 1
  if (s.ph === 'ready') return t > 0 ? { ...s, t } : { ...s, ph: 'work', t: w.work, el: 0 }
  if (s.ph === 'work') { const n = { ...s, el: s.el + 1, total: s.total + 1, t }; return t > 0 ? n : s.round >= w.rounds ? { ...n, ph: 'done', t: 0 } : { ...n, ph: 'rest', t: w.rest } }
  if (s.ph === 'rest') { const n = { ...s, total: s.total + 1, t }; return t > 0 ? n : { ...n, ph: 'work', round: s.round + 1, t: w.work, el: 0 } }
  return s
}
type A = { type: 'start' | 'tick' | 'skip' | 'pause' }
const mmss = (n: number) => `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`
export default function Train() {
  const [q] = useSearchParams(); const nav = useNavigate(); const { profile, sound, custom } = useStore()
  const prog = getProgram(q.get('p') || 'beginner'); const day = Math.min(prog.days, Math.max(1, Number(q.get('d')) || 1)); const w = useMemo(() => getWorkout(prog, day), [prog, day])
  const [s, d] = useReducer((s: S, a: A): S => a.type === 'start' ? { ...s, ph: 'ready', t: 3 } : a.type === 'pause' ? { ...s, paused: !s.paused } : a.type === 'skip' ? step({ ...s, t: 1 }, w) : step(s, w), { ph: 'idle', round: 1, t: 3, el: 0, total: 0, paused: false })
  const saved = useRef(false); const seq = useMemo(() => buildSeq([...w.pool, ...custom.map(c => ({ name: c.name, moves: c.ids, level: 1 as const }))], s.round), [w, s.round, custom]); const cur = s.ph === 'work' ? seq[s.el % seq.length] : null
  useEffect(() => { if (s.ph === 'idle' || s.ph === 'done' || s.paused) return; const id = setInterval(() => d({ type: 'tick' }), 1000); return () => clearInterval(id) }, [s.ph, s.paused])
  // audio: phase cues, then every movement is spoken at the same tick that starts its 3D animation
  useEffect(() => { if (s.ph !== 'idle') audio.cue(s.ph) }, [s.ph, s.round])
  useEffect(() => { if (s.ph === 'work' && cur && !cur.filler) audio.call(cur.move) }, [s.el, s.ph, s.round])
  useEffect(() => { if (s.paused) audio.stop() }, [s.paused])
  useEffect(() => () => audio.stop(), [])
  const finish = () => { if (saved.current) return; saved.current = true; const rounds = s.ph === 'done' ? w.rounds : s.ph === 'work' ? s.round - 1 : s.round
    if (s.total >= 20) { const minutes = Math.max(1, Math.round(s.total / 60)); addSession({ date: today(), title: w.title, minutes, rounds, xp: minutes * 10 + rounds * 20 + (s.ph === 'done' ? 50 : 0), program: prog.id, day }) } }
  useEffect(() => { if (s.ph === 'done') finish() }, [s.ph])
  if (!profile) return <Navigate to="/onboarding" replace />
  const fitIds = useMemo(() => [...new Set([...w.pool, ...custom.map(c => ({ moves: c.ids }))].flatMap(c => c.moves))], [w, custom]) // camera frames every movement this workout can call
  const label = s.ph === 'work' ? moveName(cur!.move) : s.ph === 'rest' ? 'REST' : s.ph === 'ready' ? 'GET READY' : s.ph === 'done' ? 'DONE!' : w.title
  return (
    <div className="min-h-[100dvh] max-w-5xl mx-auto px-4 sm:px-5 py-4 flex flex-col">
      <div className="flex justify-between items-center text-sm"><Link to="/dashboard" className="text-zinc-400">← Exit</Link><span className="font-bold">{w.title}</span>
        <span className="w-12" /></div>
      <div className="h-1.5 bg-line rounded mt-3"><div className="h-full bg-ring rounded transition-all" style={{ width: `${Math.min(100, (s.total / (w.rounds * w.work + (w.rounds - 1) * w.rest)) * 100)}%` }} /></div>
      <div className="mt-3"><AudioControls /></div>
      <div className="relative mt-2 flex-1 min-h-[26rem] md:min-h-[32rem] overflow-hidden rounded-3xl border border-line bg-[radial-gradient(circle_at_50%_45%,#2a0a0e,#0a0a0a_72%)]"><Coach move={cur?.move ?? 'guard'} tick={s.el} fit={fitIds} /></div>
      <div className="text-center"><p className="text-zinc-400 text-sm">{s.ph === 'work' ? cur!.combo : s.ph === 'idle' ? `${w.rounds} rounds · ${w.work}s work · ${w.rest}s rest` : `Round ${Math.min(s.round, w.rounds)} / ${w.rounds}`}</p>
        <h1 className="h text-4xl sm:text-5xl md:text-6xl text-ring">{label}</h1>
        {s.ph !== 'idle' && s.ph !== 'done' && <p className="h text-6xl mt-2">{s.ph === 'ready' ? s.t : mmss(s.t)}</p>}</div>
      <div className="flex justify-center gap-3 py-6">
        {s.ph === 'idle' && <button className="btn btn-red text-lg" onClick={() => { audio.unlock(); d({ type: 'start' }) }}><Play size={20} />BEGIN</button>}
        {s.ph === 'done' && <><div className="text-center w-full"><p className="mb-4 text-zinc-300">{Math.max(1, Math.round(s.total / 60))} min · {w.rounds} rounds · XP earned!</p><button className="btn btn-red" onClick={() => nav('/dashboard')}>BACK TO DASHBOARD</button></div></>}
        {(s.ph === 'ready' || s.ph === 'work' || s.ph === 'rest') && <>
          <button className="btn btn-ghost" onClick={() => d({ type: 'pause' })}>{s.paused ? <><Play size={18} />RESUME</> : <><Pause size={18} />PAUSE</>}</button>
          <button className="btn btn-ghost" onClick={() => d({ type: 'skip' })}><SkipForward size={18} />SKIP</button>
          <button className="btn btn-red" onClick={() => { finish(); nav('/dashboard') }}><Flag size={18} />FINISH</button></>}
      </div>
    </div>
  )
}
