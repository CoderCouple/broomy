# Preload APIs

Modules that define and expose typed IPC call wrappers to the renderer process via Electron's context bridge. Each module exports an API type and a factory function that wraps `ipcRenderer.invoke()` calls for a specific domain.

## How It Connects

These APIs are assembled in `src/preload/index.ts` and exposed on the `window` object (e.g. `window.git`, `window.fs`, `window.pty`). Renderer components and stores call these APIs to communicate with the main process handlers in `src/main/handlers/`. The shared `types.ts` defines data structures used by both the preload APIs and the renderer.

## Files

| File | Description |
|------|-------------|
| `types.ts` | Shared type definitions: `FileEntry`, `GitFileStatus`, `GitStatusResult`, `SearchResult`, `ManagedRepo`, `ConfigData`, and other data structures. |
| `pty.ts` | PTY API: create, write, resize, destroy terminals and subscribe to data events. |
| `config.ts` | Config API: load/save per-profile config, manage profiles, agents, and init scripts. |
| `git.ts` | Git API: status, branching, commits, worktrees, diffs, and sync operations. |
| `gh.ts` | GitHub API: issues, pull requests, code review comments, and auth checks via gh CLI. |
| `fs.ts` | Filesystem API: read/write files, directory listing, search, and file watching. |
| `shell.ts` | Shell API: command execution, native dialogs, app metadata, and auto-updates. |
| `menu.ts` | Menu API: native context menus and TypeScript project introspection. |
| `config.test.ts` | Unit tests for config API. |
| `fs.test.ts` | Unit tests for filesystem API. |
| `git.test.ts` | Unit tests for git API. |
| `gh.test.ts` | Unit tests for GitHub API. |
| `pty.test.ts` | Unit tests for PTY API. |
| `shell.test.ts` | Unit tests for shell API. |
| `menu.test.ts` | Unit tests for menu API. |
