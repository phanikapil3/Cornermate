import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Flame, Zap, Clock, Play } from 'lucide-react'
import { useStore, stats } from '../store'
import { supabase } from '../supabase'
import { getProgram, getWorkout } from '../data'
export default function Dashboard() {
  const { profile, sessions, user } = useStore(); const s = stats(sessions)
  const pid = profile!.experience === 'None' ? 'beginner' : profile!.experience === 'Some' ? 'intermediate' : 'advanced'
  const p = getProgram(pid); const day = Math.min(p.days, sessions.filter(x => x.program === pid).length + 1); const w = getWorkout(p, day)
  const hr = new Date().getHours(); const hi = hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening'
  const tiles = [[Flame, 'Streak', `${s.streak} days`], [Zap, 'XP', s.xp], [Clock, 'Minutes', s.minutes]] as const
  return (
    <div className="space-y-6">
      <h1 className="h text-4xl">{hi}, {profile!.name}</h1>
      {supabase && !user && <Link to="/auth" className="card block text-sm hover:border-ring">Sign up to save your progress in the cloud and use it on any device →</Link>}
      <div className="card border-ring/50"><p className="text-ring text-xs font-bold">TODAY'S WORKOUT</p><h2 className="h text-3xl">{w.title}</h2>
        <p className="text-zinc-400 text-sm mt-1">{w.rounds} rounds · {w.work}s work · {w.rest}s rest · ~{w.minutes} min</p>
        <Link to={`/train?p=${pid}&d=${day}`} className="btn btn-red mt-4"><Play size={18} />START WORKOUT</Link></div>
      <div className="grid grid-cols-3 gap-3">{tiles.map(([I, l, v]) => <div key={l} className="card text-center"><I className="mx-auto text-ring" /><p className="text-2xl font-bold mt-1">{v}</p><p className="text-xs text-zinc-400">{l}</p></div>)}</div>
      <div className="card"><div className="flex justify-between text-sm"><span className="font-bold">Level {s.level}</span><span className="text-zinc-400">{s.toNext} XP to next</span></div>
        <div className="h-2 bg-line rounded mt-2"><motion.div className="h-full bg-ring rounded" initial={{ width: 0 }} animate={{ width: `${((200 - s.toNext) / 200) * 100}%` }} /></div></div>
      <div className="card"><h3 className="font-bold mb-3">This week</h3><div className="flex items-end gap-2 h-24">{s.week.map((d, i) => <div key={i} className="flex-1 text-center"><motion.div className="bg-ring rounded-t min-h-1" initial={{ height: 0 }} animate={{ height: Math.min(80, d.minutes * 4) }} /><span className="text-xs text-zinc-400">{d.label}</span></div>)}</div></div>
      <div><h3 className="font-bold mb-3">Recent workouts</h3>{sessions.length === 0 ? <p className="text-zinc-400 text-sm">No workouts yet. Start your first one above.</p> :
        <div className="space-y-2">{[...sessions].reverse().slice(0, 5).map((x, i) => <div key={i} className="card !py-3 flex justify-between text-sm"><span>{x.title}<br /><span className="text-zinc-500">{x.date}</span></span><span className="text-right">{x.minutes} min<br /><span className="text-ring">+{x.xp} XP</span></span></div>)}</div>}</div>
    </div>
  )
}
