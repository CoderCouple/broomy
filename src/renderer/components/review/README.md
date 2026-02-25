# Review

Code review panel that generates structured reviews of branch changes and displays GitHub PR comments. The panel reads review data from `.broomy/review.json` on disk (written by the agent) and combines it with live PR comment data from the GitHub API.

## How It Connects

The review panel is rendered as a tab within the Explorer component (`src/renderer/components/explorer/`). It uses preload APIs (`window.gh`, `window.fs`, `window.git`) to fetch PR metadata, read review files, and navigate to code locations. Review generation is triggered by pasting a prompt into the agent terminal. File location clicks propagate to the file viewer panel.

## Files

| File | Description |
|------|-------------|
| `index.tsx` | Top-level `ReviewPanel` orchestrating review display, empty states, and action buttons. |
| `ReviewContent.tsx` | Renders the structured review body: overview, change patterns, issues, and pending comments with Markdown support. |
| `ReviewHelpers.tsx` | Presentational components: location links, severity badges, and change status badges. |
| `PrComments.tsx` | GitHub PR comment threads with inline replies, reactions, filtering, and sort controls. |
| `CollapsibleSection.tsx` | Expandable section component with title, count badge, and toggle arrow. |
| `GitignoreModal.tsx` | Modal prompting the user to add `.broomy` to `.gitignore` before generating a review. |
| `useReviewData.ts` | Hook managing all review panel state: review data, comments, comparison, and GitHub PR metadata. |
| `useReviewActions.ts` | Hook providing action handlers: review generation, comment pushing, gitignore management, file navigation. |
| `useGitHubPrData.ts` | Hook that fetches and paginates GitHub PR description and comments. |
| `useReviewFilePoller.ts` | Hook that polls `.broomy/review.json` and `comments.json` for on-disk changes. |
| `ReviewPanel.test.tsx` | Unit tests for the review panel. |
| `ReviewContent.test.tsx` | Unit tests for review content rendering. |
| `ReviewHelpers.test.tsx` | Unit tests for review helper components. |
| `CollapsibleSection.test.tsx` | Unit tests for collapsible section. |
| `GitignoreModal.test.tsx` | Unit tests for gitignore modal. |
| `useReviewData.test.ts` | Unit tests for review data hook. |
| `useReviewActions.test.ts` | Unit tests for review actions hook. |
