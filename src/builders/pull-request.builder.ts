import { GithubEventTypes } from '../types/events/github/gh-event.types.js'
import {
  TPullRequestActivity,
  TPullRequestMergedEvent,
  TPullRequestRelationship,
  TReviewState
} from '../types/events/github/pull-request.types.js'
import { GithubDataSchemas } from '../types/events/github/schemas.js'
import { TCapture } from '../types/events/shared/capture.types.js'
import {
  TCommentSnapshot,
  TPullRequestSnapshot
} from '../types/snapshot.types.js'
import { buildEventId } from './event-id.js'
import { isHuman, occurredBy, toAccount } from './helpers.js'

const REVIEW_STATES: ReadonlySet<string> = new Set<TReviewState>([
  'APPROVED',
  'CHANGES_REQUESTED',
  'COMMENTED',
  'DISMISSED'
])

export function buildPullRequestEvent(
  s: TPullRequestSnapshot,
  capture: TCapture
): TPullRequestMergedEvent | null {
  const pr = s.pull_request
  if (!pr.merged) return null // TODO: implement closed-unmerged
  const beforeClose = occurredBy(pr.closed_at)

  // ======= Activities ========
  const activities: TPullRequestActivity[] = []

  if (isHuman(pr.user)) {
    activities.push({
      kind: 'opened',
      account: toAccount(pr.user),
      at: pr.created_at
    })
  }

  for (const review of s.reviews) {
    if (
      // ignore bot reviews, unknown review states, and reviews submitted after the PR was closed
      !isHuman(review.user) ||
      !REVIEW_STATES.has(review.state) ||
      !beforeClose(review.submitted_at)
    )
      continue
    activities.push({
      kind: 'reviewed',
      account: toAccount(review.user),
      at: review.submitted_at,
      state: review.state as TReviewState, // already checked
      object_id: String(review.id),
      url: review.html_url
    })
  }

  const pushComments = (
    list: TCommentSnapshot[],
    channel: 'conversation' | 'review_thread'
  ) => {
    for (const c of list) {
      if (!isHuman(c.user) || !beforeClose(c.created_at)) continue
      activities.push({
        kind: 'commented',
        account: toAccount(c.user),
        at: c.created_at,
        channel,
        object_id: String(c.id),
        url: c.html_url,
        ...(c.review_id !== undefined && {
          review_object_id: String(c.review_id)
        })
      })
    }
  }
  pushComments(s.issue_comments, 'conversation')
  pushComments(s.review_comments, 'review_thread')

  if (isHuman(pr.merged_by)) {
    activities.push({
      kind: 'merged',
      account: toAccount(pr.merged_by),
      at: pr.closed_at
    })
  }

  if (activities.length === 0) return null

  // Deterministic order: API ordering is not guaranteed identical between runs
  activities.sort(
    (a, b) =>
      a.at.localeCompare(b.at) ||
      a.kind.localeCompare(b.kind) ||
      (a.object_id ?? '').localeCompare(b.object_id ?? '')
  )
  // ======= Relationships ========
  const relationships: TPullRequestRelationship[] = s.closing_issues
    .map((i) => ({
      relation: 'closes' as const,
      target: {
        system: 'github' as const,
        kind: 'issue' as const,
        repository: {
          id: String(i.repository.id),
          full_name: i.repository.full_name,
          url: i.repository.html_url
        },
        number: i.number,
        url: i.html_url,
        labels: [...i.labels].sort()
      }
    }))
    .sort(
      (a, b) =>
        a.target.repository.id.localeCompare(b.target.repository.id) ||
        a.target.number - b.target.number
    )

  const repositoryId = String(s.repository.id) // for cloudEvents, the id type should be unified across all sources
  const type = GithubEventTypes.PULL_REQUEST_MERGED

  return {
    specversion: '1.0',
    id: buildEventId(repositoryId, pr.number, type, pr.closed_at),
    source: `github:repository:${repositoryId}`,
    type,
    subject: `pull_request/${pr.number}`,
    time: pr.closed_at,
    datacontenttype: 'application/json',
    dataschema: GithubDataSchemas.PULL_REQUEST_V1,
    data: {
      repository: {
        id: repositoryId,
        full_name: s.repository.full_name,
        url: s.repository.html_url
      },
      pull_request: {
        id: String(pr.id),
        number: pr.number,
        url: pr.html_url,
        title: pr.title,
        base_ref: pr.base_ref,
        is_cross_repository: pr.is_cross_repository,
        created_at: pr.created_at,
        closed_at: pr.closed_at,
        merged: true,
        labels: [...pr.labels].sort()
      },
      activities,
      relationships,
      capture
    }
  }
}
