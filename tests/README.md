# E2E Tests

Playwright end-to-end tests that launch the full Electron app with mock data and verify UI behavior. The app runs in E2E mode (`E2E_TEST=true`) where all IPC handlers return predictable mock data, fake Claude scripts simulate agent output, and no real config files or git repos are touched.

## How It Connects

Tests depend on the build output (via `global-setup.ts`), the fake Claude scripts in `scripts/`, and the E2E mock data paths in `src/main/index.ts`. The main process checks `isE2ETest` to return demo sessions, mock file trees, and mock git status. Each test launches its own Electron instance, optionally specifying a custom fake Claude script via `FAKE_CLAUDE_SCRIPT`.

There are two E2E modes:
- `pnpm test:e2e` — builds only main+preload and uses a Vite dev server for the renderer (fast, for local development)
- `pnpm test:e2e:built` — does a full production build first (for CI)

The `E2E_HEADLESS` environment variable controls window visibility -- set to `'false'` for local debugging, defaults to `'true'` for CI. Use `pnpm test:e2e:headed` or `pnpm test:e2e:built:headed` to show the window.

## Files

| File | Description |
|------|-------------|
| `global-setup.ts` | Runs once before all tests: ensures the Electron binary is downloaded and runs `pnpm build` so every spec can skip its own build step. |
| `global-teardown.ts` | Playwright global teardown: cleans up the Vite dev server started in dev mode. |
| `build-main-preload.mjs` | Builds only the main and preload processes (skips the slow renderer build). Used by E2E dev mode where the renderer is served by the Vite dev server. |
| `vite-renderer.config.ts` | Vite config for serving the renderer in E2E dev mode. Mirrors the renderer section of `electron.vite.config.ts`. |
| `app.spec.ts` | Core app E2E tests covering session display, sidebar navigation, panel toggling (Explorer, Terminal), session switching, terminal persistence across session changes, and shell integration with the fake Claude script. |
| `screenshots.spec.ts` | Generates marketing screenshots by launching the app in screenshot mode (`E2E_SCENARIO=marketing`), injecting varied session states (working, idle, unread, pushed, merged, PR open), and capturing cropped screenshots of the sidebar, status cards, review panel, and explorer. |
| `keyboard-shortcuts.spec.ts` | Tests keyboard shortcuts for panel toggles (Cmd+1/2/3) and session navigation (Alt+ArrowUp/Down). |
| `panels.spec.ts` | Tests toolbar panel toggling: verifying button display, and toggling Explorer, Settings, and Guide panels on and off. |
| `sessions.spec.ts` | Tests the New Session dialog: opening, navigating between New Branch, Existing Branch, and Issues views, and verifying mock data display. |
| `terminal-tabs.spec.ts` | Tests terminal tab management: default Agent tab, adding user terminal tabs, switching between tabs, and verifying shell prompt output. |

The `features/` subdirectory contains feature documentation tests -- screenshot-driven walkthroughs that exercise feature flows and generate visual HTML reports. See the [Feature Documentation](../CLAUDE.md#feature-documentation) section of `CLAUDE.md` for details. Each feature has its own subdirectory under `features/` (e.g. `features/session-switching/`).
