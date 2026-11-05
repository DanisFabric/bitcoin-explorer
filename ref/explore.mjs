import { chromium } from 'playwright-core'
import fs from 'node:fs'

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()
await page.goto('https://protocol-explorer-alpha.vercel.app/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)

const snap = async (name) => {
  await page.screenshot({ path: `shots/${name}.png` })
  fs.writeFileSync(`shots/${name}.txt`, await page.evaluate(() => document.body.innerText))
}

// play
const play = page.locator('button', { hasText: /play/i }).first()
await play.click()
await page.waitForTimeout(700)
await snap('02-playing-a')
await page.waitForTimeout(1200)
await snap('03-playing-b')
await page.waitForTimeout(1400)
await snap('04-playing-c')

// packet row click
const rows = page.locator('table tbody tr')
console.log('rows', await rows.count())
if (await rows.count()) { await rows.first().click(); await page.waitForTimeout(500); await snap('05-row-click') }

// sequence toggle
await page.getByText('SEQUENCE', { exact: true }).click().catch((e) => console.log('seq fail', e.message))
await page.waitForTimeout(600)
await snap('06-sequence')

// network toggle back & step
await page.getByText('NETWORK', { exact: true }).click().catch(() => {})
await page.waitForTimeout(300)

// first step in lesson
const step = page.getByText('CLIENT REQUEST', { exact: false }).first()
await step.click().catch(() => {})
await page.waitForTimeout(600)
await snap('07-step1')

// dark theme
const themeBtn = page.locator('button[aria-label*="theme" i], button[title*="theme" i]').first()
console.log('theme btn count', await page.locator('button[aria-label*="theme" i], button[title*="theme" i]').count())
if (await themeBtn.count()) { await themeBtn.click(); await page.waitForTimeout(600); await snap('08-dark') }
else {
  await page.evaluate(() => { document.documentElement.dataset.theme = 'dark' })
  await page.waitForTimeout(600)
  await snap('08-dark')
}

// layout metrics
const metrics = await page.evaluate(() => {
  const pick = (sel) => { const el = document.querySelector(sel); if (!el) return null; const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return { rect: { x: r.x, y: r.y, w: r.width, h: r.height }, font: s.fontFamily, size: s.fontSize, color: s.color, bg: s.backgroundColor, border: s.border, radius: s.borderRadius } }
  return {
    body: pick('body'), app: pick('#app'), header: pick('header'), aside: pick('aside'), main: pick('main'),
    panels: [...document.querySelectorAll('[class*="panel"], [class*="card"], section')].slice(0, 20).map((el) => ({ cls: el.className?.toString().slice(0, 100), rect: (() => { const r = el.getBoundingClientRect(); return [r.x, r.y, r.width, r.height] })() })),
  }
})
fs.writeFileSync('shots/metrics.json', JSON.stringify(metrics, null, 2))

await browser.close()
console.log('done')
