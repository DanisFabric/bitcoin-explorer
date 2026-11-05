import { chromium } from 'playwright-core'

const REF = 'https://protocol-explorer-alpha.vercel.app/'

const b = await chromium.launch({ channel: 'chrome', headless: true })
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
const p = await ctx.newPage()
await p.goto(REF, { waitUntil: 'networkidle' })
await p.waitForTimeout(2500)

const ref = await p.evaluate(() => {
  const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { x: +b.x.toFixed(1), y: +b.y.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1), cls: (el.className || '').toString().slice(0, 40) } }
  const body = getComputedStyle(document.body)
  return {
    font: body.fontFamily.split(',')[0],
    fontSize: body.fontSize,
    bg: body.backgroundColor,
    // collect large top-level blocks for structure detection
    blocks: [...document.querySelectorAll('body > * > *')].slice(0, 40).map(r).filter(Boolean),
    headers: [...document.querySelectorAll('header')].map(r),
    asides: [...document.querySelectorAll('aside')].map(r),
    mains: [...document.querySelectorAll('main')].map(r),
    sections: [...document.querySelectorAll('section')].map(r),
  }
})
console.log(JSON.stringify(ref, null, 2))
await b.close()
