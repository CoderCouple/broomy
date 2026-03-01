/**
 * Feature Documentation: Agent Isolation via Docker
 *
 * Demonstrates the per-agent Docker isolation and skip-permissions settings.
 * Exercises the settings UI flow with mocked Docker — no real containers are started.
 *
 * Run with: pnpm test:feature-docs agent-isolation
 */
import { test, expect, resetApp } from '../_shared/electron-fixture'
import type { Page } from '@playwright/test'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { screenshotElement, screenshotRegion } from '../_shared/screenshot-helpers'
import { generateFeaturePage, generateIndex, FeatureStep } from '../_shared/template'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const FEATURE_DIR = __dirname
const SCREENSHOTS = path.join(FEATURE_DIR, 'screenshots')
const FEATURES_ROOT = path.join(__dirname, '..')

let page: Page
const steps: FeatureStep[] = []

/** Helper to open settings panel */
async function openSettings() {
  const settingsButton = page.locator('button[title^="Settings"]')
  await settingsButton.click()
  await page.waitForSelector('[data-panel-id="settings"]', { state: 'visible', timeout: 5000 })
}

/** Helper to close settings panel */
async function closeSettings() {
  const settingsButton = page.locator('button[title^="Settings"]')
  await settingsButton.click()
  await page.waitForSelector('[data-panel-id="settings"]', { state: 'hidden', timeout: 5000 })
}

test.beforeAll(async () => {
  await fs.promises.mkdir(SCREENSHOTS, { recursive: true })
  ;({ page } = await resetApp())
})

test.afterAll(async () => {
  await generateFeaturePage(
    {
      title: 'Agent Isolation via Docker',
      description:
        'Broomy supports optional Docker-based container isolation for agents. When enabled, ' +
        'each session runs inside its own Docker container with access only to the repo directory ' +
        'and a shared config folder. Combined with the skip-permissions toggle, users can safely ' +
        'run agents at full speed without risking damage to their machine.',
      steps,
    },
    FEATURE_DIR,
  )
  await generateIndex(FEATURES_ROOT)
})

