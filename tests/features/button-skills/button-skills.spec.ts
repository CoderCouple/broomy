/**
 * Feature Documentation: Button Skills (Claude Code Command Integration)
 *
 * Documents the skill-aware prompt system that integrates Broomy UI actions
 * with Claude Code's slash command system (.claude/commands/).
 *
 * Run with: pnpm test:feature-docs button-skills
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
      title: 'Button Skills: Claude Code Command Integration',
      description:
        'Broomy UI actions (Commit, Push to Main, Create PR, Resolve Conflicts, Review, Plan Issue) ' +
        'integrate with Claude Code\'s slash command system. When a matching .claude/commands/broomy-action-*.md ' +
        'file exists in the repo, the UI sends the slash command instead of a hardcoded prompt. ' +
        'A dismissible banner nudges Claude Code users toward installing skill files.',
      steps,
    },
    FEATURE_DIR,
  )
  await generateIndex(FEATURES_ROOT)
})

test.describe.serial('Feature: Button Skills', () => {
  test('Step 1: Navigate to Source Control view', async () => {
    await openSourceControl()

    const explorer = page.locator('[data-panel-id="explorer"]')
    await screenshotElement(page, explorer, path.join(SCREENSHOTS, '01-source-control-view.png'), {
      maxHeight: 600,
    })
    steps.push({
      screenshotPath: 'screenshots/01-source-control-view.png',
      caption: 'Source Control view showing working changes',
      description:
        'The Source Control tab in the explorer panel displays git status, ' +
        'action buttons (Commit, Sync, Push to Main, Create PR), and branch information. ' +
        'When a Claude Code agent is active, these buttons use skill-aware prompts.',
    })
  })

  test('Step 2: Action buttons area', async () => {
    const explorer = page.locator('[data-panel-id="explorer"]')
    await screenshotElement(page, explorer, path.join(SCREENSHOTS, '02-action-buttons.png'), {
      maxHeight: 400,
    })
    steps.push({
      screenshotPath: 'screenshots/02-action-buttons.png',
      caption: 'Action buttons in working changes view',
      description:
        'Each action button (Commit, Push to Main, Create PR, Resolve Conflicts) sends a ' +
        'skill-aware prompt. For Claude Code agents with a matching broomy-action-*.md skill file, ' +
        'it sends a slash command (e.g., /broomy-action-commit). For other agents or when the ' +
        'skill file is missing, it sends the original hardcoded prompt as a fallback.',
    })
  })

  test('Step 3: Terminal showing agent interaction', async () => {
    const terminalArea = page.locator('.xterm').first()
    await expect(terminalArea).toBeVisible()

    await screenshotElement(page, terminalArea, path.join(SCREENSHOTS, '03-agent-terminal.png'))
    steps.push({
      screenshotPath: 'screenshots/03-agent-terminal.png',
      caption: 'Agent terminal receives skill-aware commands',
      description:
        'When a UI button is clicked, the skill-aware prompt system checks: ' +
        '(1) Is the agent Claude Code? (command starts with "claude") ' +
        '(2) Does a matching .claude/commands/broomy-action-*.md skill file exist? ' +
        'If both are true, it sends the slash command. Otherwise, it sends the fallback prompt. ' +
        'For Claude Code users without skill files, a dismissible info banner appears suggesting ' +
        'they install the standard Broomy skills via a dialog.',
    })
  })
})
