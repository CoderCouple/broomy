# Hooks

Custom React hooks that extract reusable logic from the renderer's components. Each hook encapsulates a specific concern -- file operations, keyboard handling, terminal setup, git polling, or layout mechanics -- keeping components focused on rendering.

## How It Connects

Hooks are consumed by top-level components in `src/renderer/components/` and `Layout.tsx`. They depend on the Zustand stores in `src/renderer/store/`, the preload APIs on `window.*`, and utility functions in `src/renderer/utils/`. The `usePanelsMap` hook ties into the panel registry from `src/renderer/panels/`.

## Files

| File | Description |
|------|-------------|
| `useFileViewer.ts` | Orchestrates file viewing: combines file loading, diff computation, and file watching into a single hook. |
| `useFileLoading.ts` | Loads file content from disk and determines the appropriate viewer plugin. |
| `useFileDiff.ts` | Fetches git diff content for side-by-side or inline diff display. |
| `useFileNavigation.ts` | Manages file navigation state with pending-navigation support for unsaved changes. |
| `useFileWatcher.ts` | Subscribes to filesystem change events and reloads file content on external edits. |
| `useFileTree.ts` | Manages file tree state: expansion, lazy loading of directories, and git status overlay. |
| `useGitPolling.ts` | Polls git status on user action and computes branch status from local git data. |
| `useTerminalSetup.ts` | Initializes xterm.js terminals with PTY connections, addons, and buffer registry. |
| `useTerminalKeyboard.ts` | Custom key event handler for xterm.js: Shift+Enter, Cmd shortcuts, and panel toggles. |
| `ptyDataHandler.ts` | Processes incoming PTY data: activity detection, viewport sync, and scroll tracking. |
| `useDividerResize.ts` | Drag-to-resize logic for layout dividers between panels. |
| `useLayoutKeyboard.ts` | Global keyboard shortcuts for panel toggles (Cmd+1 through Cmd+6) and app actions. |
| `useSessionKeyboardCallbacks.ts` | Session-level keyboard callbacks: switch sessions, create/archive sessions. |
| `useSessionLifecycle.ts` | Session mount/unmount side effects: terminal cleanup, Monaco context loading, focus management. |
| `useAppCallbacks.ts` | Top-level app action callbacks: session CRUD, layout changes, PR state updates. |
| `useErrorBanners.ts` | Convenience hooks for accessing the most recent undismissed error at each scope level. |
| `useHelpMenu.ts` | Listens for help menu events and manages help/shortcuts modal visibility. |
| `useMonacoComments.ts` | Manages inline comment decorations and pending comment state in the Monaco editor. |
| `usePanelsMap.tsx` | Builds the panel ID to React component map for the current session. |
| `usePlanDetection.ts` | Detects plan file paths in terminal output using a rolling buffer pattern. |
| `useIssuePlanDetection.ts` | Watches for `.broomy/plan.md` existence in a session's directory via filesystem events. |
| `useUpdateState.ts` | Zustand store and hook for auto-update lifecycle state (idle, available, downloading, ready). |
| `useAppCallbacks.test.ts` | Unit tests for app callbacks. |
| `useDividerResize.test.ts` | Unit tests for divider resize. |
| `useErrorBanners.test.ts` | Unit tests for error banners. |
| `useFileDiff.test.ts` | Unit tests for file diff. |
| `useFileLoading.test.ts` | Unit tests for file loading. |
| `useFileNavigation.test.ts` | Unit tests for file navigation. |
| `useFileTree.test.ts` | Unit tests for file tree. |
| `useFileViewer.test.ts` | Unit tests for file viewer. |
| `useFileWatcher.test.ts` | Unit tests for file watcher. |
| `useGitPolling.test.ts` | Unit tests for git polling. |
| `useHelpMenu.test.ts` | Unit tests for help menu. |
| `useIssuePlanDetection.test.ts` | Unit tests for issue plan detection. |
| `useLayoutKeyboard.test.ts` | Unit tests for layout keyboard. |
| `useMonacoComments.test.ts` | Unit tests for Monaco comments. |
| `usePanelsMap.test.tsx` | Unit tests for panels map. |
| `usePlanDetection.test.ts` | Unit tests for plan detection. |
| `useSessionKeyboardCallbacks.test.ts` | Unit tests for session keyboard callbacks. |
| `useSessionLifecycle.test.ts` | Unit tests for session lifecycle. |
| `useTerminalKeyboard.test.ts` | Unit tests for terminal keyboard. |
| `useTerminalSetup.test.ts` | Unit tests for terminal setup. |
| `useUpdateState.test.ts` | Unit tests for update state. |