test.describe.serial('Feature: Agent Isolation via Docker', () => {
  test('Step 1: Open settings — view default agent list', async () => {
    await openSettings()

    const settingsPanel = page.locator('[data-panel-id="settings"]')
    await expect(settingsPanel).toBeVisible()

    // Wait for agents section to render
    await expect(settingsPanel.locator('text=Agents')).toBeVisible()

    // Verify default agents exist (Claude Code, Codex, etc.)
    await expect(settingsPanel.locator('text=Claude Code')).toBeVisible()

    await screenshotElement(page, settingsPanel, path.join(SCREENSHOTS, '01-settings-agents.png'), {
      maxHeight: 700,
    })
    steps.push({
      screenshotPath: 'screenshots/01-settings-agents.png',
      caption: 'Agent list in settings before isolation is configured',
      description:
        'The settings panel shows all configured agents. None have isolation or ' +
        'skip-permissions enabled yet — no docker or auto badges are visible.',
    })
  })

  test('Step 2: Click edit on Claude Code agent', async () => {
    const settingsPanel = page.locator('[data-panel-id="settings"]')

    // Click the edit button on Claude Code agent row
    const claudeRow = settingsPanel.locator('div:has(> div > div > .font-medium:text-is("Claude Code"))')
    const editButton = claudeRow.locator('button[title="Edit agent"]')
    await editButton.click()

    // Wait for edit form to appear — it has input fields
    await expect(settingsPanel.locator('input[value="Claude Code"]')).toBeVisible({ timeout: 3000 })

    // Verify isolation settings section is visible
    await expect(settingsPanel.locator('text=Run in Docker container')).toBeVisible()
    await expect(settingsPanel.locator('text=Skip permission prompts')).toBeVisible()

    await screenshotElement(page, settingsPanel, path.join(SCREENSHOTS, '02-edit-form.png'), {
      maxHeight: 700,
    })
    steps.push({
      screenshotPath: 'screenshots/02-edit-form.png',
      caption: 'Agent edit form showing isolation checkboxes',
      description:
        'Clicking edit on an agent shows the full configuration form. At the bottom, ' +
        'two new checkboxes appear: "Run in Docker container" and "Skip permission prompts". ' +
        'Both are unchecked by default.',
    })
  })

  test('Step 3: Enable Docker isolation — image input and status appear', async () => {
    const settingsPanel = page.locator('[data-panel-id="settings"]')

    // Check the Docker isolation checkbox
    const isolationCheckbox = settingsPanel.locator('label:has-text("Run in Docker container") input[type="checkbox"]')
    await isolationCheckbox.check()

    // Docker image input should appear
    const imageInput = settingsPanel.locator('input[placeholder="broomy/isolation:latest"]')
    await expect(imageInput).toBeVisible({ timeout: 3000 })

    // Docker status indicator should appear (mocked as available in E2E)
    await expect(settingsPanel.locator('text=Docker available')).toBeVisible({ timeout: 5000 })

    await screenshotElement(page, settingsPanel, path.join(SCREENSHOTS, '03-isolation-enabled.png'), {
      maxHeight: 700,
    })
    steps.push({
      screenshotPath: 'screenshots/03-isolation-enabled.png',
      caption: 'Docker isolation enabled — image input and green status indicator',
      description:
        'After checking "Run in Docker container", a Docker image input field appears ' +
        'with a placeholder of "broomy/isolation:latest". A green status dot shows ' +
        '"Docker available", confirming Docker is detected on the system.',
    })
  })

  test('Step 4: Enable skip permissions — flag shown with safety warning', async () => {
    const settingsPanel = page.locator('[data-panel-id="settings"]')

    // Check skip permissions
    const skipCheckbox = settingsPanel.locator('label:has-text("Skip permission prompts") input[type="checkbox"]')
    await skipCheckbox.check()

    // The flag indicator should show
    await expect(settingsPanel.locator('text=--dangerously-skip-permissions')).toBeVisible({ timeout: 3000 })

    await screenshotElement(page, settingsPanel, path.join(SCREENSHOTS, '04-skip-permissions.png'), {
      maxHeight: 700,
    })
    steps.push({
      screenshotPath: 'screenshots/04-skip-permissions.png',
      caption: 'Skip permissions enabled with Docker isolation — shows flag to append',
      description:
        'With both Docker isolation and skip permissions enabled, the UI shows which ' +
        'flag will be appended to the command (--dangerously-skip-permissions for Claude Code). ' +
        'No warning is shown because container isolation is also enabled.',
    })
  })

  test('Step 5: Save and verify badges on agent row', async () => {
    const settingsPanel = page.locator('[data-panel-id="settings"]')

    // Click Save
    const saveButton = settingsPanel.locator('button:text-is("Save")')
    await saveButton.click()

    // Wait for edit form to close and agent row to reappear with badges
    await expect(settingsPanel.locator('text=docker')).toBeVisible({ timeout: 3000 })
    await expect(settingsPanel.locator('text=auto')).toBeVisible({ timeout: 3000 })

    await screenshotElement(page, settingsPanel, path.join(SCREENSHOTS, '05-badges.png'), {
      maxHeight: 700,
    })
    steps.push({
      screenshotPath: 'screenshots/05-badges.png',
      caption: 'Agent row shows "docker" and "auto" badges after saving',
      description:
        'After saving, the Claude Code agent row now displays two small badges: ' +
        '"docker" (blue) indicating container isolation is enabled, and "auto" (yellow) ' +
        'indicating skip permissions is active.',
    })
  })

  test('Step 6: Edit again, uncheck Docker — warning appears', async () => {
    const settingsPanel = page.locator('[data-panel-id="settings"]')

    // Edit Claude Code again
    const claudeRow = settingsPanel.locator('div:has(> div > div > .font-medium:text-is("Claude Code"))')
    const editButton = claudeRow.locator('button[title="Edit agent"]')
    await editButton.click()

    await expect(settingsPanel.locator('input[value="Claude Code"]')).toBeVisible({ timeout: 3000 })

    // Uncheck Docker isolation while skip permissions remains checked
    const isolationCheckbox = settingsPanel.locator('label:has-text("Run in Docker container") input[type="checkbox"]')
    await isolationCheckbox.uncheck()

    // Warning should appear about skip permissions without isolation
    await expect(settingsPanel.locator('text=unrestricted access')).toBeVisible({ timeout: 3000 })

    await screenshotElement(page, settingsPanel, path.join(SCREENSHOTS, '06-warning.png'), {
      maxHeight: 700,
    })
    steps.push({
      screenshotPath: 'screenshots/06-warning.png',
      caption: 'Warning when skip permissions is enabled without Docker isolation',
      description:
        'Disabling Docker isolation while skip permissions remains checked triggers a ' +
        'yellow warning: "Skipping permissions without container isolation gives this agent ' +
        'unrestricted access to your machine." This guides users toward safe auto-approval.',
    })
  })

  test('Step 7: Cancel and close settings', async () => {
    const settingsPanel = page.locator('[data-panel-id="settings"]')

    // Cancel the edit (don't save the un-checked isolation)
    const cancelButton = settingsPanel.locator('button:text-is("Cancel")')
    await cancelButton.click()

    // Badges should still be visible since we cancelled
    await expect(settingsPanel.locator('text=docker')).toBeVisible({ timeout: 3000 })

    await closeSettings()

    // Verify settings panel is hidden
    await expect(page.locator('[data-panel-id="settings"]')).not.toBeVisible()

    // Take screenshot of the main app view
    const mainArea = page.locator('#root > div').first()
    await screenshotElement(page, mainArea, path.join(SCREENSHOTS, '07-main-view.png'), {
      maxHeight: 700,
    })
    steps.push({
      screenshotPath: 'screenshots/07-main-view.png',
      caption: 'Main app view with isolation-enabled agent session',
      description:
        'After closing settings, the main view shows the active session. ' +
        'Sessions using an isolated agent will have their terminal processes ' +
        'run inside Docker containers, with a "(docker)" info tab available ' +
        'in the terminal area.',
    })
  })
})
