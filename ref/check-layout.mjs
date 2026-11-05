import { chromium } from 'playwright-core'

const b = await chromium.launch({ channel: 'chrome', headless: true })
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
const errs = []
p.on('pageerror', (e) => errs.push(e.message))
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
await p.goto('http://localhost:5180/', { waitUntil: 'networkidle' })
await p.waitForTimeout(600)
const r = await p.evaluate(() => {
  const f = (s) => { const el = document.querySelector(s); if (!el) return null; const b = el.getBoundingClientRect(); return { x: +b.x.toFixed(1), y: +b.y.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1) } }
  return {
    topbar: f('.topbar'),
    sidebar: f('.sidebar'),
    rightArea: f('.right-area'),
    topRow: f('.top-row'),
    simulation: f('.simulation'),
    right: f('.right'),
    flow: f('.flow'),
    bodyOverflowX: document.body.scrollWidth > document.body.clientWidth + 1,
    font: getComputedStyle(document.body).fontFamily.split(',')[0],
  }
})
console.log(JSON.stringify(r, null, 2))
if (errs.length) console.log('ERRORS', JSON.stringify(errs))
await b.close()
