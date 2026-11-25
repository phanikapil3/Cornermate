import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { Mic, Timer, Flame, Trophy, Smartphone, Target, ChevronDown } from 'lucide-react'
import Coach from '../components/Coach'
import { BRAND, PROGRAMS, MOVE_LABEL, type Move } from '../data'
import { useStore } from '../store'
const DEMO: Move[] = ['jab','cross','lhook','rhook','upper','guard','slipL','slipR','duck','roll']
const FIT = [...DEMO, 'step-jab']
const LOOP: Move[] = ['guard','jab','cross','lhook','guard','upper','slipL','cross']
const fade = { initial:{ opacity:0, y:30 }, whileInView:{ opacity:1, y:0 }, viewport:{ once:true }, transition:{ duration:.5 } }
const features = [[Mic,'Voice-called combos','Hear every combination, round by round.'],[Target,'Visual coach','An animated coach shows each punch and defense move.'],[Timer,'Round timers','Boxing-style work and rest rounds, with pause and skip.'],[Flame,'Streaks & XP','Daily habit tracking that rewards consistency.'],[Trophy,'Programs','Beginner to advanced, plus 7-day and 30-day plans.'],[Smartphone,'Mobile-first','Train in your room, no equipment needed.']] as const
const faqs = [['Do I need equipment?','No. Everything is shadow boxing, so you only need space to move.'],['Is it for beginners?','Yes. The Beginner program starts with stance and the jab.'],['Is the coach AI?','Not yet. The coach is a scripted animated demo; AI personalization is planned.'],['What does it cost?','Everything is free during testing. Paid plans are not live yet.']]
export default function Landing() {
  const [i, setI] = useState(0); const [pick, setPick] = useState<Move | null>(null); const tm = useRef<number>(0);
  const demo = (m: Move) => { setPick(m); window.clearTimeout(tm.current); tm.current = window.setTimeout(() => setPick(null), 1400) }; const [open, setOpen] = useState<number | null>(null); const { profile } = useStore()
  useEffect(() => { const t = setInterval(() => setI(x => (x + 1) % LOOP.length), 900); return () => clearInterval(t) }, [])
  const cta = profile ? '/dashboard' : '/onboarding'
  return (
    <div>
      <nav className="sticky top-0 z-10 bg-black/80 backdrop-blur border-b border-line"><div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        <span className="h text-2xl">{BRAND}<span className="text-ring">.</span></span>
        <div className="hidden md:flex gap-6 text-sm text-zinc-300"><a href="#features">Features</a><a href="#programs">Programs</a><a href="#pricing">Pricing</a><a href="#faq">FAQ</a></div>
        <div className="flex items-center gap-3">{!profile && <Link to="/auth" className="text-sm text-zinc-300">Log in</Link>}<Link to={cta} className="btn btn-red !py-2 text-sm">{profile ? 'DASHBOARD' : 'START'}</Link></div></div></nav>
      <section className="max-w-6xl mx-auto px-5 py-10 md:py-16 grid lg:grid-cols-2 gap-6 lg:gap-10 items-center">
        <motion.div initial={{ opacity:0, x:-30 }} animate={{ opacity:1, x:0 }} transition={{ duration:.6 }}>
          <h1 className="h text-6xl md:text-8xl leading-none">Your fight.<br /><span className="text-ring">Your journey.</span></h1>
          <p className="mt-5 text-lg text-zinc-300 max-w-md">Train boxing anywhere with your personal virtual boxing coach.</p>
          <Link to={cta} className="btn btn-red mt-8 text-lg">START TRAINING</Link>
        </motion.div>
        <div><div className="relative h-[28rem] sm:h-[34rem] md:h-[36rem] lg:h-[40rem] overflow-hidden rounded-3xl border border-line bg-[radial-gradient(circle_at_50%_40%,#2a0a0e,#0a0a0a_70%)]"><Coach move={pick ?? LOOP[i]} fit={FIT} /></div>
          <p className="mt-3 text-xs text-zinc-400">Pick a move and watch the coach throw it:</p>
          <div className="mt-2 flex flex-wrap gap-2">{DEMO.map(m => <button key={m} onClick={() => demo(m)} className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${pick === m ? 'border-ring bg-ring' : 'border-line hover:border-ring'}`}>{MOVE_LABEL[m]}</button>)}</div></div>
      </section>
      <section id="features" className="max-w-6xl mx-auto px-5 py-16"><h2 className="h text-4xl mb-8">Built for home training</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{features.map(([Icon, t, d], k) => <motion.div key={t} {...fade} transition={{ delay:k * .06 }} className="card hover:border-ring transition"><Icon className="text-ring mb-3" /><h3 className="font-bold">{t}</h3><p className="text-zinc-400 text-sm mt-1">{d}</p></motion.div>)}</div></section>
      <section className="max-w-6xl mx-auto px-5 py-16"><h2 className="h text-4xl mb-8">How it works</h2>
        <div className="grid md:grid-cols-3 gap-4">{['Tell us your level and goal','Get your daily workout','Train, earn XP, keep your streak'].map((t, k) => <motion.div key={t} {...fade} className="card"><div className="h text-5xl text-ring">0{k + 1}</div><p className="mt-2 font-semibold">{t}</p></motion.div>)}</div></section>
      <section id="programs" className="max-w-6xl mx-auto px-5 py-16"><h2 className="h text-4xl mb-8">Training programs</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{PROGRAMS.map(p => <motion.div key={p.id} {...fade} className="card"><p className="text-ring text-xs font-bold">{p.days} DAYS</p><h3 className="font-bold text-lg">{p.name}</h3><p className="text-zinc-400 text-sm mt-1">{p.desc}</p></motion.div>)}</div></section>
      <section className="max-w-6xl mx-auto px-5 py-16"><h2 className="h text-4xl mb-6">Testimonials</h2><div className="card text-zinc-400">Real user reviews will appear here after we launch to testers. (Placeholder, no fake reviews.)</div></section>
      <section id="pricing" className="max-w-6xl mx-auto px-5 py-16"><h2 className="h text-4xl mb-8">Pricing</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="card"><h3 className="h text-2xl">Free</h3><p className="text-3xl font-bold my-2">₹0</p><p className="text-zinc-400 text-sm">All programs while we test.</p><Link to={cta} className="btn btn-red mt-4 w-full">START FREE</Link></div>
          <div className="card opacity-80"><h3 className="h text-2xl">Premium</h3><p className="text-3xl font-bold my-2">₹49–₹99<span className="text-sm text-zinc-400">/mo</span></p><p className="text-zinc-400 text-sm">Price under validation. Payments are not live yet.</p><button disabled className="btn btn-ghost mt-4 w-full">COMING SOON</button></div></div></section>
      <section id="faq" className="max-w-3xl mx-auto px-5 py-16"><h2 className="h text-4xl mb-6">FAQ</h2>
        {faqs.map(([q, a], k) => <div key={q} className="border-b border-line"><button onClick={() => setOpen(open === k ? null : k)} className="w-full flex justify-between py-4 font-semibold text-left">{q}<ChevronDown className={`transition ${open === k ? 'rotate-180' : ''}`} /></button>{open === k && <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} className="pb-4 text-zinc-400">{a}</motion.p>}</div>)}</section>
      <footer className="border-t border-line py-8 text-center text-zinc-500 text-sm">© {new Date().getFullYear()} {BRAND}. Train safe, and see a doctor before starting if unsure.</footer>
    </div>
  )
}
