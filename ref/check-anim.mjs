import { chromium } from 'playwright-core'

const b = await chromium.launch({ channel: 'chrome', headless: true })
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
const errs = []
p.on('pageerror', (e) => errs.push(e.message))
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
await p.goto('http://localhost:5180/', { waitUntil: 'networkidle' })
await p.waitForTimeout(500)

// check animations on sequence lifeline + progress partial (need to click sequence + start a chapter in-progress)
const scene = await p.evaluate(() => {
  const anim = (s) => { const el = document.querySelector(s); if (!el) return null; const c = getComputedStyle(el); return c.animationName !== 'none' ? c.animationName + ' ' + c.animationDuration : 'none' }
  return {
    lifelineAnim: null,
    statusDotAnim: anim('.status-pill i'),
  }
})
// open sequence view to check lifeline
await p.locator('.view-tab').nth(1).click()
await p.waitForTimeout(300)
const lifelineAnim = await p.evaluate(() => { const el = document.querySelector('.lifeline'); const c = getComputedStyle(el); return c.animationName !== 'none' ? c.animationName + ' ' + c.animationDuration : 'none' })
// mark a chapter in-progress to check progress sheen
await p.locator('.view-tab').nth(0).click()
await p.locator('.flow-controls .ctl.primary').click()
await p.waitForTimeout(400)
await p.locator('.flow-controls .ctl.primary').click()
const progressAnim = await p.evaluate(() => { const el = document.querySelector('.progress-bar i.partial'); if (!el) return '(no partial segment)'; const c = getComputedStyle(el); return c.animationName + ' ' + c.animationDuration })

console.log(JSON.stringify({ ...scene, lifelineAnim, progressAnim }, null, 2))
if (errs.length) console.log('ERRORS', JSON.stringify(errs))
await b.close()
