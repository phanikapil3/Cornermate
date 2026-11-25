import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { loadRemote } from '../store'
import { BRAND } from '../data'
export default function Auth() {
  const [mode, setMode] = useState<'in' | 'up'>('up'); const [email, setEmail] = useState(''); const [pw, setPw] = useState('')
  const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false); const nav = useNavigate()
  const field = 'w-full bg-card border border-line rounded-xl px-4 py-3 outline-none focus:border-ring'
  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (!supabase) return; setBusy(true); setMsg('')
    const { data, error } = mode === 'up' ? await supabase.auth.signUp({ email, password: pw }) : await supabase.auth.signInWithPassword({ email, password: pw })
    if (error) setMsg(error.message)
    else if (!data.session) setMsg('Check your email to confirm your account, then log in.')
    else { await loadRemote({ id: data.session.user.id, email }); nav('/dashboard') }
    setBusy(false)
  }
  return (
    <div className="min-h-screen max-w-md mx-auto px-5 py-10">
      <Link to="/" className="h text-2xl">{BRAND}<span className="text-ring">.</span></Link>
      <h1 className="h text-4xl mt-10 mb-6">{mode === 'up' ? 'Create account' : 'Welcome back'}</h1>
      {!supabase ? <div className="card text-sm text-zinc-300">Cloud accounts are not configured yet. Copy <code>.env.example</code> to <code>.env</code>, add your Supabase URL and key (see README), and restart. Until then the app works locally on this device. <Link to="/onboarding" className="text-ring block mt-3">Continue without account →</Link></div> :
        <form onSubmit={submit} className="space-y-3">
          <input className={field} type="email" required placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
          <input className={field} type="password" required minLength={6} placeholder="Password (6+ characters)" value={pw} onChange={e => setPw(e.target.value)} />
          {msg && <p className="text-sm text-ring">{msg}</p>}
          <button disabled={busy} className="btn btn-red w-full">{busy ? 'PLEASE WAIT…' : mode === 'up' ? 'SIGN UP' : 'LOG IN'}</button>
          <button type="button" className="text-sm text-zinc-400 w-full" onClick={() => setMode(mode === 'up' ? 'in' : 'up')}>{mode === 'up' ? 'Have an account? Log in' : 'New here? Sign up'}</button>
        </form>}
    </div>
  )
}
