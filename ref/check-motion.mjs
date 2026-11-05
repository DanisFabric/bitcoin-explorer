import { chromium } from 'playwright-core'

const b = await chromium.launch({ channel: 'chrome', headless: true })
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
const errs = []
p.on('pageerror', (e) => errs.push(e.message))
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
await p.goto('http://localhost:5180/', { waitUntil: 'networkidle' })
await p.waitForTimeout(600)

const r = await p.evaluate(() => {
  const cs = (s) => { const el = document.querySelector(s); if (!el) return null; const c = getComputedStyle(el); return c.animationName + '|' + c.animationDelay + '|' + c.animationDuration }
  const tr = (s, prop) => { const el = document.querySelector(s); if (!el) return null; return getComputedStyle(el).transitionProperty }
  return {
    playPauseShapeTransition: tr('.icon-playpause .pp-play', 'scale'),
    themeToggleTransition: tr('.toggle-icon .tg-shape', 'rotate'),
    stepAnim: cs('.step'),
    stepNumAfterAnim: (() => { const el = document.querySelector('.step.on .step-num'); if (!el) return null; const c = getComputedStyle(el, '::after'); return c.animationName + '|' + c.animationDuration })(),
    viewIndicatorTransition: tr('.view-indicator', 'left'),
    viewIndicatorLeft: (() => { const el = document.querySelector('.view-indicator'); if (!el) return null; return getComputedStyle(el).left })(),
  }
})
console.log(JSON.stringify(r, null, 2))

// switch to sequence to confirm indicator moves
await p.locator('.view-tab').nth(1).click()
await p.waitForTimeout(600)
const after = await p.evaluate(() => {
  const el = document.querySelector('.view-indicator'); if (!el) return null; return getComputedStyle(el).left
})
console.log('viewIndicator after sequence click:', after)
if (errs.length) console.log('ERRORS', JSON.stringify(errs))
await b.close()
