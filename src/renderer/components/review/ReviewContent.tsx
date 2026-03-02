/**
 * Renders the structured review body including overview, change patterns, issues, and pending comments.
 */
import Markdown, { defaultUrlTransform } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import type { ReviewData, PendingComment, CodeLocation } from '../../types/review'
import type { NormalizedComment } from './useReviewData'
import { CollapsibleSection } from './CollapsibleSection'
import { LocationLink, SeverityBadge, ChangeStatusBadge } from './ReviewHelpers'

type SinceLastReviewData = NonNullable<ReviewData['changesSinceLastReview']>
import { PrCommentsSection } from './PrComments'
import { createMarkdownComponents } from '../../utils/markdownComponents'

export { PrCommentsSection }

const compactComponents = createMarkdownComponents('compact')

function urlTransform(url: string): string {
  if (url.startsWith('data:')) return url
  return defaultUrlTransform(url)
}

export function MarkdownBody({ content }: { content: string }) {
  return (
    <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} urlTransform={urlTransform} components={compactComponents}>
      {content}
    </Markdown>
  )
}

function SinceLastReviewSection({
  data,
  directory,
  onClickLocation,
}: {
  data: SinceLastReviewData
  directory: string
  onClickLocation: (location: CodeLocation) => void
}) {
  return (
    <CollapsibleSection title="Since Last Review" defaultOpen={true}>
      <div className="space-y-3">
        <div className="text-sm text-text-primary leading-relaxed">{data.summary}</div>
        {data.responsesToComments.length > 0 && (
          <div>
            <div className="text-xs font-medium text-text-secondary mb-1">Responses to Comments</div>
            <div className="space-y-1.5">
              {data.responsesToComments.map((item, i) => (
                <div key={i} className="text-sm rounded border border-border bg-bg-primary p-2">
                  <div className="flex items-center gap-2">
                    <ChangeStatusBadge status={item.status} />
                    <div className="text-text-secondary text-xs flex-1">{item.comment}</div>
                  </div>
                  <div className="text-text-primary mt-0.5">{item.response}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {data.changePatterns.length > 0 && (
          <div>
            <div className="text-xs font-medium text-text-secondary mb-1">Changes Since Last Review</div>
            <div className="space-y-2">
              {data.changePatterns.map((pattern) => (
                <div key={pattern.id} className="text-sm">
                  <div className="font-medium text-text-primary">{pattern.title}</div>
                  <div className="text-text-secondary mt-0.5 leading-relaxed">{pattern.description}</div>
                  {pattern.locations.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {pattern.locations.map((loc, i) => (
                        <LocationLink key={i} location={loc} directory={directory} onClick={() => onClickLocation(loc)} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </CollapsibleSection>
  )
}

export interface ReviewContentProps {
  reviewData: ReviewData
  comments: PendingComment[]
  unpushedCount: number
  directory: string
  prDescription: string | null
  prGitHubComments: NormalizedComment[]
  prCommentsLoading: boolean
  prCommentsHasMore: boolean
  onLoadOlderComments: () => void
  onClickLocation: (location: CodeLocation) => void
  onDeleteComment: (commentId: string) => void
  repoDir: string
  prNumber: number
  onRefreshComments: () => void
}

export function ReviewContent({
  reviewData,
  comments,
  unpushedCount,
  directory,
  prDescription,
  prGitHubComments,
  prCommentsLoading,
  prCommentsHasMore,
  onLoadOlderComments,
  onClickLocation,
  onDeleteComment,
  repoDir,
  prNumber,
  onRefreshComments,
}: ReviewContentProps) {
  return (
    <>
      {reviewData.changesSinceLastReview && (
        <SinceLastReviewSection data={reviewData.changesSinceLastReview} directory={directory} onClickLocation={onClickLocation} />
      )}

      {prDescription && (
        <CollapsibleSection title="PR Description" defaultOpen={false}>
          <MarkdownBody content={prDescription} />
        </CollapsibleSection>
      )}

      <CollapsibleSection title="Overview" defaultOpen={true}>
        <div className="space-y-3">
          <div>
            <div className="text-xs font-medium text-text-secondary mb-1">Purpose</div>
            <div className="text-sm text-text-primary leading-relaxed">{reviewData.overview.purpose}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-text-secondary mb-1">Approach</div>
            <div className="text-sm text-text-primary leading-relaxed">{reviewData.overview.approach}</div>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Change Patterns" count={reviewData.changePatterns.length}>
        <div className="space-y-3">
          {reviewData.changePatterns.map((pattern) => (
            <div key={pattern.id} className="text-sm">
              <div className="font-medium text-text-primary">{pattern.title}</div>
              <div className="text-text-secondary mt-0.5 leading-relaxed">{pattern.description}</div>
              {pattern.locations.length > 0 && (
                <div className="mt-1 space-y-0.5">
                  {pattern.locations.map((loc, i) => (
                    <LocationLink key={i} location={loc} directory={directory} onClick={() => onClickLocation(loc)} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {reviewData.potentialIssues.length > 0 && (
        <CollapsibleSection title="Potential Issues" count={reviewData.potentialIssues.length}>
          <div className="space-y-3">
            {reviewData.potentialIssues.map((issue) => (
              <div key={issue.id} className="text-sm">
                <div className="flex items-center gap-2">
                  <SeverityBadge severity={issue.severity} />
                  <span className="font-medium text-text-primary">{issue.title}</span>
                </div>
                <div className="text-text-secondary mt-0.5 leading-relaxed">{issue.description}</div>
                {issue.locations.length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {issue.locations.map((loc, i) => (
                      <LocationLink key={i} location={loc} directory={directory} onClick={() => onClickLocation(loc)} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {reviewData.designDecisions.length > 0 && (
        <CollapsibleSection title="Design Decisions" count={reviewData.designDecisions.length}>
          <div className="space-y-3">
            {reviewData.designDecisions.map((decision) => (
              <div key={decision.id} className="text-sm">
                <div className="font-medium text-text-primary">{decision.title}</div>
                <div className="text-text-secondary mt-0.5 leading-relaxed">{decision.description}</div>
                {decision.alternatives && decision.alternatives.length > 0 && (
                  <div className="text-xs text-text-secondary mt-1">
                    <span className="font-medium">Alternatives: </span>
                    {decision.alternatives.join(', ')}
                  </div>
                )}
                {decision.locations.length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {decision.locations.map((loc, i) => (
                      <LocationLink key={i} location={loc} directory={directory} onClick={() => onClickLocation(loc)} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {comments.length > 0 && (
        <CollapsibleSection title="Pending Comments" count={unpushedCount}>
          <div className="space-y-2">
            {comments.map((comment) => (
              <div key={comment.id} className="rounded border border-border bg-bg-primary p-2">
                <div className="flex items-center gap-2 mb-1">
                  <button
                    onClick={() => onClickLocation({ file: comment.file, startLine: comment.line })}
                    className="text-xs text-accent hover:text-accent/80 font-mono truncate transition-colors"
                  >
                    {comment.file.split('/').pop()}:{comment.line}
                  </button>
                  {comment.pushed && (
                    <span className="text-[10px] px-1 py-0.5 rounded bg-green-500/20 text-green-400">pushed</span>
                  )}
                  <button
                    onClick={() => onDeleteComment(comment.id)}
                    className="ml-auto text-text-secondary hover:text-red-400 transition-colors"
                    title="Delete comment"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18" />
                      <path d="M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="text-sm text-text-primary">{comment.body}</div>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {prGitHubComments.length > 0 && (
        <PrCommentsSection
          prGitHubComments={prGitHubComments}
          prCommentsLoading={prCommentsLoading}
          prCommentsHasMore={prCommentsHasMore}
          onLoadOlderComments={onLoadOlderComments}
          onClickLocation={onClickLocation}
          repoDir={repoDir}
          prNumber={prNumber}
          onRefreshComments={onRefreshComments}
        />
      )}
    </>
  )
}
