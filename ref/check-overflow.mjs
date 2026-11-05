import { chromium } from 'playwright-core'

const b = await chromium.launch({ channel: 'chrome', headless: true })
async function check(name, vp) {
  const p = await (await b.newContext({ viewport: vp })).newPage()
  const errs = []
  p.on('pageerror', (e) => errs.push(e.message))
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
  await p.goto('http://localhost:5180/', { waitUntil: 'networkidle' })
  await p.waitForTimeout(600)
  const r = await p.evaluate(() => {
    const ovf = (s) => { const el = document.querySelector(s); if (!el) return null; return { client: el.clientWidth, scroll: el.scrollWidth, ov: el.scrollWidth > el.clientWidth + 1 } }
    const topbar = document.querySelector('.topbar').getBoundingClientRect()
    const nowLearning = document.querySelector('.now-learning').getBoundingClientRect()
    return {
      bodyOvX: document.body.scrollWidth > document.body.clientWidth + 1,
      topbarH: +topbar.height.toFixed(1),
      nowLearningH: +nowLearning.height.toFixed(1),
      nowLearningFits: nowLearning.bottom <= topbar.bottom + 1,
      sidebarOv: ovf('.chapter-list'),
      rightOv: ovf('.right-body'),
      flowOv: ovf('.flow-table-wrap'),
      topbarOv: ovf('.topbar'),
    }
  })
  console.log(name, JSON.stringify(r))
  if (errs.length) console.log('  ERRORS', JSON.stringify(errs))
  await p.context().close()
}
await check('DESKTOP', { width: 1440, height: 900 })
await check('MOBILE', { width: 390, height: 844 })
await b.close()
