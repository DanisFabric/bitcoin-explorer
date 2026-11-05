import { chromium } from 'playwright-core'

const url = 'http://localhost:5180/'
const browser = await chromium.launch({ channel: 'chrome', headless: true })

async function check(name, viewport, fn) {
  const ctx = await browser.newContext({ viewport })
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(700)
  const r = await fn(page)
  console.log(`\n=== ${name} ===`)
  console.log(JSON.stringify(r, null, 2))
  if (errors.length) console.log('ERRORS', JSON.stringify(errors))
  await ctx.close()
}

await check('DESKTOP overflow + node font', { width: 1440, height: 900 }, async (page) => {
  const labs = await page.evaluate(() => {
    const list = document.querySelectorAll('.lab-item')
    const sidebar = document.querySelector('.sidebar').getBoundingClientRect()
    const last = list[list.length - 1].getBoundingClientRect()
    const name = getComputedStyle(document.querySelector('.node-name')).fontSize
    return {
      labCount: list.length,
      lastLabBottom: +last.bottom.toFixed(1),
      sidebarBottom: +sidebar.bottom.toFixed(1),
      lastLabFullyVisible: last.bottom <= sidebar.bottom - 2,
      nodeNameFont: name,
      bodyOverflowX: document.body.scrollWidth > document.body.clientWidth + 1,
    }
  })
  const rightDone = null
  return { ...labs }
})

await check('DONE summary text', { width: 1440, height: 900 }, async (page) => {
  await page.locator('.flow-controls .ctl.speed').click()
  if ((await page.locator('.flow-controls .ctl.speed').innerText()).trim() === '1×') await page.locator('.flow-controls .ctl.speed').click()
  await page.locator('.flow-controls .ctl.primary').click()
  await page.waitForTimeout(5200)
  return page.evaluate(() => ({
    panelTitle: document.querySelector('.right-head .panel-title')?.innerText,
    body: document.querySelector('.right-body')?.innerText.replace(/\s+/g, ' ').slice(0, 500),
    hasReplay: !!document.querySelector('.start-btn.replay'),
    hasDoneMark: !!document.querySelector('.done-mark'),
  }))
})

await check('INSPECTOR hex fits', { width: 1440, height: 900 }, async (page) => {
  await page.locator('.flow-table tbody tr').nth(0).click()
  await page.waitForTimeout(400)
  return page.evaluate(() => {
    const hd = document.querySelector('.hexdump')
    const bytes = document.querySelector('.hex-bytes')
    return {
      hexdumpClient: hd.clientWidth,
      hexdumpScroll: hd.scrollWidth,
      fits: hd.scrollWidth <= hd.clientWidth + 2,
      bytesWide: bytes.scrollWidth,
      tabsOverlapHead: (() => {
        const t = document.querySelector('.view-tabs').getBoundingClientRect()
        const h = document.querySelector('.inspect-head').getBoundingClientRect()
        return t.bottom > h.top + 1
      })(),
    }
  })
})

await check('MOBILE overflow', { width: 390, height: 844 }, async (page) => {
  return page.evaluate(() => ({
    bodyOverflowX: document.body.scrollWidth > document.body.clientWidth + 1,
    flowWrapScroll: (() => { const w = document.querySelector('.flow-table-wrap'); return w.scrollWidth > w.clientWidth + 1 })(),
    mobileControlsVisible: getComputedStyle(document.querySelector('.mobile-controls')).display !== 'none',
    fromColHidden: getComputedStyle(document.querySelector('.flow-table th.c-from')).display === 'none',
  }))
})

await browser.close()
