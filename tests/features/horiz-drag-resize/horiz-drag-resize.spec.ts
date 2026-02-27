/**
 * Feature Documentation: Horizontal Drag Resize
 *
 * Demonstrates that the file viewer divider can be dragged to resize
 * in horizontal (left) layout position. This was a regression where
 * the divider wrapper collapsed to zero height, making it unclickable.
 *
 * Run with: pnpm test:feature-docs horiz-drag-resize
 */
import { test, expect, resetApp } from '../_shared/electron-fixture'
import type { Page } from '@playwright/test'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { screenshotElement } from '../_shared/screenshot-helpers'
import { generateFeaturePage, generateIndex, FeatureStep } from '../_shared/template'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const FEATURE_DIR = __dirname
const SCREENSHOTS = path.join(FEATURE_DIR, 'screenshots')
const FEATURES_ROOT = path.join(__dirname, '..')

let page: Page
const steps: FeatureStep[] = []

test.setTimeout(60000)

test.beforeAll(async () => {
  await fs.promises.mkdir(SCREENSHOTS, { recursive: true })
  ;({ page } = await resetApp())
}, { timeout: 60000 })

test.afterAll(async () => {
  await generateFeaturePage(
    {
      title: 'Horizontal Drag Resize Fix',
      description:
        'The file viewer can be positioned above or to the left of the terminal. ' +
        'A regression caused the horizontal (left) layout divider to be unclickable ' +
        'because its wrapper div collapsed to zero height. The fix adds display:flex ' +
        'to the wrapper so the divider stretches to fill the available space.',
      steps,
    },
    FEATURE_DIR,
  )
  await generateIndex(FEATURES_ROOT)
})

