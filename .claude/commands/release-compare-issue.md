Create a GitHub issue from the release readiness report.

## Steps

1. Read `release-compare/readiness-report.html` to get the readiness analysis.
2. Read `release-compare/comparison.json` to get the raw comparison data.
3. Run `git tag --list 'v*' --sort=-version:refSort | head -n 1` to find the last release tag.
4. Convert the findings into a well-structured GitHub issue with:

   **Title:** `Release readiness: <last-tag> → current`

   **Body:**
   - Summary verdict (Ready / Needs Review / Not Ready)
   - Stats: X changed, Y added, Z removed screenshots
   - List of intentional changes (brief, with commit references)
   - List of changes needing review (with details on why)
   - List of test failures (if any)
   - Action items / recommendations

5. Create the issue using `gh issue create` with:
   - Label: `release` (create the label first if it doesn't exist: `gh label create release --color 0E8A16 --description "Release process" 2>/dev/null || true`)
   - The formatted body

## Formatting

- Use GitHub-flavored markdown
- Use checkboxes (`- [ ]`) for action items
- Keep it scannable — use headers and bullet points
- Reference specific screenshots by their key (e.g., `session-switching/01-initial-sidebar.png`)
