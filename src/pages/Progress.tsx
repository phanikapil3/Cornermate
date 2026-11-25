import { motion } from 'framer-motion'
import { Award } from 'lucide-react'
import { useStore, stats } from '../store'
export default function Progress() {
  const { sessions } = useStore(); const s = stats(sessions); const max = Math.max(10, ...s.week.map(d => d.minutes))
  const ach: [string, boolean][] = [['First workout', s.workouts >= 1], ['5 workouts', s.workouts >= 5], ['3-day streak', s.best >= 3], ['7-day streak', s.best >= 7], ['Level 3', s.level >= 3], ['60 minutes trained', s.minutes >= 60]]
  const grid = [['Workouts', s.workouts], ['Minutes', s.minutes], ['Streak', s.streak], ['XP', s.xp], ['Level', s.level]]
  return (
    <div className="space-y-6"><h1 className="h text-4xl">Progress</h1>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">{grid.map(([l, v]) => <div key={l} className="card text-center"><p className="text-3xl font-bold">{v}</p><p className="text-xs text-zinc-400">{l}</p></div>)}</div>
      <div className="card"><h3 className="font-bold mb-3">Weekly activity (minutes)</h3><div className="flex items-end gap-3 h-40">{s.week.map((d, i) => <div key={i} className="flex-1 text-center"><p className="text-xs">{d.minutes}</p><motion.div className="bg-ring rounded-t min-h-1" initial={{ height: 0 }} animate={{ height: (d.minutes / max) * 110 }} /><span className="text-xs text-zinc-400">{d.label}</span></div>)}</div></div>
      <div className="card"><h3 className="font-bold mb-2">Personal records</h3><p className="text-sm text-zinc-300">Longest session: {s.longest} min · Most rounds: {s.mostRounds} · Best streak: {s.best} days</p></div>
      <div><h3 className="font-bold mb-3">Achievements</h3><div className="grid grid-cols-2 md:grid-cols-3 gap-3">{ach.map(([n, ok]) => <div key={n} className={`card flex items-center gap-3 ${ok ? 'border-ring' : 'opacity-40'}`}><Award className={ok ? 'text-ring' : ''} />{n}</div>)}</div></div>
    </div>
  )
}
