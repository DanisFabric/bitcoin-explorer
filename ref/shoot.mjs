import { chromium } from 'playwright-core'
import fs from 'node:fs'

const url = 'https://protocol-explorer-alpha.vercel.app/'
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
const page = await ctx.newPage()
await page.goto(url, { waitUntil: 'networkidle' })
await page.waitForTimeout(2500)
await page.screenshot({ path: 'shots/01-home.png' })
await page.screenshot({ path: 'shots/01-home-full.png', fullPage: true })

const info = await page.evaluate(() => {
  const txt = (el) => (el?.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 300)
  return {
    title: document.title,
    bodyText: document.body.innerText.slice(0, 4000),
    buttons: [...document.querySelectorAll('button,a')].slice(0, 60).map((b) => txt(b)),
    landmarks: [...document.querySelectorAll('header,nav,main,section,aside,footer,svg')].slice(0, 60).map((el) => ({ tag: el.tagName, cls: el.className?.toString?.().slice(0, 120), txt: txt(el).slice(0, 80) })),
    html: document.body.innerHTML.slice(0, 20000),
  }
})
fs.writeFileSync('shots/info.json', JSON.stringify(info, null, 2))

// click first lesson-ish card
const candidates = await page.$$('button, a')
console.log('clickable', candidates.length)
await browser.close()
console.log(info.bodyText.slice(0, 2000))
