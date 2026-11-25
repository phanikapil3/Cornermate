import { useEffect, useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { setState, useStore } from '../store'
import { audio, englishVoices, onVoicesChanged } from '../audio/coachAudio'
const chip = (on: boolean) => `rounded-lg border px-3 py-1.5 text-xs font-bold transition ${on ? 'border-ring bg-ring' : 'border-line hover:border-ring'}`
export default function AudioControls({ full }: { full?: boolean }) {
  const { sound, voice, sfx, volume, voiceName } = useStore(); const [, bump] = useState(0)
  useEffect(() => onVoicesChanged(() => bump(n => n + 1)), [])
  const voices = full ? englishVoices() : []
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button aria-label={sound ? 'Mute all sound' : 'Unmute all sound'} className={chip(sound)} onClick={() => setState({ sound: !sound })}>{sound ? <Volume2 size={14} /> : <VolumeX size={14} />}</button>
        <button className={chip(sound && voice)} onClick={() => setState({ voice: !voice })}>VOICE</button>
        <button className={chip(sound && sfx)} onClick={() => setState({ sfx: !sfx })}>EFFECTS</button>
        <input type="range" min={0} max={1} step={.05} value={volume} aria-label="Volume" onChange={e => setState({ volume: Number(e.target.value) })} className="min-w-24 flex-1 accent-[#e11d2e]" />
      </div>
      {full && <div className="space-y-2 text-sm">
        {voices.length > 0 && <label className="block">Coach voice<select className="mt-1 w-full rounded-lg border border-line bg-ink px-3 py-2" value={voiceName} onChange={e => setState({ voiceName: e.target.value })}><option value="">Automatic (best available)</option>{voices.map(v => <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>)}</select></label>}
        <button className="btn btn-ghost !px-3 !py-2 text-xs" onClick={() => { audio.unlock(); audio.playSequence(['jab', 'cross', 'lead-hook', 'slip-right', 'rear-uppercut']) }}>TEST VOICE &amp; EFFECTS</button>
        <p className="text-xs text-zinc-500">Voice quality depends on your device. Chrome and Edge usually have the clearest voices.</p></div>}
    </div>
  )
}
