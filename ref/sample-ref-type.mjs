import { chromium } from 'playwright-core'

const REF = 'https://protocol-explorer-alpha.vercel.app/'
const b = await chromium.launch({ channel: 'chrome', headless: true })
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
const p = await ctx.newPage()
await p.goto(REF, { waitUntil: 'networkidle' })
await p.waitForTimeout(2500)

const sample = await p.evaluate(() => {
  const byText = (t) => [...document.querySelectorAll('*')].find((e) => e.children.length === 0 && e.textContent.trim() === t)
  const info = (el) => { if (!el) return null; const c = getComputedStyle(el); return { text: el.textContent.trim().slice(0, 30), font: c.fontSize, weight: c.fontWeight, ls: c.letterSpacing, fg: c.color } }
  const find = (t) => [...document.querySelectorAll('*')].filter((e) => e.children.length === 0 && e.textContent.trim().startsWith(t))[0]
  return {
    brand: info(find('PROTOCOL EXPLORER')),
    tagline: info(find('LEARN HOW THE INTERNET WORKS')),
    nowLearningLabel: info(find('NOW LEARNING')),
    chapterName: info(find('HTTP')),
    chapterSub: info(find('Hypertext Transfer Protocol')),
    panelTitle: info(find('INTERNET PROTOCOLS')),
    overviewName: info(find('ACTIVE')),
    sidebarStep: info(find('CLIENT REQUEST')),
    tableInfo: info(find('Standard query A')),
  }
})
console.log(JSON.stringify(sample, null, 2))
await b.close()
