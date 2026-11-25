import { useSyncExternalStore } from 'react'
import { supabase } from './supabase'
export type Profile = { name:string; age:string; experience:string; fitness:string; goal:string; duration:string; days:string; equipment:string }
export type Session = { date:string; title:string; minutes:number; rounds:number; xp:number; program:string; day:number }
export type User = { id: string; email: string } | null
export type Custom = { name: string; ids: string[] }
export type State = { user: User; custom: Custom[]; profile: Profile|null; sessions: Session[]; sound: boolean; notifications: boolean; voice: boolean; sfx: boolean; volume: number; voiceName: string }
const KEY = 'cornermate-v1'
const init: State = { user:null, custom:[], profile:null, sessions:[], sound:true, notifications:false, voice:true, sfx:true, volume:.8, voiceName:'' }
let state: State = (() => { try { return { ...init, ...JSON.parse(localStorage.getItem(KEY) || '{}'), user:null } } catch { return init } })()
const subs = new Set<() => void>()
export function setState(p: Partial<State>) { state = { ...state, ...p }; try { localStorage.setItem(KEY, JSON.stringify({ ...state, user: null })) } catch {} ; subs.forEach(f => f()) }
export const resetAll = () => setState({ ...init })
export const useStore = () => useSyncExternalStore(f => { subs.add(f); return () => subs.delete(f) }, () => state)
export const today = () => new Date().toLocaleDateString('en-CA')
const dayNum = (d: string) => Math.round(new Date(d + 'T00:00:00').getTime() / 864e5)
export const level = (xp: number) => Math.floor(xp / 200) + 1
export function stats(s: Session[]) {
  const xp = s.reduce((a, x) => a + x.xp, 0), minutes = s.reduce((a, x) => a + x.minutes, 0)
  const days = [...new Set(s.map(x => dayNum(x.date)))].sort((a, b) => a - b)
  let best = 0, run = 0
  days.forEach((d, i) => { run = i && d === days[i - 1] + 1 ? run + 1 : 1; best = Math.max(best, run) })
  const t = dayNum(today()); let streak = 0, c = days.includes(t) ? t : t - 1
  while (days.includes(c)) { streak++; c-- }
  const names = ['S','M','T','W','T','F','S']
  const week = Array.from({ length: 7 }, (_, i) => { const d = t - 6 + i; const date = new Date(d * 864e5 + 12 * 36e5)
    return { label: names[new Date(d * 864e5 + 12 * 36e5).getDay()], minutes: s.filter(x => dayNum(x.date) === d).reduce((a, x) => a + x.minutes, 0) } })
  return { xp, minutes, workouts: s.length, streak, best, week, level: level(xp), toNext: 200 - (xp % 200), longest: Math.max(0, ...s.map(x => x.minutes)), mostRounds: Math.max(0, ...s.map(x => x.rounds)) }
}
export const getSessions = () => state.sessions

async function pushProfile() { if (supabase && state.user && state.profile) await supabase.from('profiles').upsert({ id: state.user.id, data: state.profile, updated_at: new Date().toISOString() }) }
export function updateProfile(p: Profile) { setState({ profile: p }); void pushProfile() }
export function addSession(x: Session) { setState({ sessions: [...state.sessions, x] }); if (supabase && state.user) void supabase.from('sessions').insert({ user_id: state.user.id, ...x }) }
const inflight = new Map<string, Promise<void>>()
export function loadRemote(u: { id: string; email: string }): Promise<void> {
  if (!supabase) return Promise.resolve()
  const sb = supabase, ex = inflight.get(u.id); if (ex) return ex
  const run = (async () => {
    setState({ user: u })
    const { data: p } = await sb.from('profiles').select('data').eq('id', u.id).maybeSingle()
    if (p?.data) {
      const { data: rows } = await sb.from('sessions').select('*').eq('user_id', u.id).order('created_at')
      setState({ profile: p.data as Profile, sessions: (rows ?? []).map(r => ({ date: r.date, title: r.title, minutes: r.minutes, rounds: r.rounds, xp: r.xp, program: r.program, day: r.day })) })
    } else if (state.profile) { // first login: upload what this device already has
      await pushProfile()
      if (state.sessions.length) await sb.from('sessions').insert(state.sessions.map(x => ({ user_id: u.id, ...x })))
    }
  })().finally(() => inflight.delete(u.id))
  inflight.set(u.id, run); return run
}
export async function logout() { if (supabase) await supabase.auth.signOut(); setState({ ...init }) }

export const saveCombo = (name: string, ids: string[]) => setState({ custom: [...state.custom, { name, ids }] })
export const deleteCombo = (i: number) => setState({ custom: state.custom.filter((_, j) => j !== i) })
export const getState = () => state
