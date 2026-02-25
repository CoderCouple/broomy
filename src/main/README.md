# Main Process

The main process is the Node.js backend of the Electron app. It owns all privileged operations -- spawning pseudo-terminals (PTY), reading and writing the filesystem, running git and GitHub CLI commands, persisting configuration, and managing application windows. Every capability the renderer needs goes through IPC handlers registered here.

## How It Connects

The renderer never touches Node.js APIs directly. Instead, it calls typed methods exposed by the preload script (`src/preload/`), which forward each call to a matching `ipcMain.handle()` handler in this folder. Event-based communication (PTY output, file-watcher events) flows back via `webContents.send()` on per-ID channels. Every handler checks an `isE2ETest` flag and returns deterministic mock data during end-to-end tests so that Playwright tests never hit real git repos, the GitHub API, or the filesystem.

## Files

| File | Description |
|------|-------------|
| `index.ts` | Application entry point: window creation, IPC handler registration, E2E mock data, config migration, and app lifecycle management |
| `platform.ts` | Cross-platform helpers for detecting the OS, resolving the default shell, normalizing file paths, and setting executable permissions |
| `shellEnv.ts` | Shell environment resolution for spawning processes with correct PATH and env vars |
| `workerPool.ts` | Worker thread pool management for offloading CPU-intensive tasks (file search, TypeScript analysis) |
| `gitStatusParser.ts` | Pure functions for converting git status character codes to human-readable strings, parsing individual file entries from `git status`, and building GitHub PR-creation URLs |
| `cloneErrorHint.ts` | Detects common HTTPS and SSH authentication errors from `git clone` output and returns actionable suggestions (e.g. switch protocol, run `gh auth setup-git`) |
| `platform.test.ts` | Unit tests for cross-platform helpers |
| `workerPool.test.ts` | Unit tests for worker pool lifecycle and task dispatch |
| `gitStatusParser.test.ts` | Unit tests for `statusFromChar`, `parseGitStatusFile`, and `buildPrCreateUrl` |
| `cloneErrorHint.test.ts` | Unit tests for `getCloneErrorHint` covering HTTPS auth failures, SSH auth failures, and non-matching errors |

## Subdirectories

| Directory | Description |
|-----------|-------------|
| `handlers/` | IPC handler modules split by domain (app, config, fs, git, gh, pty, shell, typescript, updater) with co-located tests |
| `workers/` | Worker thread scripts (fsSearch.worker.ts, tsProject.worker.ts) with co-located tests |
