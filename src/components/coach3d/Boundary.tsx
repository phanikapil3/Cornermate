import { Component, type ReactNode } from 'react'
export default class Boundary extends Component<{ fallback: ReactNode; children: ReactNode; onError?: () => void }, { err: boolean }> {
  state = { err: false }
  static getDerivedStateFromError() { return { err: true } }
  componentDidCatch(e: unknown) { console.warn('3D coach component failed, using fallback:', e); this.props.onError?.() }
  render() { return this.state.err ? this.props.fallback : this.props.children }
}
