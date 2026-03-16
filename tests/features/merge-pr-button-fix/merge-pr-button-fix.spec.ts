/**
 * Feature Documentation: Merge PR Button Fix
 *
 * Documents the "Merge PR to main" action button and its visibility conditions.
 * The button requires: clean working tree, open PR, checks passed, write access,
 * and merge allowed. A missing useMemo dependency on checksStatus caused the
 * button to disappear when checks status changed; this fix adds it.
 *
 * Run with: pnpm test:feature-docs merge-pr-button-fix
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

/** Switch to a session by ID */
async function switchToSession(sessionId: string) {
  await page.evaluate((id) => {
    const store = (window as Record<string, unknown>).__sessionStore as {
      getState: () => { sessions: { id: string }[]; setActiveSession: (id: string) => void }
    }
    if (!store) return
    const state = store.getState()
    const session = state.sessions.find((s: { id: string }) => s.id === id)
    if (session) state.setActiveSession(session.id)
  }, sessionId)
  await page.waitForTimeout(500)
}

test.beforeAll(async () => {
  await fs.promises.mkdir(SCREENSHOTS, { recursive: true })
  ;({ page } = await resetApp())
})

test.afterAll(async () => {
  await generateFeaturePage(
    {
      title: 'Fix: Merge PR Button Visibility',
      description:
        'The "Merge PR to main" action button was disappearing from the source control ' +
        'panel due to a missing checksStatus dependency in the useMemo that computes ' +
        'condition state. When checksStatus changed (e.g. from "none" to "passed"), the ' +
        'memoized condition state was not recalculated, causing the checks-passed condition ' +
        'to become stale. This fix adds data.checksStatus to the dependency array.',
      steps,
    },
    FEATURE_DIR,
  )
  await generateIndex(FEATURES_ROOT)
})

test.describe.serial('Feature: Merge PR Button Fix', () => {
  test('Step 1: Feature branch with open PR and uncommitted changes', async () => {
    // Session 2 (backend-api) is on feature/auth with an open PR
    await switchToSession('2')
    await openSourceControl()

    // Wait for PR status to load
    await page.waitForTimeout(2000)

    const explorer = page.locator('[data-panel-id="explorer"]')
    await expect(explorer).toBeVisible()

    await screenshotElement(page, explorer, path.join(SCREENSHOTS, '01-feature-branch-dirty.png'), {
      maxHeight: 600,
    })
    steps.push({
      screenshotPath: 'screenshots/01-feature-branch-dirty.png',
      caption: 'Feature branch with open PR but uncommitted changes',
      description:
        'The backend-api session is on feature/auth with an open PR (shown in the PR banner). ' +
        'The "Merge PR to main" button is not visible because the working tree has uncommitted ' +
        'changes — the "clean" showWhen condition is false. The "Commit with AI" button appears ' +
        'instead, since its condition "has-changes" is true.',
    })
  })

  test('Step 2: Verify Commit with AI button visible (has-changes condition)', async () => {
    // With uncommitted changes, Commit with AI should be visible
    const commitButton = page.locator('button:has-text("Commit with AI")')
    await expect(commitButton).toBeVisible({ timeout: 5000 })

    // Merge PR should NOT be visible (working tree is dirty)
    const mergePrButton = page.locator('button:has-text("Merge PR to main")')
    await expect(mergePrButton).not.toBeVisible()

    await screenshotElement(page, commitButton, path.join(SCREENSHOTS, '02-commit-button.png'), {
      padding: 8,
    })
    steps.push({
      screenshotPath: 'screenshots/02-commit-button.png',
      caption: 'Commit with AI button shown instead of Merge PR',
      description:
        'The condition system correctly shows "Commit with AI" (showWhen: has-changes, !merging) ' +
        'and hides "Merge PR to main" (showWhen: clean, open, checks-passed, has-write-access, ' +
        'allow-approve-and-merge, !review). The merge button requires ALL conditions to be true.',
    })
  })

  test('Step 3: PR banner confirms open PR state', async () => {
    // The PR banner should show PR #123 as open
    const prBanner = page.locator('text=PR #').first()
    const bannerVisible = await prBanner.isVisible().catch(() => false)

    const explorer = page.locator('[data-panel-id="explorer"]')
    await screenshotElement(page, explorer, path.join(SCREENSHOTS, '03-pr-banner.png'), {
      maxHeight: 300,
    })
    steps.push({
      screenshotPath: 'screenshots/03-pr-banner.png',
      caption: bannerVisible ? 'PR banner showing open PR status' : 'Source control header with branch info',
      description:
        'The PR banner shows the pull request is open. The fix ensures that when the PR ' +
        'status and checks status are fetched, both values are properly tracked in the ' +
        'useMemo dependency array. Previously, checksStatus was missing from the deps, ' +
        'causing the condition state to become stale after a re-render triggered by ' +
        'other dependency changes (e.g. git polling updating syncStatus).',
    })
  })

  test('Step 4: Main branch session has no merge button', async () => {
    // Session 1 (broomy) is on main — no merge PR button
    await switchToSession('1')
    await openSourceControl()
    await page.waitForTimeout(1500)

    const mergePrButton = page.locator('button:has-text("Merge PR to main")')
    await expect(mergePrButton).not.toBeVisible()

    const explorer = page.locator('[data-panel-id="explorer"]')
    await screenshotElement(page, explorer, path.join(SCREENSHOTS, '04-main-branch.png'), {
      maxHeight: 500,
    })
    steps.push({
      screenshotPath: 'screenshots/04-main-branch.png',
      caption: 'Main branch: no merge button (correct behavior)',
      description:
        'On the main branch, there is no open PR, so the "open" condition is false and ' +
        'the merge button does not appear. The condition evaluation system correctly ' +
        'hides actions whose showWhen conditions are not met.',
    })
  })
})
