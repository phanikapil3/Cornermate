import { useMemo, useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { useAnimations, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import type { Player } from '../../library/player'
// A GLB clip is matched to a movement when its name equals / contains the movement id (e.g. "lead-hook", "LeadHook", "lead_hook").
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
const LEGACY: Record<string, string[]> = { 'lead-hook':['lefthook','lhook'], 'rear-hook':['righthook','rhook'], 'rear-uppercut':['uppercut'], 'slip-left':['slipl'], 'slip-right':['slipr'], guard:['idle','stance'] }
const findClip = (names: string[], id: string) => { const ks = [norm(id), ...(LEGACY[id] ?? [])]
  for (const k of ks) { const hit = names.find(n => norm(n) === k) ?? names.find(n => norm(n).includes(k)); if (hit) return hit } }
export default function GlbBoxer({ url, player, fallback }: { url: string; player: Player; fallback: ReactNode }) {
  const group = useRef<THREE.Group>(null); const gltf = useGLTF(url)
  const { actions, names } = useAnimations(gltf.animations, group)
  const usable = ['jab', 'cross', 'lead-hook', 'rear-hook', 'rear-uppercut', 'duck'].some(id => findClip(names, id)) // needs real punch clips
  const prev = useRef<string | null>(null); const last = useRef('')
  useFrame(() => {
    if (!usable || player.currentId === last.current) return; last.current = player.currentId
    const name = findClip(names, player.currentId) ?? findClip(names, 'guard') ?? names[0]; if (!name || name === prev.current) return
    const next = actions[name]; if (!next) return
    if (prev.current) actions[prev.current]?.fadeOut(.2) // smooth crossfade
    next.reset().fadeIn(.2).play(); prev.current = name
  })
  const fit = useMemo(() => { const b = new THREE.Box3().setFromObject(gltf.scene); const s = 1.75 / ((b.max.y - b.min.y) || 1); return { s, y: -b.min.y * s } }, [gltf])
  if (!usable) return <>{fallback}</>
  return <group ref={group} scale={fit.s} position={[0, fit.y, 0]}><primitive object={gltf.scene} /></group>
}
