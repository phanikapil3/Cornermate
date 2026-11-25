
# Cornermate
An interactive 3D Boxing Coach built with React and Three.js, featuring 65 boxing movements, animated training demonstrations, 360° camera controls, combo building, and workout features.
# CornerMate – Boxing Training Platform (MVP prototype)
React + Vite + TypeScript + Tailwind v4 + Framer Motion. Data is saved in your browser (localStorage).

## Run (VS Code)
1. Install Node.js LTS (nodejs.org) and VS Code.
2. In VS Code: File > Open Folder > this folder. Open Terminal (Ctrl+`).
3. `npm install`
4. `npm run dev` then open the URL shown (usually http://localhost:5173).
Check for errors: `npm run build`.

## Backend setup (Supabase, free tier)
1. Create a project at supabase.com.
2. SQL Editor > New query > paste `supabase/schema.sql` > Run.
3. Project Settings > API: copy the Project URL and the anon public key.
4. Copy `.env.example` to `.env`, fill both values, restart `npm run dev`.
5. For quick testing: Authentication > Providers > Email > turn off "Confirm email".
6. On Vercel, add the same two variables under Project Settings > Environment Variables.
Without `.env` the app still runs in local-only mode.

## What works
Landing, onboarding, dashboard, 5 programs (day-by-day), training screen (round/rest timers, pause, resume, skip, finish, voice + beeps), progress (XP, levels, streaks, achievements, weekly chart), profile/settings, reset data.

## Honest limitations
- The coach is a **2D animated SVG figure**, not a 3D model. Real 3D (React Three Fiber + a licensed model/animations, e.g. Mixamo; check current terms) is Milestone 5.
- Login and cloud saving are built but need your Supabase keys (above); I could not test against a live project. Payments (Razorpay) and AI are not built; pricing is display-only.
- Voice uses the browser's speech engine; quality varies by device.
- Reminders toggle only saves a preference.

## Modify
- Brand name, moves, combos, programs: `src/data.ts`. Colors: `src/index.css` (`@theme`).
- Pages: `src/pages`. Coach poses: `src/components/Coach.tsx`. Data/XP logic: `src/store.ts`.

## Deploy to Vercel
Push to GitHub, then vercel.com > Add New Project > import the repo. Defaults work (Vite); `vercel.json` handles routing.

## Android later
Capacitor: `npm i @capacitor/core @capacitor/cli @capacitor/android`, `npx cap init`, `npm run build`, `npx cap add android`, `npx cap sync`. Note Google Play Billing is required for in-app subscriptions.

## 3D coach
- Built-in 3D boxer (`src/components/coach3d/Boxer.tsx`) is made from original 3D shapes and poses 11 moves with smooth blending. It is stylized, not photorealistic.
- Realistic coach: put a licensed humanoid GLB at `public/models/boxer.glb`. The coach loads it automatically (with a loading indicator) if it contains animation clips named like: jab, cross, lefthook, righthook, uppercut, guard (or idle), slipleft, slipright, duck, roll. Clips are crossfaded. If the file is missing, has no such clips, or fails, the built-in 3D boxer is used; if WebGL itself fails, the original 2D boxer is used.
- Making the GLB: download a character and boxing animations (e.g. Mixamo, check Adobe's current terms for commercial use), import into Blender, rename each action to the names above, export as GLB (include animations).
- Performance: 3D code is lazy-loaded, rendering pauses when the coach is off-screen, pixel ratio is capped at 1.75.

## Movement library (65 movements + 18 combo presets)
- Open **Library** in the app: browse by category, search, tap a movement to watch it, slow-motion (0.25×/0.5×), repeat, orthodox/southpaw, and a **combo builder** (tap + on any movement, reorder, play, save). Saved combos are automatically mixed into your workouts.
- Workouts can use any library id: edit `COMBOS` in `src/data.ts`, e.g. `{ name:'Jab, Roll, Hook', moves:['jab','roll-right','lead-hook'], level:2 }`.
- **Add a new movement:** open `src/library/movements.ts`, copy any `def(...)` line, give it a unique id, category, sub-category, difficulty, description and phases (`{ d: seconds, p: { pose changes } }`; pose keys are in `src/components/coach3d/poses.ts`). Use `strike(...)` for punches and `hold(...)` for poses. Then run `npm run check:library` to validate it. Nothing else needs to change: the player sequences any movements automatically, mirrors them for southpaw, and the library page lists them.
- **Add a preset combo:** add a line to `PRESETS` in the same file.
- GLB model: name animation clips after movement ids (e.g. `jab`, `lead-hook`, `rear-uppercut`, `slip-left`, `duck`, `guard`).

### Known limitations of the built-in procedural boxer
- The coach stays on its floor mark. Footwork shows the stepping, turning and leg motion, then returns to center; it does not travel.
- No foot planting (IK), no opponent, no hand wraps or contact. Clinch, parries and blocks show the arm shape only.
- Superman punch is a lunging cross (no jump). Stance switch flips and returns to your stance.
- Poses are authored by hand in joint angles and checked mathematically, not motion-captured. Expect stylized, not photorealistic, technique. Hip rotation is approximated by torso turn.
- The 2D fallback shows only a simplified single pose per movement.

## Workout audio
- **Voice:** every movement is spoken by its name at the same moment its 3D animation starts (browser speech engine). Names come from the movement library via `spokenName(id)` in `src/library/movements.ts`, so new movements are announced automatically. To change how one is pronounced, add `say: 'Left hook'` to its `def(...)` options or an entry in the `SAY` table.
- **Effects:** whooshes and impacts are synthesized sounds, separate from the voice. Punches get whoosh + thump (timed to the strike), defense a soft swish, footwork shoe ticks; body shots sound lower. Phase bells for work/rest/finish.
- **Controls:** mute, Voice on/off, Effects on/off and a volume slider on the workout screen, Library page and Profile (Profile also has voice choice and a test button). Settings are saved.
- **No overlap:** one voice channel. If a new movement arrives while one is still being spoken, the old one is cut off, so the voice always matches the current animation. In the Library at 1x fast combos can cut off long names; use 0.5x to hear every word. Workouts call one movement per second, so names finish.
- **Pause / skip / finish** stop the voice immediately.
- Code: `src/audio/coachAudio.ts`, `src/components/AudioControls.tsx`. Tests: `npm run check:audio` (simulated speech engine) and `npm run check:library`.
- Voice quality depends on the device. Chrome/Edge have the clearest voices; pick one in Profile. For a branded voice later, recorded clips named by movement id could replace speech without changing the rest.

## 3D coach: size, framing and mechanics (v2)
- **Framing:** `src/components/coach3d/framing.ts` computes the camera from the container's shape, so the whole boxer (head, gloves, feet) stays visible on phones, tablets and desktops. `npm run check:library` projects every pose of every movement (both stances, 8 screen shapes) and fails if anything leaves the frame.
- **Skeleton:** `rig.ts` builds the boxer and poses it. Hips and shoulders turn separately, the pelvis shifts weight over the feet, shoulders reach forward, feet are planted and the legs are solved with IK (knees bend and point where the toes point), the front foot can stay fixed while the body pivots, and the head stays level and looks at the target.
- **Transitions:** `player.ts` blends keyframes with a smooth spline (no stop-start at every pose, no overshoot) and recovers to guard more slowly than the strike.
- **Checks (`npm run check:library`):** every leg can reach its foot target, feet never go through the floor, punches extend, uppercuts rise, hooks travel horizontally with the elbow level, body shots bend the knees, slips/rolls/ducks move the head while the guard stays up, pivots keep the front foot planted, steps lift the feet.

### Remaining limitations (the procedural boxer is stylized, not photorealistic)
- Built from simple shapes: no muscles, cloth, face, fingers or hand wraps. Ankles and toes do not bend.
- Poses are hand-authored joint values, not motion capture. They are mathematically checked, not judged by a coach. Expect plausible but simplified technique.
- The coach does not travel across the floor: steps and pivots are shown on the spot and retraced back.
- There is no opponent or contact. Glove-to-body collisions are not detected.
- On a very narrow, tall container the boxer is limited by width (about 51% of its height). The layouts use roomier shapes on phones.

## Camera controls (360-degree orbit, tilt, zoom, reset)
The camera moves; the boxer's body animation is never affected. The camera always re-frames the boxer for the current angle, tilt, zoom and screen shape, so nothing is clipped.
- **Orbit 360 degrees:** drag sideways with the mouse, or swipe sideways on a touch screen.
- **Tilt (camera height):** drag up/down with the mouse. On touch screens vertical swipes tilt only in the Library (inspect mode); elsewhere they scroll the page. The tilt is limited so the camera can never flip upside down or go under the floor.
- **Zoom:** pinch (touch), Ctrl/Cmd + mouse wheel or trackpad pinch, or the zoom buttons. Limited to 0.55x - 1.6x.
- **Reset:** double-click / double-tap, or the Reset button. Eases back to the original view.
- **Buttons:** tap the small orbit button in the top-right corner of the coach to show them: rotate left/right 45 degrees, camera higher/lower, zoom in/out, reset, and Front / Left / Back / Right views. They start collapsed on the workout screen and landing page so they never cover the boxer, and open by default in the Library.
- Code: `src/components/coach3d/CoachScene.tsx` (camera rig), `framing.ts` (exact no-clipping framing), `cameraCtl.ts`, `src/components/CameraControls.tsx`.
- I did not use drei's OrbitControls: it cannot recompute a no-clipping frame for every angle, which this project requires.

## Checks
- `npm run check:library`: validates all 65 movements and 18 presets on the real skeleton (reach, floor contact, guard, punch extension, technique mechanics) and projects 8.3 million body points through a real camera at many angles and screen shapes to prove nothing clips.
- `npm run check:audio`: tests voice announcements and sound-effect timing logic with a simulated speech engine.
- `npm run build`: type-checks and builds for production.
- `scripts/browser-tests/`: optional real-browser tests (see its README).

## Latest changes
- Fixed a layout bug where the 3D canvas was only ~150px tall inside a larger panel; the coach now fills its area (about 93% of the area height, always fully visible).
- Camera framing is solved exactly for the movements being shown, any screen shape and any camera angle.
- Better proportions (thicker limbs, bigger gloves and boots, eyes show where the head faces), and a 360-degree orbit camera with tilt, zoom, reset and view buttons.
- Animation time step is capped at 0.25 s (was 0.05 s), so animation keeps real-time speed down to about 4 frames per second on slow devices.
