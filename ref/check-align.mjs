import { chromium } from 'playwright-core'

const b = await chromium.launch({ channel: 'chrome', headless: true })
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
const errs = []
p.on('pageerror', (e) => errs.push(e.message))
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
await p.goto('http://localhost:5180/', { waitUntil: 'networkidle' })
await p.waitForTimeout(500)

// theme toggle: centers of sun/moon should coincide
const theme = await p.evaluate(() => {
  const tb = document.querySelector('.theme-btn')
  const cs = [...tb.querySelectorAll('svg')].map(s => { const r = s.getBoundingClientRect(); return { cx: +(r.x + r.width / 2).toFixed(1), cy: +(r.y + r.height / 2).toFixed(1), w: +r.width.toFixed(1), op: getComputedStyle(s).opacity } })
  return { btnW: +tb.getBoundingClientRect().width.toFixed(1), display: getComputedStyle(tb).display, icons: cs }
})

// view indicator vs tabs
const tabAlign = async (idx) => {
  return p.evaluate((i) => {
    const tabs = [...document.querySelectorAll('.view-tab')]
    const ind = document.querySelector('.view-indicator')
    const tr = tabs[i].getBoundingClientRect()
    const ir = ind.getBoundingClientRect()
    return { tabIdx: i, tabL: +tr.x.toFixed(1), tabW: +tr.width.toFixed(1), indL: +ir.x.toFixed(1), indW: +ir.width.toFixed(1), dL: +(ir.x - tr.x).toFixed(1), dW: +(ir.width - tr.width).toFixed(1) }
  }, idx)
}
const a0 = await tabAlign(0)
await p.locator('.view-tab').nth(1).click()
await p.waitForTimeout(500)
const a1 = await tabAlign(1)

console.log('THEME', JSON.stringify(theme))
console.log('TAB_NETWORK', JSON.stringify(a0))
console.log('TAB_SEQUENCE', JSON.stringify(a1))
if (errs.length) console.log('ERRORS', JSON.stringify(errs))
await b.close()
