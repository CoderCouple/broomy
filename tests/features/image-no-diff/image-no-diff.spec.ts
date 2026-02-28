/**
 * Feature Documentation: Image Files Skip Diff View
 *
 * When an image file is modified, the file viewer opens it with the image
 * viewer and does not offer a Diff button. Only text files get the diff
 * option. This prevents binary image data from being fed to the Monaco
 * diff editor.
 *
 * Run with: pnpm test:feature-docs image-no-diff
 */
import { test, expect, resetApp } from '../_shared/electron-fixture'
import type { Page } from '@playwright/test'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { screenshotElement, waitForDiffEditor } from '../_shared/screenshot-helpers'
import { generateFeaturePage, generateIndex, FeatureStep } from '../_shared/template'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const FEATURE_DIR = __dirname
const SCREENSHOTS = path.join(FEATURE_DIR, 'screenshots')
const FEATURES_ROOT = path.join(__dirname, '..')

let page: Page
const steps: FeatureStep[] = []

/** Navigate the explorer panel to the source-control tab */
async function openSourceControl() {
  const explorerButton = page.locator('[data-panel-id="explorer-toggle"], [title*="Explorer"]').first()
  if (await explorerButton.isVisible()) {
    const cls = await explorerButton.getAttribute('class').catch(() => '')
    if (!cls?.includes('bg-accent')) {
      await explorerButton.click()
      await expect(page.locator('[data-panel-id="explorer"]')).toBeVisible()
    }
  }

  await page.evaluate(() => {
    const store = (window as Record<string, unknown>).__sessionStore as {
      getState: () => { activeSessionId: string; setExplorerFilter: (id: string, filter: string) => void }
    }
    if (!store) return
    const state = store.getState()
    state.setExplorerFilter(state.activeSessionId, 'source-control')
  })
  await expect(page.locator('[data-panel-id="explorer"]')).toBeVisible()
}

test.beforeAll(async () => {
  await fs.promises.mkdir(SCREENSHOTS, { recursive: true })

  ;({ page } = await resetApp())
})

test.afterAll(async () => {
  await generateFeaturePage(
    {
      title: 'Image Files Skip Diff View',
      description:
        'Modified image files open in the image viewer without a Diff button. ' +
        'Only text files (where Monaco can render content) get the diff toggle. ' +
        'This prevents binary data from being fed to the text-based diff editor.',
      steps,
    },
    FEATURE_DIR,
  )
  await generateIndex(FEATURES_ROOT)
})

test.describe.serial('Feature: Image Files Skip Diff View', () => {
  test('Step 1: Open a modified text file — Diff button visible', async () => {
    await openSourceControl()

    // Click README.md (modified text file in E2E mock)
    const readmeEntry = page.locator('text=README.md').first()
    await expect(readmeEntry).toBeVisible()
    await readmeEntry.click()

    // File viewer should appear in diff mode (opened from source control)
    const fileViewer = page.locator('[data-panel-id="fileViewer"]')
    await expect(fileViewer).toBeVisible()
    await waitForDiffEditor(fileViewer)

    // The Diff button should be present in the toolbar
    const diffButton = fileViewer.locator('button[title="Diff"]')
    await expect(diffButton).toBeVisible()

    await screenshotElement(page, fileViewer, path.join(SCREENSHOTS, '01-text-file-with-diff.png'), {
      maxHeight: 500,
    })
    steps.push({
      screenshotPath: 'screenshots/01-text-file-with-diff.png',
      caption: 'Modified text file has a Diff button in the toolbar',
      description:
        'README.md is a modified text file. When opened from source control, it opens ' +
        'in diff view. The toolbar shows the Diff button (git branch icon) because Monaco ' +
        'can render text diffs.',
    })
  })

  test('Step 2: Open a modified image file — no Diff button', async () => {
    // Click logo.png (modified image file in E2E mock)
    const logoEntry = page.locator('text=logo.png').first()
    await expect(logoEntry).toBeVisible()
    await logoEntry.click()

    // File viewer should show the image viewer
    const fileViewer = page.locator('[data-panel-id="fileViewer"]')
    await expect(fileViewer).toBeVisible()

    // Wait for the image viewer to load (it renders an <img> tag)
    const image = fileViewer.locator('img').first()
    await expect(image).toBeVisible({ timeout: 5000 })

    // The Diff button should NOT be present
    const diffButton = fileViewer.locator('button[title="Diff"]')
    await expect(diffButton).not.toBeVisible()

    await screenshotElement(page, fileViewer, path.join(SCREENSHOTS, '02-image-no-diff.png'), {
      maxHeight: 500,
    })
    steps.push({
      screenshotPath: 'screenshots/02-image-no-diff.png',
      caption: 'Modified image file has no Diff button — uses image viewer',
      description:
        'logo.png is a modified image file. It opens in the image viewer with zoom ' +
        'and pan controls. There is no Diff button because image files cannot be ' +
        'meaningfully diffed in a text-based editor.',
    })
  })

  test('Step 3: Switch back to text file — Diff button returns', async () => {
    // Click back to README.md
    const readmeEntry = page.locator('text=README.md').first()
    await expect(readmeEntry).toBeVisible()
    await readmeEntry.click()

    const fileViewer = page.locator('[data-panel-id="fileViewer"]')
    await expect(fileViewer).toBeVisible()
    await waitForDiffEditor(fileViewer)

    // Diff button should be back
    const diffButton = fileViewer.locator('button[title="Diff"]')
    await expect(diffButton).toBeVisible()

    await screenshotElement(page, fileViewer, path.join(SCREENSHOTS, '03-text-diff-returns.png'), {
      maxHeight: 500,
    })
    steps.push({
      screenshotPath: 'screenshots/03-text-diff-returns.png',
      caption: 'Switching back to a text file restores the Diff button',
      description:
        'Navigating back to README.md shows the Diff button again. The diff/no-diff ' +
        'decision is per-file based on whether the content is text.',
    })
  })
})
