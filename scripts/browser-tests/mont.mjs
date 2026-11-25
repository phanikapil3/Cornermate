import { PNG } from 'pngjs'; import fs from 'fs'
const names = process.argv.slice(3), out = process.argv[2], tiles = names.map(n => PNG.sync.read(fs.readFileSync(`/tmp/${n}.png`)))
const f = +(process.env.F || 2), tw = Math.floor(tiles[0].width / f), th = Math.floor(tiles[0].height / f), cols = +(process.env.COLS || 2), rows = Math.ceil(tiles.length / cols), o = new PNG({ width: tw * cols, height: th * rows })
tiles.forEach((t, k) => { const ox = (k % cols) * tw, oy = Math.floor(k / cols) * th; for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) { const si = ((y * f) * t.width + x * f) * 4, di = ((oy + y) * o.width + ox + x) * 4; for (let c = 0; c < 4; c++) o.data[di + c] = t.data[si + c] } })
fs.writeFileSync(out, PNG.sync.write(o))
