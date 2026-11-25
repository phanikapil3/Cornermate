export const BRAND = 'CornerMate' // change your brand name here
export type Move = 'jab'|'cross'|'lhook'|'rhook'|'upper'|'guard'|'slipL'|'slipR'|'duck'|'roll'|'step'
export const MOVE_LABEL: Record<Move,string> = { jab:'JAB',cross:'CROSS',lhook:'LEFT HOOK',rhook:'RIGHT HOOK',upper:'UPPERCUT',guard:'GUARD UP',slipL:'SLIP LEFT',slipR:'SLIP RIGHT',duck:'DUCK',roll:'ROLL',step:'MOVE YOUR FEET' }
export type Combo = { name: string; moves: string[]; level: 1|2|3 } // moves = library movement ids
export const COMBOS: Combo[] = [
 { name:'Jab', moves:['jab'], level:1 },
 { name:'Jab, Cross', moves:['jab','cross'], level:1 },
 { name:'Slip, Cross', moves:['slipL','cross'], level:1 },
 { name:'Jab, Cross, Left Hook', moves:['jab','cross','lhook'], level:2 },
 { name:'Jab, Duck, Cross', moves:['jab','duck','cross'], level:2 },
 { name:'Jab, Cross, Left Hook, Right Uppercut', moves:['jab','cross','lhook','upper'], level:2 },
 { name:'Slip, Roll, Hook', moves:['slipR','roll','lhook'], level:3 },
 { name:'Jab, Cross, Hook, Cross, Step', moves:['jab','cross','lhook','cross','step'], level:3 },
 { name:'Double Jab, Cross, Rear Hook', moves:['jab','jab','cross','rhook'], level:3 },
 { name:'Parry, Cross, Lead Hook', moves:['parry-lead','cross','lead-hook'], level:2 },
 { name:'Jab, Body Jab, Cross', moves:['jab','body-jab','cross'], level:2 },
 { name:'Jab, Body Hook, Head Hook', moves:['jab','body-hook','lead-hook'], level:2 },
 { name:'Jab, Cross, Roll, Hook', moves:['jab','cross','roll-right','lead-hook'], level:3 },
 { name:'Jab, Cross, Pivot, Cross', moves:['jab','cross','pivot-left','cross'], level:3 },
 { name:'Step Jab, Cross, Overhand', moves:['step-jab','cross','overhand'], level:3 },
]
export type Program = { id:string; name:string; level:1|2|3; days:number; desc:string; goals:string[] }
export const PROGRAMS: Program[] = [
 { id:'beginner', name:'Beginner Foundations', level:1, days:7, desc:'Stance, jab, cross and basic defense.', goals:['Learn stance & footwork','Throw clean jab and cross','Build a training habit'] },
 { id:'intermediate', name:'Intermediate Combos', level:2, days:7, desc:'Hooks, uppercuts and flowing combinations.', goals:['Chain 3–4 punch combos','Add head movement','Build stamina'] },
 { id:'advanced', name:'Advanced Fighter', level:3, days:7, desc:'Long rounds, defense-to-offense counters.', goals:['Counter-punching','Sustain high output','Fight-pace conditioning'] },
 { id:'seven', name:'7-Day Kickstart', level:1, days:7, desc:'One week to build the habit.', goals:['Train 7 days in a row','Learn the core 4 punches'] },
 { id:'thirty', name:'30-Day Transformation', level:2, days:30, desc:'A month of progressive boxing fitness.', goals:['Improve stamina & fat loss','Learn full combo library','Build confidence'] },
]
export const getProgram = (id: string) => PROGRAMS.find(p => p.id === id) ?? PROGRAMS[0]
export function getWorkout(p: Program, day: number) {
  const step = Math.floor((day - 1) / Math.max(1, Math.ceil(p.days / 3)))
  const rounds = 3 + p.level - 1 + step, work = 60 + (p.level - 1) * 30, rest = 30 - (p.level - 1) * 5
  const pool = COMBOS.filter(c => c.level <= p.level)
  return { title: `${p.name} – Day ${day}`, rounds, work, rest, pool, minutes: Math.round(rounds * (work + rest) / 60) }
}
export type SeqItem = { filler?: boolean; move: string; combo: string; start: boolean }
export function buildSeq(pool: Combo[], round: number): SeqItem[] {
  const out: SeqItem[] = []
  for (let i = 0; i < pool.length; i++) {
    const c = pool[(i + round) % pool.length]
    c.moves.forEach((m, j) => out.push({ move: m, combo: c.name, start: j === 0 }))
    out.push({ move: 'guard', combo: c.name, start: false, filler: true })
  }
  return out
}
