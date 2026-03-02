// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import '../../../test/react-setup'
import { ReviewContent, MarkdownBody } from './ReviewContent'
import type { ReviewData, PendingComment } from '../../types/review'

afterEach(() => {
  cleanup()
})

const defaultGitHubProps = {
  prDescription: null,
  prGitHubComments: [],
  prCommentsLoading: false,
  prCommentsHasMore: false,
  onLoadOlderComments: vi.fn(),
  repoDir: '/test',
  prNumber: 1,
  onRefreshComments: vi.fn(),
}

function makeReviewData(overrides: Partial<ReviewData> = {}): ReviewData {
  return {
    version: 1,
    generatedAt: '2024-01-01T00:00:00.000Z',
    overview: { purpose: 'Fix bugs', approach: 'Refactoring' },
    changePatterns: [],
    potentialIssues: [],
    designDecisions: [],
    ...overrides,
  }
}

describe('ReviewContent', () => {
  it('renders overview section', () => {
    render(
      <ReviewContent
        reviewData={makeReviewData()}

        comments={[]}
        unpushedCount={0}
        directory="/test"
        onClickLocation={vi.fn()}
        onDeleteComment={vi.fn()}
        {...defaultGitHubProps}
      />
    )
    expect(screen.getByText('Overview')).toBeTruthy()
    expect(screen.getByText('Fix bugs')).toBeTruthy()
    expect(screen.getByText('Refactoring')).toBeTruthy()
  })

  it('renders change patterns section', () => {
    render(
      <ReviewContent
        reviewData={makeReviewData({
          changePatterns: [
            { id: 'cp-1', title: 'API Refactor', description: 'Changed endpoints', locations: [] },
          ],
        })}

        comments={[]}
        unpushedCount={0}
        directory="/test"
        onClickLocation={vi.fn()}
        onDeleteComment={vi.fn()}
        {...defaultGitHubProps}
      />
    )
    expect(screen.getByText('Change Patterns')).toBeTruthy()
    // Section is collapsed by default, click to expand
    fireEvent.click(screen.getByText('Change Patterns'))
    expect(screen.getByText('API Refactor')).toBeTruthy()
    expect(screen.getByText('Changed endpoints')).toBeTruthy()
  })

  it('renders potential issues with severity badges', () => {
    render(
      <ReviewContent
        reviewData={makeReviewData({
          potentialIssues: [
            { id: 'pi-1', severity: 'warning', title: 'Missing null check', description: 'Could crash', locations: [] },
            { id: 'pi-2', severity: 'info', title: 'Naming convention', description: 'Could be clearer', locations: [] },
          ],
        })}

        comments={[]}
        unpushedCount={0}
        directory="/test"
        onClickLocation={vi.fn()}
        onDeleteComment={vi.fn()}
        {...defaultGitHubProps}
      />
    )
    expect(screen.getByText('Potential Issues')).toBeTruthy()
    // Section is collapsed by default, click to expand
    fireEvent.click(screen.getByText('Potential Issues'))
    expect(screen.getByText('Missing null check')).toBeTruthy()
    expect(screen.getByText('warning')).toBeTruthy()
    expect(screen.getByText('info')).toBeTruthy()
  })

  it('renders design decisions with alternatives', () => {
    render(
      <ReviewContent
        reviewData={makeReviewData({
          designDecisions: [
            { id: 'dd-1', title: 'Use Zustand', description: 'For state management', alternatives: ['Redux', 'MobX'], locations: [] },
          ],
        })}

        comments={[]}
        unpushedCount={0}
        directory="/test"
        onClickLocation={vi.fn()}
        onDeleteComment={vi.fn()}
        {...defaultGitHubProps}
      />
    )
    expect(screen.getByText('Design Decisions')).toBeTruthy()
    // Section is collapsed by default, click to expand
    fireEvent.click(screen.getByText('Design Decisions'))
    expect(screen.getByText('Use Zustand')).toBeTruthy()
    expect(screen.getByText('Redux, MobX')).toBeTruthy()
  })

  it('renders location links and handles clicks', () => {
    const onClickLocation = vi.fn()
    render(
      <ReviewContent
        reviewData={makeReviewData({
          changePatterns: [
            { id: 'cp-1', title: 'Change', description: 'Desc', locations: [{ file: 'src/app.ts', startLine: 10, endLine: 20 }] },
          ],
        })}

        comments={[]}
        unpushedCount={0}
        directory="/test"
        onClickLocation={onClickLocation}
        onDeleteComment={vi.fn()}
        {...defaultGitHubProps}
      />
    )
    // Open the section first
    fireEvent.click(screen.getByText('Change Patterns'))
    const link = screen.getByText('src/app.ts:10-20')
    fireEvent.click(link)
    expect(onClickLocation).toHaveBeenCalledWith({ file: 'src/app.ts', startLine: 10, endLine: 20 })
  })

  it('renders pending comments section', () => {
    const comments: PendingComment[] = [
      { id: 'c-1', file: '/test/src/app.ts', line: 5, body: 'Consider adding error handling', createdAt: '2024-01-01', pushed: false },
      { id: 'c-2', file: '/test/src/utils.ts', line: 10, body: 'Good pattern', createdAt: '2024-01-01', pushed: true },
    ]
    render(
      <ReviewContent
        reviewData={makeReviewData()}

        comments={comments}
        unpushedCount={1}
        directory="/test"
        onClickLocation={vi.fn()}
        onDeleteComment={vi.fn()}
        {...defaultGitHubProps}
      />
    )
    expect(screen.getByText('Pending Comments')).toBeTruthy()
  })

  it('shows pushed badge for pushed comments', () => {
    const comments: PendingComment[] = [
      { id: 'c-1', file: '/test/src/app.ts', line: 5, body: 'Good stuff', createdAt: '2024-01-01', pushed: true },
    ]
    render(
      <ReviewContent
        reviewData={makeReviewData()}

        comments={comments}
        unpushedCount={0}
        directory="/test"
        onClickLocation={vi.fn()}
        onDeleteComment={vi.fn()}
        {...defaultGitHubProps}
      />
    )
    // Open the section
    fireEvent.click(screen.getByText('Pending Comments'))
    expect(screen.getByText('pushed')).toBeTruthy()
  })

  it('calls onDeleteComment when delete button is clicked', () => {
    const onDeleteComment = vi.fn()
    const comments: PendingComment[] = [
      { id: 'c-1', file: '/test/src/app.ts', line: 5, body: 'Delete me', createdAt: '2024-01-01' },
    ]
    render(
      <ReviewContent
        reviewData={makeReviewData()}

        comments={comments}
        unpushedCount={1}
        directory="/test"
        onClickLocation={vi.fn()}
        onDeleteComment={onDeleteComment}
        {...defaultGitHubProps}
      />
    )
    fireEvent.click(screen.getByText('Pending Comments'))
    const deleteBtn = screen.getByTitle('Delete comment')
    fireEvent.click(deleteBtn)
    expect(onDeleteComment).toHaveBeenCalledWith('c-1')
  })

  it('renders changesSinceLastReview section from reviewData', () => {
    render(
      <ReviewContent
        reviewData={makeReviewData({
          changesSinceLastReview: {
            summary: 'Several improvements made',
            responsesToComments: [{ comment: 'Fix bug', response: 'Fixed in latest commit', status: 'addressed' }],
            changePatterns: [{ id: 'cp-1', title: 'Logging', description: 'Added logging', locations: [] }],
          },
        })}

        comments={[]}
        unpushedCount={0}
        directory="/test"
        onClickLocation={vi.fn()}
        onDeleteComment={vi.fn()}
        {...defaultGitHubProps}
      />
    )
    expect(screen.getByText('Since Last Review')).toBeTruthy()
    expect(screen.getByText('Several improvements made')).toBeTruthy()
  })

  it('hides potential issues section when empty', () => {
    render(
      <ReviewContent
        reviewData={makeReviewData({ potentialIssues: [] })}

        comments={[]}
        unpushedCount={0}
        directory="/test"
        onClickLocation={vi.fn()}
        onDeleteComment={vi.fn()}
        {...defaultGitHubProps}
      />
    )
    expect(screen.queryByText('Potential Issues')).toBeNull()
  })

  it('hides design decisions section when empty', () => {
    render(
      <ReviewContent
        reviewData={makeReviewData({ designDecisions: [] })}

        comments={[]}
        unpushedCount={0}
        directory="/test"
        onClickLocation={vi.fn()}
        onDeleteComment={vi.fn()}
        {...defaultGitHubProps}
      />
    )
    expect(screen.queryByText('Design Decisions')).toBeNull()
  })

  it('renders PR description section when prDescription is provided', () => {
    render(
      <ReviewContent
        reviewData={makeReviewData()}

        comments={[]}
        unpushedCount={0}
        directory="/test"
        onClickLocation={vi.fn()}
        onDeleteComment={vi.fn()}
        {...defaultGitHubProps}
        prDescription="## My PR\n\nThis is the description."
      />
    )
    expect(screen.getByText('PR Description')).toBeTruthy()
  })

  it('does not render PR description section when prDescription is null', () => {
    render(
      <ReviewContent
        reviewData={makeReviewData()}

        comments={[]}
        unpushedCount={0}
        directory="/test"
        onClickLocation={vi.fn()}
        onDeleteComment={vi.fn()}
        {...defaultGitHubProps}
        prDescription={null}
      />
    )
    expect(screen.queryByText('PR Description')).toBeNull()
  })

  it('renders PrCommentsSection when prGitHubComments is non-empty', () => {
    render(
      <ReviewContent
        reviewData={makeReviewData()}

        comments={[]}
        unpushedCount={0}
        directory="/test"
        onClickLocation={vi.fn()}
        onDeleteComment={vi.fn()}
        {...defaultGitHubProps}
        prGitHubComments={[
          { id: 1, body: 'Comment', author: 'alice', createdAt: '2024-01-01T00:00:00Z', url: 'url1', type: 'issue' },
        ]}
      />
    )
    expect(screen.getByText('PR Comments')).toBeTruthy()
  })

  it('does not render PrCommentsSection when prGitHubComments is empty', () => {
    render(
      <ReviewContent
        reviewData={makeReviewData()}

        comments={[]}
        unpushedCount={0}
        directory="/test"
        onClickLocation={vi.fn()}
        onDeleteComment={vi.fn()}
        {...defaultGitHubProps}
      />
    )
    expect(screen.queryByText('PR Comments')).toBeNull()
  })

  it('renders since last review with responses to comments and status badges', () => {
    render(
      <ReviewContent
        reviewData={makeReviewData({
          changesSinceLastReview: {
            summary: 'Summary text',
            responsesToComments: [
              { comment: 'Original question', response: 'Addressed it', status: 'addressed' },
            ],
            changePatterns: [],
          },
        })}

        comments={[]}
        unpushedCount={0}
        directory="/test"
        onClickLocation={vi.fn()}
        onDeleteComment={vi.fn()}
        {...defaultGitHubProps}
      />
    )
    expect(screen.getByText('Summary text')).toBeTruthy()
    expect(screen.getByText('Responses to Comments')).toBeTruthy()
    expect(screen.getByText('Original question')).toBeTruthy()
    expect(screen.getByText('Addressed it')).toBeTruthy()
    expect(screen.getByText('Addressed')).toBeTruthy()
  })

  it('renders since last review with change patterns', () => {
    render(
      <ReviewContent
        reviewData={makeReviewData({
          changesSinceLastReview: {
            summary: 'Summary',
            responsesToComments: [],
            changePatterns: [
              { id: 'cp-1', title: 'Test additions', description: 'Added unit tests', locations: [{ file: 'src/test.ts', startLine: 1 }] },
              { id: 'cp-2', title: 'Lint fixes', description: 'Fixed lint errors', locations: [] },
            ],
          },
        })}

        comments={[]}
        unpushedCount={0}
        directory="/test"
        onClickLocation={vi.fn()}
        onDeleteComment={vi.fn()}
        {...defaultGitHubProps}
      />
    )
    expect(screen.getByText('Changes Since Last Review')).toBeTruthy()
    expect(screen.getByText('Test additions')).toBeTruthy()
    expect(screen.getByText('Lint fixes')).toBeTruthy()
  })

  it('navigates to pending comment location on click', () => {
    const onClickLocation = vi.fn()
    const comments: PendingComment[] = [
      { id: 'c-1', file: '/test/src/app.ts', line: 5, body: 'Fix this', createdAt: '2024-01-01' },
    ]
    render(
      <ReviewContent
        reviewData={makeReviewData()}

        comments={comments}
        unpushedCount={1}
        directory="/test"
        onClickLocation={onClickLocation}
        onDeleteComment={vi.fn()}
        {...defaultGitHubProps}
      />
    )
    fireEvent.click(screen.getByText('Pending Comments'))
    const fileLink = screen.getByText('app.ts:5')
    fireEvent.click(fileLink)
    expect(onClickLocation).toHaveBeenCalledWith({ file: '/test/src/app.ts', startLine: 5 })
  })
})

describe('MarkdownBody', () => {
  it('renders markdown content', () => {
    render(<MarkdownBody content="**bold text**" />)
    expect(screen.getByText('bold text')).toBeTruthy()
  })

  it('renders links that open externally', () => {
    render(<MarkdownBody content="[Link](https://example.com)" />)
    const link = screen.getByText('Link')
    fireEvent.click(link)
    expect(window.shell.openExternal).toHaveBeenCalledWith('https://example.com')
  })

  it('renders inline code', () => {
    render(<MarkdownBody content="Use `foo()` here" />)
    expect(screen.getByText('foo()')).toBeTruthy()
  })

  it('renders paragraphs', () => {
    render(<MarkdownBody content="Hello world" />)
    const el = screen.getByText('Hello world')
    expect(el.tagName).toBe('P')
  })

  it('renders headings', () => {
    render(<MarkdownBody content={"# Title\n\nBody"} />)
    expect(screen.getByText('Title').tagName).toBe('H1')
  })

  it('renders horizontal rules', () => {
    const { container } = render(<MarkdownBody content={"Above\n\n---\n\nBelow"} />)
    expect(container.querySelector('hr')).toBeTruthy()
  })
})
