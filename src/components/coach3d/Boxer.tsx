import { useFrame } from '@react-three/fiber'
import { useMemo } from 'react'
import { createBoxer, applyPose } from './rig'
import { BASE } from './poses'
import type { Player } from '../../library/player'
// The 3D coach. The skeleton and pose maths live in rig.ts; the movement timeline comes from the Player.
export default function Boxer({ player }: { player: Player }) {
  const rig = useMemo(() => { const r = createBoxer(); applyPose(r, BASE); return r }, [])
  useFrame((s, dt) => { const frozen = import.meta.env.DEV && (window as unknown as { __coachFreeze?: boolean }).__coachFreeze // dev-only: lets browser tests pause on an exact pose
    applyPose(rig, frozen ? player.cur : player.update(Math.min(dt, .25)), s.clock.elapsedTime) })
  return <primitive object={rig.root} />
}
