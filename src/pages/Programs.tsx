import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { PROGRAMS, getWorkout } from '../data'
import { useStore } from '../store'
const lv = ['', 'Beginner', 'Intermediate', 'Advanced']
export default function Programs() {
  const { sessions } = useStore()
  return (
    <div className="space-y-6"><h1 className="h text-4xl">Programs</h1>
      {PROGRAMS.map(p => { const w = getWorkout(p, 1); return (
        <div key={p.id} className="card"><div className="flex justify-between"><h2 className="h text-2xl">{p.name}</h2><span className="text-ring text-xs font-bold">{lv[p.level].toUpperCase()}</span></div>
          <p className="text-zinc-400 text-sm">{p.desc} · {p.days} days · ~{w.minutes}+ min/session</p>
          <ul className="text-sm mt-2 list-disc pl-5 text-zinc-300">{p.goals.map(g => <li key={g}>{g}</li>)}</ul>
          <div className="flex flex-wrap gap-2 mt-4">{Array.from({ length: p.days }, (_, i) => i + 1).map(d => { const done = sessions.some(x => x.program === p.id && x.day === d)
            return <Link key={d} to={`/train?p=${p.id}&d=${d}`} className={`w-10 h-10 rounded-lg grid place-items-center text-sm font-bold border ${done ? 'bg-ring border-ring' : 'border-line hover:border-ring'}`}>{done ? <Check size={16} /> : d}</Link> })}</div></div>) })}
    </div>
  )
}
