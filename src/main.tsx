import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import Shell from './components/Shell'
import Landing from './pages/Landing'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Programs from './pages/Programs'
import Progress from './pages/Progress'
import Profile from './pages/Profile'
import Train from './pages/Train'
import Library from './pages/Library'
import Auth from './pages/Auth'
import { supabase } from './supabase'
import { loadRemote, setState, getState } from './store'
import { bindSettings } from './audio/coachAudio'
bindSettings(getState)
supabase?.auth.onAuthStateChange((_e, sess) => { if (sess?.user) void loadRemote({ id: sess.user.id, email: sess.user.email ?? '' }); else setState({ user: null }) })
createRoot(document.getElementById('root')!).render(
  <StrictMode><BrowserRouter><Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/onboarding" element={<Onboarding />} />
    <Route path="/auth" element={<Auth />} />
    <Route path="/train" element={<Train />} />
    <Route element={<Shell />}>
      <Route path="/dashboard" element={<Dashboard />} /><Route path="/programs" element={<Programs />} />
      <Route path="/library" element={<Library />} /><Route path="/progress" element={<Progress />} /><Route path="/profile" element={<Profile />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></BrowserRouter></StrictMode>
)
