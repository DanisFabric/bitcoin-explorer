import { chromium } from 'playwright-core'

const b = await chromium.launch({ channel: 'chrome', headless: true })

// Simulate a user whose OS is in dark mode; the app must still default to light.
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' })
const p = await ctx.newPage()
await p.goto('http://localhost:5180/', { waitUntil: 'networkidle' })
await p.evaluate(() => localStorage.clear())
await p.reload({ waitUntil: 'networkidle' })
await p.waitForTimeout(400)

const initial = await p.evaluate(() => ({ theme: document.documentElement.dataset.theme, saved: localStorage.getItem('btc-explorer:theme') }))
console.log('default (OS dark):', JSON.stringify(initial))

// Manual toggle to dark -> persists
await p.locator('.theme-btn').click()
await p.waitForTimeout(300)
const toggledDark = await p.evaluate(() => ({ theme: document.documentElement.dataset.theme, saved: localStorage.getItem('btc-explorer:theme') }))
console.log('after toggle dark:', JSON.stringify(toggledDark))

// Reload -> still dark (persisted)
await p.reload({ waitUntil: 'networkidle' })
await p.waitForTimeout(300)
const persisted = await p.evaluate(() => document.documentElement.dataset.theme)
console.log('after reload:', JSON.stringify(persisted))

// Toggle back to light -> persists light
await p.locator('.theme-btn').click()
await p.waitForTimeout(300)
const toggledLight = await p.evaluate(() => ({ theme: document.documentElement.dataset.theme, saved: localStorage.getItem('btc-explorer:theme') }))
console.log('after toggle light:', JSON.stringify(toggledLight))

await b.close()
