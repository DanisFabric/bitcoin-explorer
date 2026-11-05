import { chromium } from 'playwright-core'

const b = await chromium.launch({ channel: 'chrome', headless: true })

function dumpSteps(p) {
  return p.evaluate(() => {
    const chapter = document.querySelector('.chapter')
    const dot = chapter.querySelector('.chapter-dot')
    const check = chapter.querySelector('.chapter-check')
    const steps = [...chapter.querySelectorAll('.step')].map((s) => ({
      cls: s.className,
      num: s.querySelector('.step-num')?.innerText.trim(),
      hasCheck: !!s.querySelector('.step-num .icon'),
    }))
    return { dotCls: dot.className, hasGreenCheck: !!check, steps }
  })
}

// Scenario 1: fresh load (clear storage)
{
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
  await p.goto('http://localhost:5180/', { waitUntil: 'networkidle' })
  await p.evaluate(() => localStorage.clear())
  await p.reload({ waitUntil: 'networkidle' })
  await p.waitForTimeout(400)
  console.log('FRESH:', JSON.stringify(await dumpSteps(p), null, 1))
  await p.context().close()
}

// Scenario 2: click step 2 (index 2)
{
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
  await p.goto('http://localhost:5180/', { waitUntil: 'networkidle' })
  await p.evaluate(() => localStorage.clear())
  await p.reload({ waitUntil: 'networkidle' })
  await p.waitForTimeout(300)
  await p.locator('.step').nth(2).click()
  await p.waitForTimeout(300)
  console.log('AFTER STEP2 CLICK:', JSON.stringify(await dumpSteps(p), null, 1))
  await p.context().close()
}

// Scenario 3: play to completion
{
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
  await p.goto('http://localhost:5180/', { waitUntil: 'networkidle' })
  await p.evaluate(() => localStorage.clear())
  await p.reload({ waitUntil: 'networkidle' })
  await p.waitForTimeout(300)
  // speed to 2x then play to end
  await p.locator('.flow-controls .ctl.speed').click()
  if ((await p.locator('.flow-controls .ctl.speed').innerText()).trim() === '1×') await p.locator('.flow-controls .ctl.speed').click()
  await p.locator('.flow-controls .ctl.primary').click()
  await p.waitForTimeout(5200)
  console.log('AFTER COMPLETE:', JSON.stringify(await dumpSteps(p), null, 1))
  await p.context().close()
}

await b.close()
