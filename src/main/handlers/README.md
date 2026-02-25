# Handlers

IPC handler modules that the main process registers via `ipcMain.handle()`. Each module exports a `register(ipcMain, ctx)` function that sets up handlers for a specific domain. The entry point calls all registration functions on app startup.

## How It Connects

`index.ts` is called from the main process entry (`src/main/index.ts`) during app initialization. Each handler receives a shared `HandlerContext` with runtime state (PTY map, file watchers, E2E flags). Handlers respond to `ipcRenderer.invoke()` calls made by the preload APIs in `src/preload/apis/`. In E2E mode, handlers return mock data from `scenarios.ts` instead of performing real operations.

## Files

| File | Description |
|------|-------------|
| `index.ts` | Entry point that imports and registers all handler modules. |
| `types.ts` | Shared `HandlerContext` interface, `E2EScenario` enum, and helper constants. |
| `scenarios.ts` | Centralized E2E mock data for each test scenario (default, marketing). |
| `pty.ts` | PTY lifecycle: create, resize, write, and destroy pseudo-terminals via node-pty. |
| `config.ts` | Config persistence: read/write per-profile config files, legacy migration, init scripts. |
| `git.ts` | Composite registration for git handlers (delegates to gitBasic, gitBranch, gitSync). |
| `gitBasic.ts` | Git queries: branch name, repo detection, status, diff, and log. |
| `gitBranch.ts` | Git branch operations: clone, worktree, checkout, and branch creation. |
| `gitSync.ts` | Git sync operations: pull, push, fetch, and stash. |
| `fs.ts` | Composite registration for filesystem handlers (delegates to fsCore, fsSearch). |
| `fsCore.ts` | Core filesystem: directory listing, file read/write, rename, delete, and watch. |
| `fsSearch.ts` | Filesystem search, delegating to a worker thread. |
| `gh.ts` | Composite registration for GitHub handlers (delegates to ghCore, ghComments). |
| `ghCore.ts` | GitHub operations via gh CLI: PR status, issue listing, auth checks, repo metadata. |
| `ghComments.ts` | GitHub PR review comment fetching and replies via gh CLI. |
| `shell.ts` | Shell commands, external URLs, native dialogs, and context menus. |
| `app.ts` | App-level queries: platform, home directory, version, dev mode. |
| `typescript.ts` | TypeScript project context extraction, delegating to a worker thread. |
| `updater.ts` | Auto-update lifecycle: check, download, and install via electron-updater. |
| `pty.test.ts` | Unit tests for PTY handlers. |
| `config.test.ts` | Unit tests for config handlers. |
| `git.test.ts` | Unit tests for composite git registration. |
| `gitBasic.test.ts` | Unit tests for basic git handlers. |
| `gitBranch.test.ts` | Unit tests for git branch handlers. |
| `gitSync.test.ts` | Unit tests for git sync handlers. |
| `fs.test.ts` | Unit tests for composite filesystem registration. |
| `fsCore.test.ts` | Unit tests for core filesystem handlers. |
| `fsSearch.test.ts` | Unit tests for filesystem search handler. |
| `gh.test.ts` | Unit tests for composite GitHub registration. |
| `ghCore.test.ts` | Unit tests for core GitHub handlers. |
| `ghComments.test.ts` | Unit tests for GitHub comment handlers. |
| `shell.test.ts` | Unit tests for shell handlers. |
| `app.test.ts` | Unit tests for app handlers. |
| `typescript.test.ts` | Unit tests for TypeScript handler. |
| `updater.test.ts` | Unit tests for updater handlers. |
| `index.test.ts` | Unit tests for handler registration entry point. |
| `types.test.ts` | Unit tests for handler types and constants. |
