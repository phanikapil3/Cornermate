import { motion } from 'framer-motion'
import type { Move } from '../data'
type P = { l:[number,number,number]; r:[number,number,number]; g:{x:number;y:number;rotate:number} }
const G:[number,number,number]=[86,74,15], R:[number,number,number]=[114,74,15]
const POSES: Record<Move,P> = {
  guard:{l:G,r:R,g:{x:0,y:0,rotate:0}}, step:{l:G,r:R,g:{x:6,y:-8,rotate:2}},
  jab:{l:[84,46,25],r:R,g:{x:0,y:0,rotate:3}}, cross:{l:G,r:[116,46,25],g:{x:0,y:0,rotate:-4}},
  lhook:{l:[36,86,20],r:R,g:{x:8,y:0,rotate:6}}, rhook:{l:G,r:[164,86,20],g:{x:-8,y:0,rotate:-6}},
  upper:{l:G,r:[112,36,19],g:{x:0,y:10,rotate:-3}},
  slipL:{l:G,r:R,g:{x:-22,y:4,rotate:-9}}, slipR:{l:G,r:R,g:{x:22,y:4,rotate:9}},
  duck:{l:G,r:R,g:{x:0,y:34,rotate:0}}, roll:{l:G,r:R,g:{x:-14,y:26,rotate:-14}},
}
const spring = { type:'spring' as const, stiffness:520, damping:20 }
export default function Coach2D({ move }: { move: Move }) {
  const p = POSES[move]
  return (
    <svg viewBox="0 0 200 270" className="w-full h-full" role="img" aria-label={`Coach demonstrating ${move}`}>
      <ellipse cx="100" cy="258" rx="55" ry="7" fill="#e11d2e" opacity=".25" />
      <path d="M88 175 L78 252 M112 175 L122 252" stroke="#2a2a2a" strokeWidth="16" strokeLinecap="round" />
      <motion.g animate={p.g} transition={spring} style={{ originX:'100px', originY:'175px' }}>
        <line x1="100" y1="92" x2="100" y2="178" stroke="#1c1c1c" strokeWidth="46" strokeLinecap="round" />
        <rect x="76" y="150" width="48" height="10" rx="3" fill="#e11d2e" />
        <circle cx="100" cy="60" r="23" fill="#c89a82" /><path d="M77 56 Q100 28 123 56 L123 50 Q100 22 77 50Z" fill="#111" />
        <motion.line x1="80" y1="102" stroke="#c89a82" strokeWidth="12" strokeLinecap="round" animate={{ x2:p.l[0], y2:p.l[1] }} transition={spring} />
        <motion.line x1="120" y1="102" stroke="#c89a82" strokeWidth="12" strokeLinecap="round" animate={{ x2:p.r[0], y2:p.r[1] }} transition={spring} />
        <motion.circle fill="#e11d2e" stroke="#fff" strokeWidth="2" animate={{ cx:p.l[0], cy:p.l[1], r:p.l[2] }} transition={spring} />
        <motion.circle fill="#e11d2e" stroke="#fff" strokeWidth="2" animate={{ cx:p.r[0], cy:p.r[1], r:p.r[2] }} transition={spring} />
      </motion.g>
    </svg>
  )
}
