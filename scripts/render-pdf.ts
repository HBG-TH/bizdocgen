import { chromium } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function getArg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag)
  return i !== -1 ? process.argv[i + 1] : undefined
}

const input = getArg('--input')
const output = getArg('--output')
const baseUrl = getArg('--url') ?? 'http://localhost:5174'

if (!input || !output) {
  console.error('Usage: pnpm render --input <record.json> --output <out.pdf> [--url <base-url>]')
  process.exit(1)
}

const recordData: unknown = JSON.parse(readFileSync(resolve(input), 'utf-8'))

const browser = await chromium.launch()
try {
  const page = await browser.newPage()

  await page.goto(`${baseUrl}/?mode=headless`, { waitUntil: 'networkidle' })

  await page.evaluate((record) => {
    document.dispatchEvent(new CustomEvent('mockgristrecord', { detail: record }))
  }, recordData)

  await page.waitForFunction(
    () => (window as Window & { __bizdocgenReady?: boolean }).__bizdocgenReady === true,
    { timeout: 10_000 },
  )

  // Wait for web fonts (Sarabun etc.) to finish loading after the record renders
  await page.evaluate(() => document.fonts.ready)

  await page.pdf({ path: output, format: 'A4', printBackground: true })

  console.log(`✓ PDF saved → ${output}`)
} finally {
  await browser.close()
}
