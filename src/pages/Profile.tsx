import AudioControls from '../components/AudioControls'
import { Link, useNavigate } from 'react-router-dom'
import { setState, resetAll, updateProfile, logout, useStore, type Profile as P } from '../store'
const OPT: Record<string, string[]> = { experience:['None','Some','Experienced'], fitness:['Low','Medium','High'], goal:['Learn boxing','Improve fitness','Improve stamina','Fat loss','Build confidence','Become a better boxer'], duration:['15 min','30 min','45 min'], days:['2','3','4','5+'], equipment:['None','Gloves','Heavy bag'] }
export default function Profile() {
  const { profile, sound, notifications, user } = useStore(); const nav = useNavigate(); const set = (k: keyof P, v: string) => updateProfile({ ...profile!, [k]: v })
  const field = 'w-full bg-ink border border-line rounded-lg px-3 py-2 mt-1'
  return (
    <div className="space-y-6 max-w-xl"><h1 className="h text-4xl">Profile</h1>
      <div className="card space-y-3">
        <label className="block text-sm">Name<input className={field} value={profile!.name} onChange={e => set('name', e.target.value)} /></label>
        <label className="block text-sm">Age<input type="number" className={field} value={profile!.age} onChange={e => set('age', e.target.value)} /></label>
        {Object.keys(OPT).map(k => <label key={k} className="block text-sm capitalize">{k}<select className={field} value={profile![k as keyof P]} onChange={e => set(k as keyof P, e.target.value)}>{OPT[k].map(o => <option key={o}>{o}</option>)}</select></label>)}</div>
      <div className="card space-y-3 text-sm">
        <AudioControls full />
        <label className="flex justify-between"><span>Reminders (saved preference only; sending is not built yet)</span><input type="checkbox" checked={notifications} onChange={e => setState({ notifications: e.target.checked })} /></label></div>
      <div className="card text-sm"><h3 className="font-bold">Subscription</h3><p className="text-zinc-400">Free plan. Paid plans and payments are not live yet.</p></div>
      <div className="card text-sm"><h3 className="font-bold">Account</h3><p className="text-zinc-400 mb-3">{user ? `Signed in as ${user.email}. Your progress is saved in the cloud.` : 'Not signed in: data is stored on this device only.'}</p>
        {user ? <button className="btn btn-ghost mr-2" onClick={async () => { await logout(); nav('/') }}>LOG OUT</button> : <Link to="/auth" className="btn btn-red mr-2">LOG IN / SIGN UP</Link>}
        <button className="btn btn-ghost" onClick={() => { if (confirm('Delete all your data on this device?')) { resetAll(); nav('/') } }}>RESET ALL DATA</button></div>
    </div>
  )
}