test.describe.serial('Feature: Horizontal Drag Resize', () => {
  test('Step 1: Open file viewer and switch to horizontal layout', async () => {
    // Open explorer panel
    const explorerBtn = page.locator('button[title*="Explorer"]')
    await explorerBtn.click()

    const explorerPanel = page.locator('[data-panel-id="explorer"]')
    await expect(explorerPanel).toBeVisible()

    // Click on a file to open file viewer
    await explorerPanel.locator('text=package.json').first().click()

    const fileViewer = page.locator('[data-panel-id="fileViewer"]')
    await expect(fileViewer).toBeVisible({ timeout: 10000 })

    // Screenshot the initial layout (default: top position)
    const contentArea = fileViewer.locator('..')
    await screenshotElement(page, contentArea, path.join(SCREENSHOTS, '01-file-viewer-top.png'), {
      maxHeight: 600,
    })

    steps.push({
      screenshotPath: 'screenshots/01-file-viewer-top.png',
      caption: 'File viewer in default top position',
      description:
        'File viewer opens above the terminal. The horizontal divider between them works correctly.',
    })

    // Switch to horizontal (left) layout
    const leftPositionBtn = page.locator('button[title="Position left of agent"]')
    await expect(leftPositionBtn).toBeVisible()
    await leftPositionBtn.click()

    // Wait for layout to change to flex-row
    await page.waitForTimeout(300)

    await screenshotElement(page, contentArea, path.join(SCREENSHOTS, '02-file-viewer-left.png'), {
      maxHeight: 600,
    })

    steps.push({
      screenshotPath: 'screenshots/02-file-viewer-left.png',
      caption: 'File viewer switched to left position',
      description:
        'After clicking the position toggle, the file viewer moves to the left of the terminal. ' +
        'The vertical divider between them should be draggable.',
    })
  })

  test('Step 2: Verify divider has non-zero height in horizontal layout', async () => {
    // The divider wrapper now has display:flex, so the divider stretches to full height.
    // Previously the wrapper was a plain div and the divider collapsed to 0 height.
    const dividerHeight = await page.evaluate(() => {
      const divider = document.querySelector('[data-panel-id="fileViewer"]')?.parentElement?.querySelector('.cursor-col-resize')
      if (!divider) return 0
      return divider.getBoundingClientRect().height
    })

    // The divider should have real height (not 0 like before the fix)
    expect(dividerHeight).toBeGreaterThan(100)

    // Screenshot the divider area to show it exists
    const fileViewer = page.locator('[data-panel-id="fileViewer"]')
    const contentArea = fileViewer.locator('..')
    await screenshotElement(page, contentArea, path.join(SCREENSHOTS, '03-divider-visible.png'), {
      maxHeight: 600,
    })

    steps.push({
      screenshotPath: 'screenshots/03-divider-visible.png',
      caption: `Divider has height of ${Math.round(dividerHeight)}px`,
      description:
        'The vertical divider between file viewer and terminal now has full height ' +
        'because the wrapper div uses display:flex. Before the fix, the divider had 0 height.',
    })
  })

  test('Step 3: Drag divider to resize in horizontal layout', async () => {
    // Get the file viewer's initial width
    const fileViewer = page.locator('[data-panel-id="fileViewer"]')
    const initialBox = await fileViewer.boundingBox()
    if (!initialBox) throw new Error('File viewer not visible')
    const initialWidth = initialBox.width

    // Use the hit area (the wide invisible div inside the divider) for dragging.
    // The divider is only 1px wide but its hit area is 16px wide with z-10.
    const dividerInfo = await page.evaluate(() => {
      const divider = document.querySelector('[data-panel-id="fileViewer"]')?.parentElement?.querySelector('.cursor-col-resize') as HTMLElement
      if (!divider) return null
      const rect = divider.getBoundingClientRect()
      // The hit area child extends 8px in each direction from the 1px divider
      const hitArea = divider.querySelector('[class*="z-10"]') as HTMLElement
      const hitRect = hitArea ? hitArea.getBoundingClientRect() : null
      const centerX = rect.x + rect.width / 2
      const centerY = rect.y + rect.height / 2
      const elementAtPoint = document.elementFromPoint(centerX, centerY)
      return {
        dividerRect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        hitAreaRect: hitRect ? { x: hitRect.x, y: hitRect.y, width: hitRect.width, height: hitRect.height } : null,
        elementAtPoint: elementAtPoint?.className ?? 'null',
        elementTag: elementAtPoint?.tagName ?? 'null',
      }
    })
    if (!dividerInfo) throw new Error('Divider not found')

    // Add a mousedown listener on the divider to verify events reach it
    await page.evaluate(() => {
      const divider = document.querySelector('[data-panel-id="fileViewer"]')?.parentElement?.querySelector('.cursor-col-resize') as HTMLElement
      if (divider) {
        divider.addEventListener('mousedown', () => {
          (window as unknown as Record<string, boolean>).__dividerMouseDownFired = true
        }, { capture: true })
      }
    })

    // Use the hit area center for mouse interactions
    const hitRect = dividerInfo.hitAreaRect ?? dividerInfo.dividerRect
    const startX = hitRect.x + hitRect.width / 2
    const startY = hitRect.y + hitRect.height / 2

    // Perform the drag using Playwright's mouse API
    await page.mouse.move(startX, startY)
    await page.mouse.down()
    // Move gradually to simulate real drag
    for (let i = 1; i <= 12; i++) {
      await page.mouse.move(startX + (120 * i / 12), startY)
    }
    await page.mouse.up()

    // Wait for React to process the state updates
    await page.waitForTimeout(300)

    // Check if the mousedown event actually reached the divider
    const debugInfo = await page.evaluate(() => {
      const w = window as unknown as Record<string, unknown>
      const viewer = document.querySelector('[data-panel-id="fileViewer"]') as HTMLElement
      return {
        mouseDownFired: !!w.__dividerMouseDownFired,
        viewerWidth: viewer?.getBoundingClientRect().width ?? 0,
        viewerStyle: viewer?.style.width ?? 'none',
      }
    })

    // Re-measure after React renders
    const finalBox = await fileViewer.boundingBox()
    if (!finalBox) throw new Error('File viewer not visible after drag')
    const finalWidth = finalBox.width

    // Verify the file viewer grew wider (should increase by close to 120px)
    expect(finalWidth).toBeGreaterThan(initialWidth + 20)

    const contentArea = fileViewer.locator('..')
    await screenshotElement(page, contentArea, path.join(SCREENSHOTS, '04-after-drag.png'), {
      maxHeight: 600,
    })

    steps.push({
      screenshotPath: 'screenshots/04-after-drag.png',
      caption: `File viewer resized from ${Math.round(initialWidth)}px to ${Math.round(finalWidth)}px`,
      description:
        'After dragging the divider to the right, the file viewer grows wider. ' +
        'This confirms the horizontal layout drag resize is working correctly after the fix.',
    })
  })
})
