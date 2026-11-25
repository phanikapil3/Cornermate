// ===== BOXING MOVEMENT LIBRARY =====
// HOW TO ADD A MOVEMENT: copy any line below, give it a new unique id, and describe it as phases.
// Each phase = { d: seconds, p: pose changes from the basic guard }. The player blends phase to phase, then recovers to guard.
// Pose keys (hips, torso, shoulders, feet...) are explained in src/components/coach3d/poses.ts. Run `npm run check:library` after editing.
import { BASE as B, type Pose } from '../components/coach3d/poses'
export const DEFAULT_RECOVERY = .18 // seconds to settle back to guard after a movement (slower than the strike: natural recovery)
export type Category = 'punches' | 'defense' | 'footwork' | 'stance'
export type Phase = { d: number; p: Partial<Pose>; mirror?: boolean }
export type Movement = { id: string; name: string; category: Category; sub: string; desc: string; difficulty: 1|2|3; duration: number; recovery?: number; phases: Phase[]; limitation?: string; say?: string }
export type Preset = { name: string; ids: string[]; level: 1|2|3; sub: string }
export const CATEGORIES: Record<Category, string> = { punches:'Punches', defense:'Defense', footwork:'Footwork', stance:'Stances' }
const def = (id: string, name: string, category: Category, sub: string, difficulty: 1|2|3, desc: string, phases: Phase[], o: { recovery?: number; limitation?: string } = {}): Movement =>
  ({ id, name, category, sub, difficulty, desc, phases, duration: +phases.reduce((a, x) => a + x.d, 0).toFixed(2), ...o })
type P = Partial<Pose>
// ---- phase helpers --------------------------------------------------------------------------------------------
// strike: load (hips/shoulders turn the opposite way, hips sink a little) -> fast hit -> brief hold. Recovery is slower (see DEFAULT_RECOVERY).
const strike = (p: P, d = .11): Phase[] => [{ d: .07, p: { py: -(p.py ?? 0) * .4, ty: -(p.ty ?? 0) * .4, tz: -(p.tz ?? 0) * .3, tx: p.tx ?? B.tx, wy: Math.min(p.wy ?? B.wy, B.wy) - .02, wz: -.02 } }, { d, p }, { d: .05, p }]
const hold = (p: P, d = .16): Phase[] => [{ d, p }, { d: .12, p }]
const back = (out: Phase[]): Phase[] => [...out, ...out.slice(0, -1).reverse()] // step out, then retrace the steps (feet lift and re-plant, no sliding)
const foot = (s: 'l' | 'r', x: number, z: number, lift = 0): P => ({ [`${s}fx`]: x, [`${s}fz`]: z, [`${s}fl`]: lift } as P)
const at = (s: 'l' | 'r', dx = 0, dz = 0, lift = 0): P => foot(s, (s === 'l' ? B.lfx : B.rfx) + dx, (s === 'l' ? B.lfz : B.rfz) + dz, lift)
const sc = (w: P, k: number): P => Object.fromEntries(Object.entries(w).map(([a, b]) => [a, (b as number) * k])) as P
// one step: first foot lifts and lands, then the second foot follows; hips (weight) travel with the feet
const step = (a: 'l' | 'r', b: 'l' | 'r', dx: number, dz: number, w: P, extra: P = {}): Phase[] => [
  { d: .08, p: { ...at(a, dx * .6, dz * .6, .08), ...sc(w, .3), wy: .87, ...extra } }, { d: .07, p: { ...at(a, dx, dz), ...sc(w, .5), wy: .87, ...extra } },
  { d: .08, p: { ...at(a, dx, dz), ...at(b, dx * .6, dz * .6, .08), ...w, wy: .87, ...extra } }, { d: .07, p: { ...at(a, dx, dz), ...at(b, dx, dz), ...w, wy: .87, ...extra } }]
