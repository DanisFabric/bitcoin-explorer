import { chromium } from 'playwright-core'
import fs from 'node:fs'

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()
await page.goto('https://protocol-explorer-alpha.vercel.app/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
const snap = async (name) => { await page.screenshot({ path: `shots/${name}.png` }); fs.writeFileSync(`shots/${name}.txt`, await page.evaluate(() => document.body.innerText)) }

const visibleRows = page.locator('table tbody tr:visible')
console.log('visible rows', await visibleRows.count())
if (await visibleRows.count()) { await visibleRows.nth(2).click(); await page.waitForTimeout(700); await snap('05-row-click') }

// close any dialog
await page.keyboard.press('Escape').catch(()=>{})
await page.waitForTimeout(300)

await page.getByText('SEQUENCE', { exact: true }).click().catch((e) => console.log('seq fail', e.message))
await page.waitForTimeout(800)
await snap('06-sequence')

await page.getByText('NETWORK', { exact: true }).click().catch(() => {})
await page.waitForTimeout(500)

const themeBtns = page.locator('button[aria-label*="theme" i], button[title*="theme" i], header button')
console.log('header buttons', await themeBtns.count())
const labels = await themeBtns.evaluateAll((els) => els.map((e) => ({ t: e.title, a: e.getAttribute('aria-label'), txt: e.textContent?.trim() })))
console.log(labels)
// click last header button (sun/moon)
if (await themeBtns.count()) { await themeBtns.last().click(); await page.waitForTimeout(600); await snap('08-dark') }

const styles = await page.evaluate(() => {
  const out = { vars: {}, elements: {} }
  const cs = getComputedStyle(document.documentElement)
  for (const name of cs) if (name.startsWith('--')) out.vars[name] = cs.getPropertyValue(name).trim()
  const pick = (sel) => {
    const el = document.querySelector(sel); if (!el) return null
    const r = el.getBoundingClientRect(); const s = getComputedStyle(el)
    return { tag: el.tagName, cls: el.className?.toString?.().slice(0, 120), rect: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)], font: s.fontFamily, size: s.fontSize, weight: s.fontWeight, color: s.color, bg: s.backgroundColor, border: s.border, radius: s.borderRadius, letterSpacing: s.letterSpacing, lineHeight: s.lineHeight }
  }
  out.elements.header = pick('header')
  out.elements.app = pick('#app')
  out.elements.asides = [...document.querySelectorAll('aside')].map((_, i) => pick(`aside:nth-of-type(${i + 1})`))
  out.elements.main = pick('main')
  out.elements.h1 = pick('h1')
  out.elements.buttons = [...document.querySelectorAll('button')].slice(0, 12).map((b) => { const s = getComputedStyle(b); return { txt: b.textContent.trim().slice(0, 20), size: s.fontSize, pad: s.padding, border: s.border, radius: s.borderRadius, bg: s.backgroundColor, color: s.color } })
  out.elements.sections = [...document.querySelectorAll('section, [class*="panel"]')].slice(0, 25).map((el) => { const r = el.getBoundingClientRect(); return { cls: String(el.className).slice(0, 80), rect: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)] } })
  return out
})
fs.writeFileSync('shots/styles.json', JSON.stringify(styles, null, 2))
console.log(JSON.stringify(styles.vars, null, 2).slice(0, 4000))
await browser.close()
