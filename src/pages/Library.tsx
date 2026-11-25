import { useEffect, useMemo, useState } from 'react'
import { Play, Plus, X, ChevronLeft, ChevronRight, Repeat, Save, Trash2, Search } from 'lucide-react'
import Coach from '../components/Coach'
import AudioControls from '../components/AudioControls'
import { audio } from '../audio/coachAudio'
import { MOVEMENTS, PRESETS, CATEGORIES, getMovement, type Category } from '../library/movements'
import type { PlayRequest, Stance } from '../library/player'
import { useStore, saveCombo, deleteCombo } from '../store'
const dots = (n: number) => '●'.repeat(n) + '○'.repeat(3 - n)
const chip = (on: boolean) => `rounded-lg border px-3 py-1.5 text-xs font-bold transition ${on ? 'border-ring bg-ring' : 'border-line hover:border-ring'}`
export default function Library() {
  const { custom } = useStore()
  const [q, setQ] = useState(''); const [cat, setCat] = useState<Category | 'all' | 'combos'>('all')
  const [sel, setSel] = useState<string | null>(null); const [ids, setIds] = useState<string[]>(['guard']); const [nonce, setNonce] = useState(0)
  const [speed, setSpeed] = useState(1); const [loop, setLoop] = useState(false); const [stance, setStance] = useState<Stance>('orthodox')
  const [seq, setSeq] = useState<string[]>([]); const [name, setName] = useState('')
  const play = (list: string[]) => { audio.unlock(); if (list.length) { setIds(list); setNonce(n => n + 1) } }
  // voice + sound effects follow the same timeline as the animation (nonce 0 = nothing played yet)
  useEffect(() => { if (nonce > 0) audio.playSequence(ids, { speed, loop }); return () => audio.stop() }, [ids, nonce, speed, loop])
  const req: PlayRequest = { ids, speed, loop, stance, nonce }; const m = sel ? getMovement(sel) : null
  const add = (id: string) => setSeq(s => [...s, id].slice(0, 16))
  const mv = (i: number, d: number) => setSeq(s => { const a = [...s]; [a[i], a[i + d]] = [a[i + d], a[i]]; return a })
  const groups = useMemo(() => { const out = new Map<string, typeof MOVEMENTS>(); const t = q.trim().toLowerCase()
    for (const x of MOVEMENTS) { if (cat !== 'all' && x.category !== cat) continue; if (t && !`${x.name} ${x.sub} ${x.desc}`.toLowerCase().includes(t)) continue
      const k = `${CATEGORIES[x.category]} · ${x.sub}`; out.set(k, [...(out.get(k) ?? []), x]) }
    return [...out] }, [q, cat])
  const presets = PRESETS.filter(p => (cat === 'all' || cat === 'combos') && p.name.toLowerCase().includes(q.trim().toLowerCase()))
  return (
    <div className="space-y-4">
      <h1 className="h text-4xl">Movement Library</h1>
      <div className="sticky top-0 z-20 -mx-5 bg-ink/95 px-5 pb-3 pt-2 backdrop-blur">
        <div className="relative h-[46vh] min-h-72 md:h-[32rem] overflow-hidden rounded-2xl border border-line bg-[radial-gradient(circle_at_50%_40%,#2a0a0e,#0a0a0a_70%)]"><Coach play={req} inspect /></div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button className="btn btn-red !px-3 !py-2 text-xs" onClick={() => play(ids)}><Play size={14} />REPLAY</button>
          {[1, .5, .25].map(v => <button key={v} className={chip(speed === v)} onClick={() => setSpeed(v)}>{v === 1 ? '1×' : v === .5 ? '0.5×' : 'SLOW 0.25×'}</button>)}
          <button className={chip(loop)} onClick={() => setLoop(!loop)}><Repeat size={12} className="mr-1 inline" />REPEAT</button>
          <button className={chip(stance === 'southpaw')} onClick={() => setStance(stance === 'southpaw' ? 'orthodox' : 'southpaw')}>{stance === 'southpaw' ? 'SOUTHPAW' : 'ORTHODOX'}</button>
        </div>
        <p className="mt-1 truncate text-xs text-zinc-400">Playing: {ids.map(i => getMovement(i)?.name ?? i).join(' → ')}</p>
      </div>
      <div className="card"><AudioControls /></div>
      {m && <div className="card text-sm"><p className="font-bold">{m.name} <span className="text-ring">{dots(m.difficulty)}</span></p><p className="text-zinc-400">{m.desc}</p>
        <p className="mt-1 text-xs text-zinc-500">{CATEGORIES[m.category]} · {m.sub} · {m.duration}s{m.recovery ? ` + ${m.recovery}s recovery` : ''}</p>{m.limitation && <p className="mt-1 text-xs text-yellow-500">Limitation: {m.limitation}</p>}</div>}
      <div className="card space-y-3"><p className="text-sm font-bold">Combo builder ({seq.length}/16)</p>
        {seq.length === 0 ? <p className="text-sm text-zinc-400">Tap + on any movement below, or load a preset, to build a combination.</p> :
          <div className="flex flex-wrap gap-2">{seq.map((id, i) => <div key={i} className="flex items-center gap-1 rounded-lg border border-line px-2 py-1 text-xs"><button aria-label="Move earlier" disabled={i === 0} onClick={() => mv(i, -1)}><ChevronLeft size={14} /></button><span className="font-bold">{getMovement(id)?.name}</span><button aria-label="Move later" disabled={i === seq.length - 1} onClick={() => mv(i, 1)}><ChevronRight size={14} /></button><button aria-label="Remove" onClick={() => setSeq(seq.filter((_, j) => j !== i))}><X size={14} /></button></div>)}</div>}
        <div className="flex flex-wrap gap-2"><button className="btn btn-red !px-3 !py-2 text-xs" disabled={!seq.length} onClick={() => play(seq)}><Play size={14} />PLAY COMBO</button><button className="btn btn-ghost !px-3 !py-2 text-xs" disabled={!seq.length} onClick={() => setSeq([])}>CLEAR</button></div>
        <div className="flex gap-2"><input value={name} onChange={e => setName(e.target.value)} placeholder="Name your combo" className="min-w-0 flex-1 rounded-lg border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-ring" />
          <button className="btn btn-ghost !px-3 !py-2 text-xs" disabled={seq.length < 2} onClick={() => { saveCombo(name.trim() || 'My combo', seq); setName('') }}><Save size={14} />SAVE</button></div>
        {custom.length > 0 && <div className="space-y-2"><p className="text-xs text-zinc-400">Saved combos (also used in your workouts):</p>{custom.map((c, i) => <div key={i} className="flex items-center gap-2 text-sm"><button className="flex-1 truncate text-left hover:text-ring" onClick={() => { setSeq(c.ids); play(c.ids) }}>{c.name}</button><button aria-label="Delete combo" onClick={() => deleteCombo(i)}><Trash2 size={16} /></button></div>)}</div>}
      </div>
      <div className="relative"><Search size={16} className="absolute left-3 top-3 text-zinc-500" /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search movements…" className="w-full rounded-xl border border-line bg-card py-2.5 pl-9 pr-3 text-sm outline-none focus:border-ring" /></div>
      <div className="flex flex-wrap gap-2">{(['all', 'punches', 'defense', 'footwork', 'stance', 'combos'] as const).map(c => <button key={c} className={chip(cat === c)} onClick={() => setCat(c)}>{c === 'all' ? 'ALL' : c === 'combos' ? 'COMBINATIONS' : CATEGORIES[c].toUpperCase()}</button>)}</div>
      {cat !== 'combos' && groups.map(([g, list]) => <section key={g}><h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-500">{g}</h2><div className="space-y-2">{list.map(x =>
        <div key={x.id} className={`card flex items-center gap-3 !p-3 ${sel === x.id ? 'border-ring' : ''}`}>
          <button className="flex-1 text-left" onClick={() => { setSel(x.id); play([x.id]) }}><p className="font-bold">{x.name} <span className="text-xs text-ring">{dots(x.difficulty)}</span></p><p className="text-xs text-zinc-400">{x.desc}</p></button>
          <button aria-label={`Add ${x.name} to combo`} className="btn btn-ghost !p-2" onClick={() => add(x.id)}><Plus size={16} /></button></div>)}</div></section>)}
      {presets.length > 0 && <section><h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-500">Combinations · presets</h2><div className="space-y-2">{presets.map(p =>
        <div key={p.name} className="card flex items-center gap-3 !p-3"><button className="flex-1 text-left" onClick={() => { setSeq(p.ids); play(p.ids) }}><p className="font-bold">{p.name} <span className="text-xs text-ring">{dots(p.level)}</span></p><p className="text-xs text-zinc-500">{p.sub} · tap to load and play</p></button></div>)}</div></section>}
      {!groups.length && !presets.length && <p className="text-sm text-zinc-400">No movements match.</p>}
    </div>
  )
}
