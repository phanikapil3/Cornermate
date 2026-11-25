import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { updateProfile, type Profile } from '../store'
type Q = { key: keyof Profile; q: string; type: 'text' | 'number' | 'opt'; opts?: string[] }
const QS: Q[] = [
  { key:'name', q:"What's your name?", type:'text' }, { key:'age', q:'How old are you?', type:'number' },
  { key:'experience', q:'Boxing experience?', type:'opt', opts:['None','Some','Experienced'] },
  { key:'fitness', q:'Your fitness level?', type:'opt', opts:['Low','Medium','High'] },
  { key:'goal', q:'Your main goal?', type:'opt', opts:['Learn boxing','Improve fitness','Improve stamina','Fat loss','Build confidence','Become a better boxer'] },
  { key:'duration', q:'Workout length?', type:'opt', opts:['15 min','30 min','45 min'] },
  { key:'days', q:'Training days per week?', type:'opt', opts:['2','3','4','5+'] },
  { key:'equipment', q:'Equipment you have?', type:'opt', opts:['None','Gloves','Heavy bag'] },
]
export default function Onboarding() {
  const [s, setS] = useState(0); const [a, setA] = useState<Partial<Profile>>({}); const nav = useNavigate(); const q = QS[s]; const v = a[q.key] ?? ''
  const next = (val: string = v) => { const n = { ...a, [q.key]: val }; setA(n); if (s === QS.length - 1) { updateProfile(n as Profile); nav('/dashboard') } else setS(s + 1) }
  return (
    <div className="min-h-screen max-w-xl mx-auto px-5 py-8 flex flex-col">
      <div className="h-1.5 bg-line rounded"><motion.div className="h-full bg-ring rounded" animate={{ width:`${((s + 1) / QS.length) * 100}%` }} /></div>
      <AnimatePresence mode="wait"><motion.div key={s} initial={{ opacity:0, x:40 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-40 }} className="flex-1 pt-16">
        <p className="text-ring text-sm font-bold">{s + 1} / {QS.length}</p><h1 className="h text-4xl mb-8">{q.q}</h1>
        {q.type === 'opt' ? <div className="grid gap-3">{q.opts!.map(o => <button key={o} onClick={() => next(o)} className={`card text-left font-semibold hover:border-ring ${v === o ? 'border-ring' : ''}`}>{o}</button>)}</div>
          : <><input autoFocus type={q.type} min={10} max={99} value={v} onChange={e => setA({ ...a, [q.key]: e.target.value })} onKeyDown={e => e.key === 'Enter' && v && next()} className="w-full bg-card border border-line rounded-xl px-4 py-4 text-xl outline-none focus:border-ring" />
            <button disabled={!String(v).trim()} onClick={() => next()} className="btn btn-red mt-6 w-full">CONTINUE</button></>}
      </motion.div></AnimatePresence>
      {s > 0 && <button onClick={() => setS(s - 1)} className="text-zinc-400 text-sm py-4">← Back</button>}
    </div>
  )
}
