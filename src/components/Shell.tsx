import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, Dumbbell, BookOpen, BarChart3, User } from 'lucide-react'
import { useStore } from '../store'
import { BRAND } from '../data'
const links = [{ to:'/dashboard', label:'Home', Icon:Home },{ to:'/programs', label:'Programs', Icon:Dumbbell },{ to:'/library', label:'Library', Icon:BookOpen },{ to:'/progress', label:'Progress', Icon:BarChart3 },{ to:'/profile', label:'Profile', Icon:User }]
export default function Shell() {
  const { profile } = useStore(); const loc = useLocation()
  if (!profile) return <Navigate to="/onboarding" replace />
  const cls = ({ isActive }: { isActive: boolean }) => `flex flex-col md:flex-row items-center gap-1 md:gap-2 px-3 py-2 rounded-lg text-xs md:text-sm font-semibold ${isActive ? 'text-ring' : 'text-zinc-400 hover:text-white'}`
  return (
    <div className="min-h-screen pb-24 md:pb-8">
      <header className="hidden md:flex items-center justify-between max-w-5xl mx-auto px-6 py-5">
        <span className="h text-2xl">{BRAND}<span className="text-ring">.</span></span>
        <nav className="flex gap-2">{links.map(l => <NavLink key={l.to} to={l.to} className={cls}><l.Icon size={18} />{l.label}</NavLink>)}</nav>
      </header>
      <motion.main key={loc.pathname} initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ duration:.35 }} className="max-w-5xl mx-auto px-5 pt-6 md:pt-2">
        <Outlet />
      </motion.main>
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-black/90 backdrop-blur border-t border-line flex justify-around py-2">
        {links.map(l => <NavLink key={l.to} to={l.to} className={cls}><l.Icon size={22} />{l.label}</NavLink>)}
      </nav>
    </div>
  )
}
