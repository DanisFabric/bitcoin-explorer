import { chromium } from 'playwright-core'
import fs from 'node:fs'

const url = 'http://localhost:5180/'
const out = 'app-shots'
fs.mkdirSync(out, { recursive: true })

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
const page = await ctx.newPage()

const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message))
page.on('response', (r) => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`) })

await page.goto(url, { waitUntil: 'networkidle' })
await page.waitForTimeout(800)
await page.screenshot({ path: `${out}/01-desktop-light.png` })

// metrics
const metrics = await page.evaluate(() => {
  const q = (s) => {
    const el = document.querySelector(s)
    if (!el) return null
    const r = el.getBoundingClientRect()
    const cs = getComputedStyle(el)
    return { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1), font: cs.fontSize, bg: cs.backgroundColor, color: cs.color, border: cs.borderColor, overflow: cs.overflow }
  }
  return {
    topbar: q('.topbar'),
    workspace: q('.workspace'),
    sidebar: q('.sidebar'),
    simulation: q('.simulation'),
    flow: q('.flow'),
    right: q('.right'),
    title: document.title,
    scroll: { body: document.body.scrollHeight, vh: innerHeight },
    counts: {
      chapters: document.querySelectorAll('.chapter').length,
      events: document.querySelectorAll('.flow-table tbody tr').length,
      nodes: document.querySelectorAll('.node').length,
    },
  }
})
fs.writeFileSync(`${out}/metrics.json`, JSON.stringify(metrics, null, 2))

// Play walkthrough
await page.locator('.flow-controls .ctl.primary').click()
await page.waitForTimeout(2200)
await page.screenshot({ path: `${out}/02-desktop-playing.png` })

// Step into step detail
await page.locator('.step').nth(2).click()
await page.waitForTimeout(700)
await page.screenshot({ path: `${out}/03-step-detail.png` })

// Open inspector from event table
await page.locator('.flow-table tbody tr').nth(3).click()
await page.waitForTimeout(500)
await page.screenshot({ path: `${out}/04-inspector.png` })

// Hex field highlight
const field = page.locator('.field').nth(3)
if (await field.count()) {
  await field.click()
  await page.waitForTimeout(300)
  await page.screenshot({ path: `${out}/05-inspector-field.png` })
}
await page.locator('.inspect-nav button').last().click()
await page.waitForTimeout(300)

// Sequence
await page.locator('.view-tab').nth(1).click()
await page.waitForTimeout(500)
await page.screenshot({ path: `${out}/06-sequence.png` })

// Dark theme
await page.locator('.theme-btn').click()
await page.waitForTimeout(500)
await page.screenshot({ path: `${out}/07-desktop-dark.png` })

// Chinese
await page.locator('.lang-btn').click()
await page.waitForTimeout(150)
await page.locator('.lang-menu button').nth(1).click()
await page.waitForTimeout(500)
await page.screenshot({ path: `${out}/08-chinese.png` })

// Back to light + english for labs
await page.locator('.theme-btn').click()
await page.locator('.lang-btn').click()
await page.locator('.lang-menu button').first().click()
await page.waitForTimeout(300)

async function openLab(name) {
  await page.locator('.lab-item').filter({ hasText: name }).first().click()
  await page.waitForTimeout(900)
}

await openLab('HASH LAB')
await page.screenshot({ path: `${out}/09-hash-lab.png` })

await openLab('MERKLE LAB')
await page.screenshot({ path: `${out}/10-merkle-lab.png` })
await page.locator('.tree-node.leaf').nth(2).click()
await page.locator('.lab-topactions .ctl').first().click()
await page.waitForTimeout(500)
await page.screenshot({ path: `${out}/11-merkle-tamper.png` })

await openLab('KEY LAB')
await page.screenshot({ path: `${out}/12-key-lab.png` })
await page.locator('.sign-actions .ctl.primary').click()
await page.waitForTimeout(500)
await page.screenshot({ path: `${out}/13-key-signed.png` })

await openLab('UTXO LAB')
await page.screenshot({ path: `${out}/14-utxo-lab.png` })
await page.locator('.build-card .broadcast').click()
await page.waitForTimeout(500)
await page.screenshot({ path: `${out}/15-utxo-broadcast.png` })

await openLab('DIFFICULTY')
await page.screenshot({ path: `${out}/16-difficulty.png` })
const chart = await page.locator('.chart-svg').boundingBox()
if (chart) {
  await page.mouse.move(chart.x + chart.width * 0.55, chart.y + chart.height * 0.5)
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${out}/17-difficulty-hover.png` })
}

// Mobile
const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
const m = await mctx.newPage()
m.on('console', (msg) => { if (msg.type() === 'error') errors.push('MOBILE ' + msg.text()) })
m.on('pageerror', (e) => errors.push('MOBILE PAGEERROR ' + e.message))
await m.goto(url, { waitUntil: 'networkidle' })
await m.waitForTimeout(700)
await m.screenshot({ path: `${out}/18-mobile.png` })
await m.evaluate(() => window.scrollTo(0, 520))
await m.waitForTimeout(300)
await m.screenshot({ path: `${out}/19-mobile-scroll.png` })
await m.evaluate(() => window.scrollTo(0, 0))
await m.locator('.menu-btn').click()
await m.waitForTimeout(500)
await m.screenshot({ path: `${out}/20-mobile-drawer.png` })
await m.locator('.drawer-scrim').click({ position: { x: 360, y: 300 } })
await m.waitForTimeout(350)
await m.locator('.mobile-controls .ctl.primary').click()
await m.waitForTimeout(1500)
await m.screenshot({ path: `${out}/21-mobile-playing.png` })

// mobile lab
await m.locator('.menu-btn').click()
await m.waitForTimeout(350)
await m.locator('.lab-item').filter({ hasText: 'HASH LAB' }).first().click()
await m.waitForTimeout(800)
await m.evaluate(() => window.scrollTo(0, 0))
await m.screenshot({ path: `${out}/22-mobile-lab.png` })

fs.writeFileSync(`${out}/errors.json`, JSON.stringify(errors, null, 2))
console.log(JSON.stringify({ metrics, errors }, null, 2))

await browser.close()
