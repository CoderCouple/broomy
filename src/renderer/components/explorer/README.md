# Explorer

Explorer panel components providing tabbed navigation between file tree, source control, search, recent files, and code review views. This is the primary left-panel interface for browsing and managing a session's repository.

## How It Connects

The Explorer is rendered by `Layout.tsx` when the explorer panel is visible. It receives session state (directory, git status, selected file) as props from the parent layout. Source control views call the preload git and GitHub APIs (`window.git`, `window.gh`) for status, commits, and PR data. File selection events propagate up to the file viewer panel. The review tab embeds the `ReviewPanel` from `src/renderer/components/review/`.

## Files

| File | Description |
|------|-------------|
| `index.tsx` | Entry point with tabbed navigation between file tree, source control, search, recent files, and review. |
| `types.ts` | Shared type definitions: `TreeNode`, `ExplorerProps`, `PrComment`, and sub-component props. |
| `icons.tsx` | SVG icon components for the explorer tab bar and file type indicators. |
| `FileTree.tsx` | Recursive file tree with expand/collapse, git status badges, and file selection. |
| `SourceControl.tsx` | Source control tab orchestrating branch, working, commits, comments, and PR views. |
| `SCWorkingView.tsx` | Working changes view: staged/unstaged file lists with commit and sync actions. |
| `SCBranchView.tsx` | Branch information view: current branch, tracking status, ahead/behind counts. |
| `SCCommitsView.tsx` | Commit history view with diff links and commit metadata. |
| `SCCommentsView.tsx` | PR review comments view with inline thread display. |
| `SCPrBanner.tsx` | PR status banner with link to GitHub and refresh button. |
| `SCViewToggle.tsx` | Toggle buttons for switching between source control sub-views. |
| `SearchPanel.tsx` | File and content search panel using the worker-backed search API. |
| `RecentFiles.tsx` | Recently opened files list for quick navigation. |
| `IssuePlanChip.tsx` | Chip indicator showing when a `.broomy/plan.md` file exists for the session. |
| `useSourceControlData.ts` | Hook managing source control data fetching: PR status, branch changes, commits, comments. |
| `useSourceControlActions.ts` | Hook providing git action handlers: commit, sync, push, and PR operations. |
| `FileTree.test.tsx` | Unit tests for file tree. |
| `SourceControl.test.tsx` | Unit tests for source control. |
| `SCWorkingView.test.tsx` | Unit tests for working changes view. |
| `SCBranchView.test.tsx` | Unit tests for branch view. |
| `SCCommitsView.test.tsx` | Unit tests for commits view. |
| `SCCommentsView.test.tsx` | Unit tests for comments view. |
| `SCPrBanner.test.tsx` | Unit tests for PR banner. |
| `SCViewToggle.test.tsx` | Unit tests for view toggle. |
| `SearchPanel.test.tsx` | Unit tests for search panel. |
| `RecentFiles.test.tsx` | Unit tests for recent files. |
| `icons.test.tsx` | Unit tests for icon components. |
| `index.test.tsx` | Unit tests for explorer entry point. |
| `useSourceControlData.test.ts` | Unit tests for source control data hook. |
| `useSourceControlActions.test.ts` | Unit tests for source control actions hook. |
