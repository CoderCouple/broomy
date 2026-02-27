/**
 * Feature Documentation: Agent Panel Toggle
 *
 * Exercises the toolbar button that toggles the Agent/Terminal panel visibility.
 * The button hides/shows the terminal area without unmounting it, preserving state.
 *
 * Run with: pnpm test:feature-docs agent-panel-toggle
 */
import { test, expect, resetApp } from '../_shared/electron-fixture'
import type { Page } from '@playwright/test'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { screenshotRegion } from '../_shared/screenshot-helpers'
import { generateFeaturePage, generateIndex, FeatureStep } from '../_shared/template'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const FEATURE_DIR = __dirname
const SCREENSHOTS = path.join(FEATURE_DIR, 'screenshots')
const FEATURES_ROOT = path.join(__dirname, '..')

let page: Page
const steps: FeatureStep[] = []

test.beforeAll(async () => {
  await fs.promises.mkdir(SCREENSHOTS, { recursive: true })
  ;({ page } = await resetApp())
})

test.afterAll(async () => {
  await generateFeaturePage(
    {
      title: 'Agent Panel Toggle',
      description:
        'A toolbar button lets users toggle the Agent/Terminal panel on and off. ' +
        'When hidden, the terminal is CSS-hidden (not unmounted) so terminal state is preserved. ' +
        'This is a per-session toggle, so each session can independently show or hide its agent panel.',
      steps,
    },
    FEATURE_DIR,
  )
  await generateIndex(FEATURES_ROOT)
})

test.describe.serial('Feature: Agent Panel Toggle', () => {
  test('Step 1: Agent button visible in toolbar, terminal shown by default', async () => {
    // Verify the Agent button exists in the toolbar
    const agentButton = page.locator('button', { hasText: 'Agent' })
    await expect(agentButton).toBeVisible()

    // Terminal area should be visible by default
    const terminalPanel = page.locator('[data-panel-id="terminal"]')
    await expect(terminalPanel).toBeVisible()

    // Agent button should be active (highlighted) since panel is visible by default
    const buttonClasses = await agentButton.getAttribute('class')
    expect(buttonClasses).toContain('bg-accent')

    const toolbar = page.locator('.h-10.flex.items-center')
    const terminal = page.locator('[data-panel-id="terminal"]')
    await screenshotRegion(page, toolbar, terminal, path.join(SCREENSHOTS, '01-default-state.png'), {
      maxHeight: 400,
    })
    steps.push({
      screenshotPath: 'screenshots/01-default-state.png',
      caption: 'Default state: Agent button active, terminal visible',
      description:
        'The toolbar shows the "Agent" button in its active (highlighted) state. ' +
        'The terminal panel is visible in the main content area below.',
    })
  })

  test('Step 2: Click Agent button to hide the terminal', async () => {
    const agentButton = page.locator('button', { hasText: 'Agent' })
    await agentButton.click()

    // Terminal panel should now be hidden
    const terminalPanel = page.locator('[data-panel-id="terminal"]')
    await expect(terminalPanel).toBeHidden()

    // Agent button should be inactive (not highlighted)
    const buttonClasses = await agentButton.getAttribute('class')
    expect(buttonClasses).not.toContain('bg-accent')

    const toolbar = page.locator('.h-10.flex.items-center')
    await page.screenshot({
      path: path.join(SCREENSHOTS, '02-agent-hidden.png'),
      type: 'png',
    })
    steps.push({
      screenshotPath: 'screenshots/02-agent-hidden.png',
      caption: 'After clicking Agent: terminal is hidden',
      description:
        'The "Agent" button is now inactive (dimmed). The terminal panel is hidden, ' +
        'giving more space to other visible panels like the file viewer or explorer.',
    })
  })

  test('Step 3: Click Agent button again to restore the terminal', async () => {
    const agentButton = page.locator('button', { hasText: 'Agent' })
    await agentButton.click()

    // Terminal should be visible again
    const terminalPanel = page.locator('[data-panel-id="terminal"]')
    await expect(terminalPanel).toBeVisible()

    // Button should be active again
    const buttonClasses = await agentButton.getAttribute('class')
    expect(buttonClasses).toContain('bg-accent')

    const toolbar = page.locator('.h-10.flex.items-center')
    const terminal = page.locator('[data-panel-id="terminal"]')
    await screenshotRegion(page, toolbar, terminal, path.join(SCREENSHOTS, '03-agent-restored.png'), {
      maxHeight: 400,
    })
    steps.push({
      screenshotPath: 'screenshots/03-agent-restored.png',
      caption: 'After toggling back: terminal is restored',
      description:
        'Clicking the Agent button again restores the terminal. The terminal state is preserved ' +
        'because the panel uses CSS hiding rather than unmounting.',
    })
  })
})