// ---- arm shapes reused by punch variants ----------------------------------------------------------------------
const LJAB = { lsx: -1.72, lsz: -.05, le: -.05, lsp: .12 }, RCROSS = { rsx: -1.72, rsz: .05, re: -.05, rsp: .14 }
const LH = { lsx: -.3, lsz: 1.85, le: -1.7, lsp: .04 }, RH = { rsx: -.3, rsz: -1.85, re: -1.7, rsp: .04 }
const SINK = .74 // hip height for body shots
const P_ = 'punches', D = 'defense', F = 'footwork', S = 'stance'
export const MOVEMENTS: Movement[] = [
  // ---- PUNCHES: straights. Jab: shoulder reaches, hips follow slightly, weight edges onto the lead foot.
  def('jab','Jab',P_,'Straights',1,'Fast straight with the lead hand. Snap it out and back.',strike({ ...LJAB, py: -.08, ty: -.14, tx: .15, wz: .05 })),
  def('snap-jab','Snap Jab',P_,'Straights',1,'Short, quick jab to measure distance.',strike({ lsx: -1.55, lsz: -.05, le: -.35, lsp: .08, py: -.04, ty: -.08, wz: .02 }, .08)),
  def('step-jab','Step Jab',P_,'Straights',2,'Jab while stepping forward to close distance.',[{ d: .1, p: { ...at('l', 0, .1, .07), wz: .06, tx: .15 } }, ...strike({ ...LJAB, ...at('l', 0, .16), py: -.08, ty: -.14, tx: .15, wz: .15, wy: .86 })],{ limitation:'The rear foot does not follow the step; the feet slide back during recovery.' }),
  def('corkscrew-jab','Corkscrew Jab',P_,'Straights',3,'Jab with a twisting fist for extra snap.',strike({ ...LJAB, lsy: .7, py: -.1, ty: -.18, tx: .15, wz: .05 })),
  // Cross: rear foot pivots and heel lifts, hips then shoulders turn, weight transfers onto the lead foot.
  def('cross','Cross',P_,'Straights',1,'Straight rear hand. Rotate hips and shoulder into it.',strike({ ...RCROSS, py: .33, ty: .27, tx: .15, wz: .09, rfl: .03, rfr: -.15 })),
  // ---- hooks: elbow level with the fist, horizontal path, hips and shoulders turn as one unit, pivot on the lead foot.
  def('lead-hook','Lead Hook',P_,'Hooks',2,'Left hook (orthodox): rotate the body, elbow level with the fist.',strike({ ...LH, py: -.28, ty: -.3, tx: .1, wz: .07, lfr: -.5 })),
  def('rear-hook','Rear Hook',P_,'Hooks',2,'Right hook (orthodox): turn on the back foot.',strike({ ...RH, py: .28, ty: .3, tx: .1, wz: .05, rfl: .03, rfr: -.15 })),
  def('short-hook','Short Hook',P_,'Hooks',2,'Tight inside hook with a bent elbow.',strike({ lsx: -.5, lsz: 1.0, le: -2.0, lsp: .03, py: -.25, ty: -.25, wz: .05, lfr: -.4 })),
  def('check-hook','Check Hook',P_,'Hooks',3,'Lead hook while pivoting away from a charging opponent.',strike({ ...LH, py: -.2, ty: -.25, pv: 1, ryaw: .15, wz: -.02, lfr: -.4 })),
  def('shovel-hook','Shovel Hook',P_,'Hooks',3,'Lead hook that scoops upward, between a hook and uppercut.',strike({ lsx: -.7, lsz: .7, le: -2.0, lsp: .05, wy: SINK, tx: .28, py: -.25, ty: -.28, wz: .05 })),
  def('rear-shovel-hook','Rear Shovel Hook',P_,'Hooks',3,'Rear-hand shovel hook from a dip.',strike({ rsx: -.7, rsz: -.7, re: -2.0, rsp: .05, wy: SINK, tx: .28, py: .25, ty: .28, wz: .04, rfl: .02 })),
  // ---- uppercuts: sink the hips and drop the shoulder, then drive UP through the legs.
  def('lead-uppercut','Lead Uppercut',P_,'Uppercuts',2,'Dip, then drive the lead hand up through the chin.',[{ d: .14, p: { wy: .72, tx: .3, tz: -.12, lsx: -.5, le: -1.2, py: -.08 } }, ...strike({ lsx: -1.1, lsz: -.05, le: -1.6, lsp: .08, wy: .9, py: -.22, ty: -.2, tz: .06, tx: -.02, wz: .05 })]),
  def('rear-uppercut','Rear Uppercut',P_,'Uppercuts',2,'Dip, then rotate and drive the rear hand upward.',[{ d: .14, p: { wy: .72, tx: .3, tz: .12, rsx: -.5, re: -1.2, py: .08 } }, ...strike({ rsx: -1.1, rsz: .05, re: -1.6, rsp: .1, wy: .9, py: .28, ty: .25, tz: -.06, tx: -.02, wz: .06, rfl: .02, rfr: -.2 })]),
  // ---- overhands: loop over the guard, body falls into the punch.
  def('overhand','Overhand',P_,'Overhands',2,'Looping rear hand that arcs over the opponent\'s guard.',strike({ rsx: -1.6, rsz: -.6, re: -.5, rsp: .14, py: .38, ty: .32, tz: .22, tx: .2, wy: .82, wz: .09, rfl: .03, rfr: -.15 }, .13)),
  def('lead-overhand','Lead Overhand',P_,'Overhands',2,'Looping lead hand (common from southpaw).',strike({ lsx: -1.6, lsz: .6, le: -.5, lsp: .14, py: -.38, ty: -.32, tz: -.22, tx: .2, wy: .82, wz: .07, lfr: -.5 }, .13)),
  // ---- body shots: the LEGS bend (hips drop) to change level, the back stays long.
  def('body-jab','Body Jab',P_,'Body shots',2,'Dip the knees and jab to the stomach.',strike({ lsx: -1.25, lsz: -.05, le: -.05, lsp: .1, wy: SINK, tx: .42, py: -.08, ty: -.12, wz: .06 })),
  def('body-cross','Body Cross',P_,'Body shots',2,'Bend the knees and throw the rear hand to the body.',strike({ rsx: -1.25, rsz: .05, re: -.05, rsp: .12, wy: SINK, tx: .42, py: .3, ty: .25, wz: .08, rfl: .02, rfr: -.2 })),
  def('body-hook','Body Hook',P_,'Body shots',2,'Lead hook to the ribs or liver. Bend the knees, do not just lean.',strike({ lsx: -.15, lsz: 1.2, le: -1.5, lsp: .03, wy: SINK, tx: .36, tz: .12, py: -.28, ty: -.28, wz: .06, lfr: -.5 })),
  def('rear-body-hook','Rear Body Hook',P_,'Body shots',3,'Rear hook to the ribs from a bent-knee dip.',strike({ rsx: -.15, rsz: -1.2, re: -1.5, rsp: .03, wy: SINK, tx: .36, tz: -.12, py: .28, ty: .28, wz: .04, rfl: .02, rfr: -.15 })),
  def('body-uppercut','Body Uppercut',P_,'Body shots',3,'Short lead uppercut to the stomach from a deep dip.',strike({ lsx: -.85, lsz: -.05, le: -1.2, lsp: .06, wy: .72, tx: .4, py: -.2, ty: -.2, wz: .05 })),
  // ---- specialty and feints
  def('bolo','Bolo Punch',P_,'Specialty',3,'Wide looping swing that comes up from low. Advanced and rarely used.',[{ d: .14, p: { rsx: .1, rsz: -1.5, re: -.2, tz: .15, wy: .78, py: .1 } }, { d: .2, p: { rsx: -1.1, rsz: -.3, re: -1.2, rsp: .1, py: .35, ty: .3, wy: .9, wz: .06 } }, { d: .06, p: { rsx: -1.1, rsz: -.3, re: -1.2, rsp: .1, py: .35, ty: .3, wy: .9, wz: .06 } }]),
  def('superman-punch','Superman Punch',P_,'Specialty',3,'Fake with the lead leg, then leap into a long cross.',[{ d: .12, p: { wy: .74, tx: .3, ...at('l', 0, .08, .05) } }, ...strike({ ...RCROSS, py: .33, ty: .27, wz: .16, wy: .8, tx: .3, ...at('l', 0, .16), rfl: .03 })],{ limitation:'The leap is not animated; it is shown as a lunging cross.' }),
  def('jab-feint','Jab Feint',P_,'Feints',2,'Show a half jab to draw a reaction.',[{ d: .1, p: { lsx: -1.3, le: -.8, lsp: .06, ty: -.08, wz: .03 } }, { d: .1, p: { lsx: -.95, le: -1.9 } }]),
  def('shoulder-feint','Shoulder Feint',P_,'Feints',2,'Dip the lead shoulder to trigger a reaction.',[{ d: .1, p: { ty: -.3, tz: -.1, py: -.1 } }, { d: .1, p: { ty: .1 } }]),
  def('level-feint','Level Change Feint',P_,'Feints',2,'Drop your level as if to attack the body.',[{ d: .14, p: { tx: .35, wy: SINK } }, { d: .12, p: {} }]),
  // ---- DEFENSE: head movement (hips shift over the leg, knees bend, torso leans, hands stay up)
  def('slip-left','Slip Left',D,'Head movement',1,'Move your head off the center line to your left.',hold({ wx: .1, wy: .84, tz: -.3, ty: -.1, py: -.06 }, .14)),
  def('slip-right','Slip Right',D,'Head movement',1,'Move your head off the center line to your right.',hold({ wx: -.1, wy: .84, tz: .3, ty: .1, py: .06 }, .14)),
  def('bob-weave','Bob and Weave',D,'Head movement',3,'Dip under a punch and come up on the other side.',[{ d: .14, p: { wx: .08, wy: .72, tx: .45, tz: -.28, ty: -.08 } }, { d: .14, p: { wy: .6, tx: .55 } }, { d: .14, p: { wx: -.08, wy: .72, tx: .45, tz: .28, ty: .08 } }, { d: .1, p: { wx: -.03, wy: .86, tx: .2, tz: .1 } }]),
  def('duck','Duck',D,'Head movement',1,'Bend the knees and drop under a punch.',hold({ wy: .58, tx: .48, lsx: -1.25, rsx: -1.3 }, .16)),
  def('roll-left','Roll Left',D,'Head movement',3,'Roll under a hook, moving to your left.',[{ d: .12, p: { wx: -.06, wy: .72, tx: .38, tz: .3, ty: .1 } }, { d: .13, p: { wy: .6, tx: .55 } }, { d: .14, p: { wx: .1, wy: .74, tx: .28, tz: -.3, ty: -.1 } }]),
  def('roll-right','Roll Right',D,'Head movement',3,'Roll under a hook, moving to your right.',[{ d: .12, p: { wx: .06, wy: .72, tx: .38, tz: -.3, ty: -.1 } }, { d: .13, p: { wy: .6, tx: .55 } }, { d: .14, p: { wx: -.1, wy: .74, tx: .28, tz: .3, ty: .1 } }]),
  def('pull-back','Pull Back',D,'Distance',1,'Lean the upper body and weight back out of range.',hold({ wz: -.16, wy: .88, tx: -.14 }, .14)),
  def('lean-back','Lean Back',D,'Distance',2,'Lean back from the waist so the punch falls short.',hold({ tx: -.38, wz: -.12, wy: .88 }, .16)),
  // guards
  def('high-guard','High Guard',D,'Guards',1,'Gloves tight to the temples, chin tucked.',hold({ lsx: -1.05, le: -2.25, rsx: -1.05, re: -2.25, hx: .18 }, .2)),
  def('low-guard','Low Guard',D,'Guards',2,'Hands low to bait punches. Needs good head movement.',hold({ lsx: -.5, le: -1.5, rsx: -.5, re: -1.5, hx: .05, tx: .05 }, .2)),
  def('shoulder-roll','Shoulder Roll',D,'Guards',3,'Philly shell: lead shoulder covers the chin, rear hand guards.',hold({ lsx: -.4, lsz: -.9, le: -1.6, rsx: -1.0, re: -2.2, py: .12, ty: .3, tz: -.12, hz: -.18 }, .2)),
  def('cover-up','Cover Up',D,'Guards',2,'Wrap both arms around the head to absorb punches.',hold({ lsx: -1.1, lsz: -.35, le: -2.6, rsx: -1.1, rsz: .35, re: -2.6, tx: .35, hx: .3, wy: .8 }, .18)),
  // blocks & parries
  def('parry-lead','Parry (Lead Hand)',D,'Blocks & parries',2,'Brush an incoming straight punch aside with the lead hand.',[{ d: .08, p: { lsx: -1.25, lsz: .35, le: -1.3, ty: -.05 } }, { d: .1, p: { lsx: -1.3, lsz: .55, le: -1.0, ty: -.08 } }]),
  def('parry-rear','Parry (Rear Hand)',D,'Blocks & parries',2,'Brush an incoming punch aside with the rear hand.',[{ d: .08, p: { rsx: -1.25, rsz: -.35, re: -1.3, ty: .05 } }, { d: .1, p: { rsx: -1.3, rsz: -.55, re: -1.0, ty: .08 } }]),
  def('catch','Catch',D,'Blocks & parries',2,'Catch a jab on the rear glove.',hold({ rsx: -1.4, rsz: .1, re: -1.6, rsp: .06 }, .1)),
  def('block-high','High Block',D,'Blocks & parries',1,'Forearms up to block punches to the head.',hold({ lsx: -.8, lsz: -.5, le: -2.6, rsx: -.8, rsz: .5, re: -2.6, tx: .2 }, .15)),
  def('block-body','Body Block',D,'Blocks & parries',1,'Elbows in to protect the ribs and stomach.',hold({ lsx: -.15, lsz: -.3, le: -1.9, rsx: -.15, rsz: .3, re: -1.9, tx: .3, wy: .84 }, .15)),
  def('elbow-block','Elbow Check',D,'Blocks & parries',3,'Drop the lead elbow to stop a body hook.',hold({ lsx: -.2, lsz: .15, le: -2.5, ty: -.25, tz: .1, py: -.08 }, .14)),
  def('clinch','Clinch',D,'Blocks & parries',2,'Tie up with both arms to stop the exchange.',hold({ lsx: -1.2, lsz: -.5, le: -1.0, rsx: -1.2, rsz: .5, re: -1.0, tx: .25 }, .18),{ limitation:'There is no opponent to hold, so the arms just close in.' }),
  // ---- FOOTWORK: planted feet. Each foot lifts, travels and lands; hips carry the weight; steps are shown out and back (no sliding).
  def('forward-step','Forward Step',F,'Steps',1,'Lead foot steps first, rear foot follows.',back(step('l', 'r', 0, .26, { wz: .22 }, { tx: .16 })),{ recovery: .1, limitation:'The coach steps out and back on the spot; it does not travel across the floor.' }),
  def('backward-step','Backward Step',F,'Steps',1,'Rear foot steps back first, lead foot follows.',back(step('r', 'l', 0, -.26, { wz: -.22 }, { tx: .08 })),{ recovery: .1, limitation:'The coach steps out and back on the spot; it does not travel across the floor.' }),
  def('side-step-left','Side Step Left',F,'Steps',1,'Slide left without crossing your feet.',back(step('l', 'r', .24, 0, { wx: .17 })),{ recovery: .1 }),
  def('side-step-right','Side Step Right',F,'Steps',1,'Slide right without crossing your feet.',back(step('r', 'l', -.24, 0, { wx: -.17 })),{ recovery: .1 }),
  def('lunge-step','Lunge Step',F,'Steps',2,'Long forward step to reach with a punch.',back([{ d: .1, p: { ...at('l', 0, .18, .08), wy: .8, wz: .05, tx: .18 } }, { d: .1, p: { ...at('l', 0, .26), wy: .68, wz: .13, tx: .2 } }, { d: .08, p: { ...at('l', 0, .26), wy: .68, wz: .13, tx: .2 } }]),{ recovery: .1 }),
  def('shuffle','Shuffle',F,'Steps',2,'Quick small hops forward and back on the balls of the feet.',[{ d: .09, p: { ...at('l', 0, .06, .035), wz: .03, wy: .88 } }, { d: .09, p: { ...at('l', 0, .06), ...at('r', 0, .06, .035), wz: .05, wy: .88 } }, { d: .09, p: { ...at('r', 0, -.0, .035), wz: -.0, wy: .88 } }, { d: .09, p: { wy: .88 } }]),
  def('bounce','Bounce',F,'Steps',1,'Light bounce to stay loose and balanced.',[{ d: .1, p: { wy: .94, lfl: .03, rfl: .03 } }, { d: .1, p: { wy: .86 } }, { d: .1, p: { wy: .94, lfl: .03, rfl: .03 } }, { d: .1, p: { wy: .86 } }]),
  def('pivot-left','Pivot Left',F,'Pivots & angles',2,'Turn on the lead foot to change your angle to the left.',back([{ d: .1, p: { pv: 1, ryaw: .05, rfl: .08 } }, { d: .1, p: { pv: 1, ryaw: .45, rfl: .08 } }, { d: .08, p: { pv: 1, ryaw: .45 } }]),{ recovery: .1 }),
  def('pivot-right','Pivot Right',F,'Pivots & angles',2,'Turn on the lead foot to change your angle to the right.',back([{ d: .1, p: { pv: 1, ryaw: -.65, rfl: .08 } }, { d: .1, p: { pv: 1, ryaw: -1.05, rfl: .08 } }, { d: .08, p: { pv: 1, ryaw: -1.05 } }]),{ recovery: .1 }),
  def('l-step','L-Step',F,'Pivots & angles',3,'Step forward, then turn about 90 degrees to attack from the side.',back([{ d: .08, p: { ...at('l', 0, .14, .08), wz: .08, wy: .87 } }, { d: .07, p: { ...at('l', 0, .24), wz: .16, wy: .87 } }, { d: .1, p: { ...at('l', 0, .24), wz: .16, wy: .87, pv: 1, ryaw: .1, rfl: .08 } }, { d: .1, p: { ...at('l', 0, .24), wz: .16, wy: .87, pv: 1, ryaw: .55, rfl: .08 } }, { d: .07, p: { ...at('l', 0, .24), wz: .16, wy: .87, pv: 1, ryaw: .55 } }]),{ recovery: .1 }),
  def('v-step','V-Step',F,'Pivots & angles',3,'Step out diagonally in a V shape to open a new angle.',back([{ d: .08, p: { ...at('l', .1, .1, .08), wz: .07, wx: .06, wy: .87 } }, { d: .07, p: { ...at('l', .2, .2), wz: .09, wx: .08, wy: .87, ryaw: -.5 } }, { d: .08, p: { ...at('l', .2, .2), ...at('r', .12, .1, .08), wz: .18, wx: .14, wy: .87, ryaw: -.5 } }, { d: .07, p: { ...at('l', .2, .2), ...at('r', .2, .2), wz: .18, wx: .14, wy: .87, ryaw: -.5 } }]),{ recovery: .1 }),
  def('angle-exit-left','Angle Exit Left',F,'Pivots & angles',3,'Step off the line to the left at an angle to escape.',back([{ d: .08, p: { ...at('l', .2, 0, .08), wx: .1, wz: -.02, wy: .87 } }, { d: .07, p: { ...at('l', .3, .04), wx: .18, wz: -.03, wy: .87, ryaw: .15 } }, { d: .08, p: { ...at('l', .3, .04), ...at('r', .14, -.16, .08), wx: .2, wz: -.03, wy: .87, ryaw: .35 } }, { d: .07, p: { ...at('l', .3, .04), ...at('r', .2, -.12), wx: .2, wy: .87, ryaw: .4 } }]),{ recovery: .1 }),
  def('angle-exit-right','Angle Exit Right',F,'Pivots & angles',3,'Step off the line to the right at an angle to escape.',back([{ d: .08, p: { ...at('r', -.2, 0, .08), wx: -.1, wz: -.02, wy: .87 } }, { d: .07, p: { ...at('r', -.3, .04), wx: -.18, wz: -.03, wy: .87, ryaw: -.75 } }, { d: .08, p: { ...at('r', -.3, .04), ...at('l', -.14, -.16, .08), wx: -.2, wz: -.03, wy: .87, ryaw: -.95 } }, { d: .07, p: { ...at('r', -.3, .04), ...at('l', -.2, -.12), wx: -.2, wy: .87, ryaw: -1.0 } }]),{ recovery: .1 }),
  def('switch-step','Switch Step',F,'Stance switching',3,'Quickly switch from orthodox to southpaw.',[{ d: .1, p: { lfl: .05, rfl: .05, lfx: .12, rfx: -.12, lfz: 0, rfz: 0, wy: .92 } }, { d: .18, p: {}, mirror: true }, { d: .16, p: {}, mirror: true }],{ limitation:'The stance flips and then returns to your own stance.' }),
  // ---- STANCES
  def('guard','Guard Up',S,'Stances',1,'Your basic boxing guard and stance.',hold({}, .2)),
  def('southpaw-stance','Southpaw Stance',S,'Stances',1,'Right foot and right hand lead (mirror of orthodox).',[{ d: .1, p: { lfl: .05, rfl: .05, lfx: .12, rfx: -.12, lfz: 0, rfz: 0, wy: .92 } }, { d: .2, p: {}, mirror: true }, { d: .35, p: {}, mirror: true }]),
  def('square-stance','Square Stance',S,'Stances',1,'Shoulders square, feet even. Good for defense and body work.',hold({ ryaw: 0, lfx: .2, lfz: .05, lfr: 0, rfx: -.2, rfz: -.05, rfr: 0, tx: .1 }, .25)),
  def('wide-stance','Wide Stance',S,'Stances',1,'Longer stance for stability and power.',hold({ lfx: .22, lfz: .3, rfx: -.22, rfz: -.3, wy: .82 }, .25)),
  def('peek-a-boo','Peek-a-Boo',S,'Guard styles',2,'Gloves glued to the face, head moves constantly.',hold({ lsx: -1.15, lsz: 0, le: -2.4, rsx: -1.15, rsz: 0, re: -2.4, tx: .25, hx: .2 }, .25)),
  def('long-guard','Long Guard',S,'Guard styles',2,'Lead arm extended to control distance, rear hand at the chin.',hold({ lsx: -1.3, lsz: -.1, le: -.7, lsp: .06, rsx: -1.0, re: -2.2, hx: -.1 }, .25)),
  def('cross-guard','Cross Guard',S,'Guard styles',3,'Arms crossed in front of the body (crab guard).',hold({ lsx: -.6, lsz: -.55, le: -2.2, rsx: -.6, rsz: .55, re: -2.2, tx: .3 }, .25)),
]
export const PRESETS: Preset[] = [
  { name:'Jab → Cross', ids:['jab','cross'], level:1, sub:'Basic combos' },
  { name:'Double Jab → Cross', ids:['jab','jab','cross'], level:1, sub:'Basic combos' },
  { name:'Jab → Cross → Lead Hook', ids:['jab','cross','lead-hook'], level:2, sub:'Basic combos' },
  { name:'1-2-3-2', ids:['jab','cross','lead-hook','cross'], level:2, sub:'Basic combos' },
  { name:'Jab → Cross → Lead Hook → Rear Hook', ids:['jab','cross','lead-hook','rear-hook'], level:3, sub:'Basic combos' },
  { name:'Jab → Cross → Lead Hook → Rear Uppercut', ids:['jab','cross','lead-hook','rear-uppercut'], level:3, sub:'Basic combos' },
  { name:'Jab → Body Hook → Head Hook', ids:['jab','body-hook','lead-hook'], level:2, sub:'Head & body' },
  { name:'Body Cross → Lead Hook', ids:['body-cross','lead-hook'], level:2, sub:'Head & body' },
  { name:'Jab → Slip → Cross', ids:['jab','slip-right','cross'], level:2, sub:'With defense' },
  { name:'Jab → Cross → Roll → Hook', ids:['jab','cross','roll-right','lead-hook'], level:3, sub:'With defense' },
  { name:'Jab → Cross → Lead Hook → Slip Right', ids:['jab','cross','lead-hook','slip-right'], level:3, sub:'With defense' },
  { name:'Jab → Cross → Pivot → Cross', ids:['jab','cross','pivot-left','cross'], level:3, sub:'With footwork' },
  { name:'Step Jab → Cross → Angle Exit', ids:['step-jab','cross','angle-exit-left'], level:3, sub:'With footwork' },
  { name:'Parry → Cross', ids:['parry-lead','cross'], level:2, sub:'Counters' },
  { name:'Slip Right → Cross → Lead Hook', ids:['slip-right','cross','lead-hook'], level:2, sub:'Counters' },
  { name:'Pull Back → Cross', ids:['pull-back','cross'], level:2, sub:'Counters' },
  { name:'Catch → Cross → Lead Hook', ids:['catch','cross','lead-hook'], level:3, sub:'Counters' },
  { name:'Lean Back → Overhand', ids:['lean-back','overhand'], level:3, sub:'Counters' },
]
// old ids used by earlier workouts still work
const ALIAS: Record<string, string> = { lhook:'lead-hook', rhook:'rear-hook', upper:'rear-uppercut', slipL:'slip-left', slipR:'slip-right', roll:'roll-right', step:'forward-step' }
const BY_ID = new Map(MOVEMENTS.map(m => [m.id, m]))
export const getMovement = (id: string): Movement | undefined => BY_ID.get(id) ?? BY_ID.get(ALIAS[id])
// Spoken names come from here: `say` on a movement wins, then SAY below, then the display name cleaned up for speech.
// New movements are spoken automatically; add a `say` only when the display name is not how a coach would call it.
const SAY: Record<string, string> = { 'lead-hook':'Left hook', 'rear-hook':'Right hook', 'lead-uppercut':'Left uppercut', 'rear-uppercut':'Right uppercut', 'lead-overhand':'Left overhand', 'body-hook':'Left body hook', 'rear-body-hook':'Right body hook', 'shovel-hook':'Left shovel hook', 'rear-shovel-hook':'Right shovel hook', 'check-hook':'Check hook', 'parry-lead':'Parry left', 'parry-rear':'Parry right', 'block-high':'Block high', 'block-body':'Block body', 'bob-weave':'Bob and weave', 'guard':'Guard up', 'peek-a-boo':'Peek a boo', 'l-step':'L step', 'v-step':'V step', 'switch-step':'Switch', 'forward-step':'Step forward', 'backward-step':'Step back', 'lunge-step':'Lunge', 'elbow-block':'Elbow check', 'superman-punch':'Superman' }
export const spokenName = (id: string): string => { const m = getMovement(id); if (!m) return id.replace(/[-_]/g, ' ')
  return m.say ?? SAY[m.id] ?? m.name.replace(/\(([^)]*)\)/g, '$1').replace(/[-/]/g, ' ').replace(/\s+/g, ' ').trim() }
// seconds after the movement starts when the punch lands (end of the strike, before the final hold)
export const impactAt = (m: Movement) => m.phases.length > 1 ? m.duration - m.phases[m.phases.length - 1].d : m.duration * .6
export const moveName = (id: string) => (getMovement(id)?.name ?? id).toUpperCase()
export function registerMovement(m: Movement) { MOVEMENTS.push(m); BY_ID.set(m.id, m) } // add movements at runtime
// closest simple pose for the 2D fallback boxer
export function to2D(id: string) {
  const i = getMovement(id)?.id ?? id
  if (/slip-left/.test(i)) return 'slipL'; if (/slip-right/.test(i)) return 'slipR'
  if (/duck|bob|roll|cover|block-high/.test(i)) return 'duck'; if (/uppercut|bolo/.test(i)) return 'upper'
  if (/rear-hook|overhand/.test(i)) return 'rhook'; if (/hook/.test(i)) return 'lhook'
  if (/cross|superman/.test(i)) return 'cross'; if (/jab/.test(i)) return 'jab'
  if (/step|pivot|shuffle|bounce|exit|lunge/.test(i)) return 'step'; return 'guard'
}
