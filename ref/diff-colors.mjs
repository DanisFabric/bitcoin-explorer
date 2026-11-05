import { PNG } from 'pngjs'
import fs from 'node:fs'

function load(p) { return PNG.sync.read(fs.readFileSync(p)) }

function regionAvg(png, x, y, w, h) {
  let r = 0, g = 0, b = 0, n = 0
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) {
      const i = (yy * png.width + xx) << 2
      r += png.data[i]; g += png.data[i + 1]; b += png.data[i + 2]; n++
    }
  }
  return [Math.round(r / n), Math.round(g / n), Math.round(b / n)]
}

const hex = (c) => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('')
const dist = (a, b) => Math.round(Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]))

function compare(refP, myP, regions, label) {
  const ref = load(refP), mine = load(myP)
  console.log(`\n=== ${label} ===  (ref ${ref.width}x${ref.height} | mine ${mine.width}x${mine.height})`)
  for (const [name, x, y, w, h] of regions) {
    const a = regionAvg(ref, x, y, w, h)
    const b = regionAvg(mine, x, y, w, h)
    console.log(`${name.padEnd(16)} ref ${hex(a).padEnd(8)} mine ${hex(b).padEnd(8)} Δ${dist(a, b)}`)
  }
}

const LIGHT = [
  ['page-bg', 6, 700, 6, 6],
  ['topbar-bg', 700, 30, 60, 20],
  ['sidebar-fill', 200, 420, 40, 30],
  ['sim-fill', 560, 180, 60, 40],
  ['right-fill', 1220, 180, 40, 30],
  ['sidebar-head', 200, 82, 40, 14],
]

const DARK = [
  ['page-bg', 6, 700, 6, 6],
  ['topbar-bg', 700, 30, 60, 20],
  ['sidebar-fill', 200, 420, 40, 30],
  ['sim-fill', 560, 180, 60, 40],
  ['right-fill', 1220, 180, 40, 30],
]

compare('ref/shots/01-home.png', 'app-shots/01-desktop-light.png', LIGHT, 'LIGHT theme')
compare('ref/shots/08-dark.png', 'app-shots/07-desktop-dark.png', DARK, 'DARK theme')
