import { chromium } from 'playwright-core'

const b = await chromium.launch({ channel: 'chrome', headless: true })
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
const errs = []
p.on('pageerror', (e) => errs.push(e.message))
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
await p.goto('http://localhost:5180/', { waitUntil: 'networkidle' })
await p.waitForTimeout(700)
const r = await p.evaluate(() => {
  const fs = (s) => { const el = document.querySelector(s); if (!el) return null; const r = el.getBoundingClientRect(); return { w: +r.width.toFixed(1), h: +r.height.toFixed(1) } }
  const font = getComputedStyle(document.body).fontFamily.split(',')[0]
  const loaded = [...document.fonts].some((f) => f.family.includes('Iosevka') && f.status === 'loaded')
  return {
    bodyFont: font,
    iosevkaLoaded: loaded,
    bodyOverflowX: document.body.scrollWidth > document.body.clientWidth + 1,
    sidebar: fs('.sidebar'), simulation: fs('.simulation'), flow: fs('.flow'), right: fs('.right'), topbar: fs('.topbar'),
    nowTitleClipped: (() => { const t = document.querySelector('.now-title'); return t.scrollWidth > t.clientWidth + 1 })(),
  }
})
console.log(JSON.stringify(r, null, 2))
if (errs.length) console.log('ERRORS', JSON.stringify(errs))
await b.close()
