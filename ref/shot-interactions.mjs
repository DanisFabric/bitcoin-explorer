import { chromium } from 'playwright-core'
import fs from 'node:fs'

const url = 'http://localhost:5180/'
const out = 'app-shots'
fs.mkdirSync(out, { recursive: true })

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()
const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message))

await page.goto(url, { waitUntil: 'networkidle' })
await page.waitForTimeout(600)

// Learn overlay via brand click
await page.locator('.brand').click()
await page.waitForTimeout(400)
await page.screenshot({ path: `${out}/23-learn-overlay.png` })
await page.locator('.learn-head button').click()
await page.waitForTimeout(200)

// Play to completion at 2x
await page.locator('.flow-controls .ctl.speed').click() // 0.5 -> wait, initial speed is 1
// ensure speed 2x
const spd = await page.locator('.flow-controls .ctl.speed').innerText()
if (spd.trim() === '1×') { await page.locator('.flow-controls .ctl.speed').click() }
await page.locator('.flow-controls .ctl.primary').click()
await page.waitForTimeout(5200) // total 7.2s at 2x
await page.screenshot({ path: `${out}/24-lesson-complete.png` })

// persistence: reload
await page.reload({ waitUntil: 'networkidle' })
await page.waitForTimeout(600)
const state = await page.evaluate(() => ({
  done: document.querySelectorAll('.chapter-dot.done').length,
  pct: document.querySelector('.progress-pct')?.innerText,
  sidebarDone: [...document.querySelectorAll('.chapter')].filter((c) => c.querySelector('.chapter-dot.done')).map((c) => c.querySelector('.chapter-name strong')?.innerText),
}))
console.log('PERSISTENCE', JSON.stringify(state))

// Hash lab mining
await page.locator('.lab-item').filter({ hasText: 'HASH LAB' }).first().click()
await page.waitForTimeout(500)
await page.locator('.mining-card .mine-actions .ctl.primary').click()
await page.waitForTimeout(4000)
await page.screenshot({ path: `${out}/25-hash-mining.png` })
const mineState = await page.evaluate(() => ({
  found: !!document.querySelector('.found-banner'),
  nonce: document.querySelector('.hf.nonce code')?.innerText,
  hashes: [...document.querySelectorAll('.mine-stats strong')].map((e) => e.innerText),
}))
console.log('MINING', JSON.stringify(mineState))

// Key lab sign
await page.locator('.lab-item').filter({ hasText: 'KEY LAB' }).first().click()
await page.waitForTimeout(400)
await page.locator('.sign-actions .ctl.primary').click()
await page.waitForTimeout(400)
const keyState = await page.evaluate(() => ({
  pill: document.querySelector('.verify-pill')?.innerText,
  sig: document.querySelector('.sig-box code')?.innerText.slice(0, 40),
}))
console.log('KEY', JSON.stringify(keyState))

// UTXO invalid -> valid
await page.locator('.lab-item').filter({ hasText: 'UTXO LAB' }).first().click()
await page.waitForTimeout(400)
const beforeDis = await page.locator('.broadcast').isDisabled()
await page.locator('.coin-row').first().click() // select another coin
await page.waitForTimeout(200)
const afterDis = await page.locator('.broadcast').isDisabled()
console.log('UTXO before/after disabled', beforeDis, afterDis)

// Chinese switch
await page.locator('.lang-btn').click()
await page.locator('.lang-menu button').nth(1).click()
await page.waitForTimeout(400)
await page.screenshot({ path: `${out}/26-chinese-utxo.png` })

fs.writeFileSync(`${out}/errors2.json`, JSON.stringify(errors, null, 2))
console.log('ERRORS', JSON.stringify(errors))
await browser.close()
