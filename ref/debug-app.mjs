import { chromium } from 'playwright-core'

const b = await chromium.launch({ channel: 'chrome', headless: true })
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
p.on('console', (m) => console.log('CONSOLE', m.type(), m.text()))
p.on('pageerror', (e) => console.log('PAGEERROR', e.stack))
p.on('response', (r) => { if (r.status() >= 400) console.log('HTTP', r.status(), r.url()) })
await p.goto('http://localhost:5180/', { waitUntil: 'networkidle' })
await p.waitForTimeout(1500)
console.log('BODY:', (await p.evaluate(() => document.body.innerText)).slice(0, 700))
console.log('HTML:', (await p.evaluate(() => document.getElementById('app')?.innerHTML || 'NONE')).slice(0, 700))
await b.close()
