import chromium from '@sparticuz/chromium'; import puppeteer from 'puppeteer-core'; import { PNG } from 'pngjs'; import fs from 'fs'
chromium.setGraphicsMode = true; const sleep = ms => new Promise(r => setTimeout(r, ms)); const mode = process.argv[2], IDS = JSON.parse(fs.readFileSync('/tmp/ids.json'))
if (mode === 'capture') {
  const [f, t] = process.argv[3].split('-').map(Number)
  const browser = await puppeteer.launch({ args: [...chromium.args, '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'], executablePath: await chromium.executablePath(), headless: 'shell' })
  const page = await browser.newPage(); await page.setViewport({ width: 520, height: 900 }); const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 150)))
  await page.evaluateOnNewDocument(() => localStorage.setItem('cornermate-v1', JSON.stringify({ profile: { name: 'T', age: '25', experience: 'None', fitness: 'Medium', goal: 'x', duration: '30 min', days: '3', equipment: 'None' }, sessions: [], sound: false, notifications: false, voice: false, sfx: false, volume: .8, voiceName: '', custom: [] })))
  await page.goto('http://127.0.0.1:5173/library', { waitUntil: 'networkidle0' }); await sleep(3500)
  const out = {}; await page.evaluate(() => { window.__coachFreeze = true; const p = window.__coachPlayer; p.load(['guard']); p.seek(p.length); window.__G = { ...p.cur } })
  const clip = async name => { const r = await page.evaluate(() => { const b = document.querySelector('canvas').getBoundingClientRect(); return { x: b.x, y: b.y, width: b.width, height: b.height } }); fs.writeFileSync(`/tmp/AP_${name}.png`, await page.screenshot({ clip: r })) }
  for (const { id } of IDS.slice(f, t)) {
    const info = await page.evaluate(id => { const p = window.__coachPlayer, G = window.__G; p.cur = { ...G }; p.currentId = 'guard'; p.load([id]); const len = p.length; let best = 0, bf = 0; for (let k = 0; k <= 100; k++) { p.seek(len * k / 100); let d = 0; for (const key in G) d += Math.abs(p.cur[key] - G[key]); if (d > best) { best = d; bf = k / 100 } } p.seek(len * bf); window.__coachCtl.az = 0; window.__coachCtl.azTo = null; return { bf, dev: best, len } }, id)
    await sleep(650); await clip(`${id}_front`)
    await page.evaluate(() => { window.__coachCtl.az = Math.PI / 2 }); await sleep(650); await clip(`${id}_side`); out[id] = info }
  fs.writeFileSync(`/tmp/AP_info_${f}.json`, JSON.stringify(out)); console.log(`captured ${f}-${t}`, errs.length ? errs.join('|') : 'no errors'); await browser.close() }
if (mode === 'analyze') {
  const L = (id, v) => PNG.sync.read(fs.readFileSync(`/tmp/AP_${id}_${v}.png`)), df = (a, b) => { let d = 0; for (let i = 0; i < a.data.length; i += 4) d += Math.abs(a.data[i] - b.data[i]) + Math.abs(a.data[i + 1] - b.data[i + 1]); return d / (a.data.length / 4) }
  const im = Object.fromEntries(IDS.map(m => [m.id, [L(m.id, 'front'), L(m.id, 'side')]])), info = {}; for (const f of [0, 11, 22, 33, 44, 55]) Object.assign(info, JSON.parse(fs.readFileSync(`/tmp/AP_info_${f}.json`)))
  const gref = im['guard'], vsG = IDS.map(m => ({ id: m.id, d: df(im[m.id][0], gref[0]) + df(im[m.id][1], gref[1]), dev: info[m.id].dev, bf: info[m.id].bf }))
  console.log(`captured ${IDS.length} movements x 2 views (front + left side) at each movement's peak pose`); const same = vsG.filter(x => x.id !== 'guard' && x.d < 1.5)
  console.log(`movements whose peak pose looks the same as plain guard (combined front+side diff < 1.5): ${same.length}` + (same.length ? ' -> ' + same.map(x => `${x.id}(${x.d.toFixed(1)})`).join(', ') : ''))
  const pairs = []; for (let i = 0; i < IDS.length; i++) for (let j = i + 1; j < IDS.length; j++) pairs.push([df(im[IDS[i].id][0], im[IDS[j].id][0]) + df(im[IDS[i].id][1], im[IDS[j].id][1]), IDS[i].id, IDS[j].id]); pairs.sort((a, b) => a[0] - b[0])
  console.log('closest-looking pairs (combined front+side difference; smaller = more alike):'); pairs.slice(0, 10).forEach(p => console.log(`   ${p[1]} vs ${p[2]}: ${p[0].toFixed(1)}`)); const near = pairs.filter(p => p[0] < 1.5)
  console.log(`pairs that look virtually identical (< 1.5): ${near.length}`); console.log(`weakest movements vs guard: ` + [...vsG].sort((a, b) => a.d - b.d).slice(0, 8).map(x => `${x.id}(${x.d.toFixed(1)})`).join(', '))
  fs.writeFileSync('/tmp/AP_summary.json', JSON.stringify({ vsG, pairs: pairs.slice(0, 40) })) }
