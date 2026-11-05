import { chromium } from 'playwright-core'

const b = await chromium.launch({ channel: 'chrome', headless: true })

async function page(viewport) {
  const ctx = await b.newContext({ viewport })
  const p = await ctx.newPage()
  const errs = []
  p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message))
  p.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()) })
  p.on('response', (r) => { if (r.status() >= 400) errs.push('HTTP ' + r.status() + ' ' + r.url()) })
  await p.goto('http://localhost:5180/', { waitUntil: 'networkidle' })
  await p.waitForTimeout(500)
  return { p, ctx, errs }
}

function fmt(r) { return JSON.stringify(r) }

// ---------- DESKTOP: layout + theme toggle ----------
{
  const { p, ctx, errs } = await page({ width: 1440, height: 900 })
  const r = await p.evaluate(() => {
    const bb = (s) => { const el = document.querySelector(s); if (!el) return null; const r = el.getBoundingClientRect(); return { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) } }
    // theme button icons overlap?
    const tb = document.querySelector('.theme-btn')
    const icons = [...tb.querySelectorAll('svg')].map(s => { const r = s.getBoundingClientRect(); return { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1), op: getComputedStyle(s).opacity } })
    const overlap = icons.length === 2 && Math.abs(icons[0].x - icons[1].x) < 2 && Math.abs(icons[0].y - icons[1].y) < 2
    return {
      themeBtnDisplay: getComputedStyle(tb).display,
      themeBtnW: bb('.theme-btn').w,
      themeBtnH: bb('.theme-btn').h,
      icons, iconsOverlap: overlap,
      bodyOvX: document.body.scrollWidth > document.body.clientWidth + 1,
      topbar: bb('.topbar'), sidebar: bb('.sidebar'), sim: bb('.simulation'), right: bb('.right'), flow: bb('.flow'),
      viewIndicator: (() => { const el = document.querySelector('.view-indicator'); if (!el) return null; const r = el.getBoundingClientRect(); const t = document.querySelector('.view-tabs').getBoundingClientRect(); return { x: +r.x.toFixed(1), w: +r.width.toFixed(1), tabW: +t.width.toFixed(1) } })(),
    }
  })
  console.log('DESKTOP', fmt(r))
  if (errs.length) console.log('  ERR', fmt(errs))
  await ctx.close()
}

// ---------- interactions: theme, lang, playback, sequence, inspector ----------
{
  const { p, ctx, errs } = await page({ width: 1440, height: 900 })
  // theme toggle
  await p.locator('.theme-btn').click()
  const theme = await p.evaluate(() => document.documentElement.dataset.theme)
  // lang
  await p.locator('.lang-btn').click()
  await p.locator('.lang-menu button').nth(1).click()
  const lang = await p.evaluate(() => document.documentElement.lang)
  // back to en/light
  await p.locator('.theme-btn').click()
  await p.locator('.lang-btn').click()
  await p.locator('.lang-menu button').first().click()
  // play
  await p.locator('.flow-controls .ctl.primary').click()
  await p.waitForTimeout(300)
  const playing = await p.evaluate(() => !!document.querySelector('.icon-playpause.is-playing'))
  // step
  await p.locator('.flow-controls .ctl.primary').click() // pause
  await p.locator('.flow-controls .ctl').filter({ hasText: 'STEP' }).click()
  // inspector
  await p.locator('.flow-table tbody tr').nth(1).click()
  await p.waitForTimeout(200)
  const inspectorOpen = await p.evaluate(() => !!document.querySelector('.inspector'))
  await p.locator('.inspect-nav button').last().click()
  // sequence
  await p.locator('.view-tab').nth(1).click()
  await p.waitForTimeout(200)
  const seqVisible = await p.evaluate(() => !!document.querySelector('.sequence'))
  const indRight = await p.evaluate(() => { const el = document.querySelector('.view-indicator'); return getComputedStyle(el).left })
  console.log('INTERACTIONS', fmt({ theme, lang, playing, inspectorOpen, seqVisible, viewIndicatorLeft: indRight }))
  if (errs.length) console.log('  ERR', fmt(errs))
  await ctx.close()
}

// ---------- labs all render ----------
{
  const { p, ctx, errs } = await page({ width: 1440, height: 900 })
  const labs = ['HASH LAB', 'MERKLE LAB', 'KEY LAB', 'UTXO LAB', 'DIFFICULTY']
  const out = {}
  for (const l of labs) {
    await p.locator('.lab-item').filter({ hasText: l }).first().click()
    await p.waitForTimeout(250)
    out[l] = await p.evaluate(() => ({ hasLab: !!document.querySelector('.lab'), bodyOvX: document.body.scrollWidth > document.body.clientWidth + 1 }))
  }
  console.log('LABS', fmt(out))
  if (errs.length) console.log('  ERR', fmt(errs))
  await ctx.close()
}

// ---------- mobile ----------
{
  const { p, ctx, errs } = await page({ width: 390, height: 844 })
  const r = await p.evaluate(() => ({
    bodyOvX: document.body.scrollWidth > document.body.clientWidth + 1,
    mobileControls: getComputedStyle(document.querySelector('.mobile-controls')).display,
    themeBtnIconsOverlap: (() => { const tb = document.querySelector('.theme-btn'); const i = [...tb.querySelectorAll('svg')].map(s => s.getBoundingClientRect()); return i.length === 2 && Math.abs(i[0].x - i[1].x) < 2 })(),
  }))
  // drawer
  await p.locator('.menu-btn').click()
  await p.waitForTimeout(400)
  const drawerOpen = await p.evaluate(() => document.querySelector('.sidebar').classList.contains('open'))
  console.log('MOBILE', fmt({ ...r, drawerOpen }))
  if (errs.length) console.log('  ERR', fmt(errs))
  await ctx.close()
}

await b.close()
