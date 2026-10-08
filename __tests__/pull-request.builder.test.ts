import { describe, expect, it } from '@jest/globals'
import { buildPullRequestEvent } from '../src/builders/pull-request.builder.js'
import { GithubDataSchemas } from '../src/types/events/github/schemas.js'
import { TCapture } from '../src/types/events/shared/capture.types.js'
import {
  TGithubUserSnapshot,
  TPullRequestSnapshot
} from '../src/types/snapshot.types.js'

const CREATED_AT = '2026-09-10T08:00:00Z'
const CLOSED_AT = '2026-09-11T12:56:34Z'
const BEFORE_CLOSE = '2026-09-11T12:56:33Z'
const AFTER_CLOSE = '2026-09-11T12:56:35Z'

const PR_URL = 'https://github.com/BioComputingUP/disprot/pull/127'

const capture: TCapture = {
  tool: 'contribution-event-tracker',
  version: '0.0.0-test',
  mode: 'live',
  observed_at: '2026-09-11T13:00:00Z'
}

const author: TGithubUserSnapshot = {
  id: 70889826,
  login: 'geekn0rd',
  type: 'User'
}
const reviewer: TGithubUserSnapshot = { id: 1001, login: 'alice', type: 'User' }
const merger: TGithubUserSnapshot = { id: 1002, login: 'bob', type: 'User' }
const bot: TGithubUserSnapshot = {
  id: 9001,
  login: 'dependabot[bot]',
  type: 'Bot'
}

type TSnapshotOverrides = Partial<
  Omit<TPullRequestSnapshot, 'pull_request'>
> & {
  pull_request?: Partial<TPullRequestSnapshot['pull_request']>
}

/** A valid merged-PR snapshot; each test overrides only what it needs. */
function makeSnapshot(
  overrides: TSnapshotOverrides = {}
): TPullRequestSnapshot {
  const { pull_request, ...rest } = overrides
  return {
    repository: {
      id: 1171533853,
      full_name: 'BioComputingUP/disprot',
      html_url: 'https://github.com/BioComputingUP/disprot'
    },
    pull_request: {
      id: 555000127,
      number: 127,
      html_url: PR_URL,
      title: 'Fix annotation export',
      base_ref: 'main',
      is_cross_repository: false,
      created_at: CREATED_AT,
      closed_at: CLOSED_AT,
      merged: true,
      labels: [],
      user: author,
      merged_by: merger,
      ...pull_request
    },
    reviews: [],
    issue_comments: [],
    review_comments: [],
    closing_issues: [],
    ...rest
  }
}

const review = (
  id: number,
  user: TGithubUserSnapshot | null,
  submitted_at: string | null,
  state = 'APPROVED'
): TPullRequestSnapshot['reviews'][number] => ({
  id,
  user,
  state,
  submitted_at,
  html_url: `${PR_URL}#pullrequestreview-${id}`
})

const comment = (
  id: number,
  user: TGithubUserSnapshot | null,
  created_at: string,
  review_id?: number
): TPullRequestSnapshot['issue_comments'][number] => ({
  id,
  user,
  created_at,
  html_url: `${PR_URL}#comment-${id}`,
  ...(review_id !== undefined && { review_id })
})

describe('buildPullRequestEvent', () => {
  it('builds the pinned event id and envelope', () => {
    const event = buildPullRequestEvent(makeSnapshot(), capture)

    // This event is already stored in APICURON. The assertion guards the
    // namespace UUID and the id recipe (repository id, PR number, event type,
    // closed_at) against accidental change: a different id here means re-sent
    // and backfilled events would no longer match the stored ones.
    expect(event?.id).toBe('d1b32700-dc81-5d40-98a8-b51fac9e550f')

    expect(event?.specversion).toBe('1.0')
    expect(event?.type).toBe(
      'it.unipd.biocomputingup.github.pull_request.merged'
    )
    expect(event?.source).toBe('github:repository:1171533853')
    expect(event?.subject).toBe('pull_request/127')
    expect(event?.time).toBe(CLOSED_AT)
    expect(event?.datacontenttype).toBe('application/json')
    expect(event?.dataschema).toBe(GithubDataSchemas.PULL_REQUEST_V1)

    expect(event?.data.activities).toContainEqual({
      kind: 'opened',
      account: { system: 'github', id: '70889826', login: 'geekn0rd' },
      at: CREATED_AT
    })
  })

  it('gives deep-equal events when the same snapshot is built twice', () => {
    const snapshot = makeSnapshot({
      pull_request: { labels: ['bug', 'curation'] },
      reviews: [review(300, reviewer, BEFORE_CLOSE)],
      issue_comments: [comment(100, reviewer, BEFORE_CLOSE)],
      review_comments: [comment(200, reviewer, BEFORE_CLOSE, 300)]
    })

    const first = buildPullRequestEvent(snapshot, capture)
    const second = buildPullRequestEvent(snapshot, capture)

    expect(first).not.toBeNull()
    expect(second).toEqual(first)
  })

  it('excludes reviews and comments by bots', () => {
    const event = buildPullRequestEvent(
      makeSnapshot({
        reviews: [review(300, bot, BEFORE_CLOSE)],
        issue_comments: [comment(100, bot, BEFORE_CLOSE)],
        review_comments: [comment(200, bot, BEFORE_CLOSE, 300)]
      }),
      capture
    )

    expect(event?.data.activities.map((a) => a.kind)).toEqual([
      'opened',
      'merged'
    ])
  })

  it('returns null when all activity is by bots', () => {
    const event = buildPullRequestEvent(
      makeSnapshot({
        pull_request: { user: bot, merged_by: bot },
        reviews: [review(300, bot, BEFORE_CLOSE)],
        issue_comments: [comment(100, bot, BEFORE_CLOSE)]
      }),
      capture
    )

    expect(event).toBeNull()
  })

  it('keeps activity at or before closed_at and excludes later activity', () => {
    const event = buildPullRequestEvent(
      makeSnapshot({
        reviews: [
          review(301, reviewer, BEFORE_CLOSE),
          review(302, reviewer, CLOSED_AT),
          review(303, reviewer, AFTER_CLOSE)
        ],
        issue_comments: [
          comment(101, reviewer, BEFORE_CLOSE),
          comment(102, reviewer, CLOSED_AT),
          comment(103, reviewer, AFTER_CLOSE)
        ]
      }),
      capture
    )

    const objectIds = event?.data.activities
      .map((a) => a.object_id)
      .filter((id) => id !== undefined)
      .sort()
    expect(objectIds).toEqual(['101', '102', '301', '302'])
  })

  it('sorts activities by time, then kind, then object id', () => {
    const t1 = '2026-09-10T09:00:00Z'
    const t2 = '2026-09-10T10:00:00Z'
    const event = buildPullRequestEvent(
      makeSnapshot({
        reviews: [review(400, reviewer, t2), review(300, reviewer, t1)],
        issue_comments: [
          comment(200, reviewer, t1),
          comment(500, reviewer, t2)
        ],
        review_comments: [comment(100, reviewer, t1)]
      }),
      capture
    )

    expect(
      event?.data.activities.map((a) => [a.at, a.kind, a.object_id])
    ).toEqual([
      [CREATED_AT, 'opened', undefined],
      [t1, 'commented', '100'],
      [t1, 'commented', '200'],
      [t1, 'reviewed', '300'],
      [t2, 'commented', '500'],
      [t2, 'reviewed', '400'],
      [CLOSED_AT, 'merged', undefined]
    ])
  })

  it('sorts relationships and labels', () => {
    const disprot = {
      id: 1171533853,
      full_name: 'BioComputingUP/disprot',
      html_url: 'https://github.com/BioComputingUP/disprot'
    }
    const other = {
      id: 1171533999,
      full_name: 'BioComputingUP/other',
      html_url: 'https://github.com/BioComputingUP/other'
    }
    const issue = (repository: typeof disprot, number: number) => ({
      repository,
      number,
      html_url: `${repository.html_url}/issues/${number}`,
      labels: ['zeta', 'alpha']
    })

    const event = buildPullRequestEvent(
      makeSnapshot({
        pull_request: { labels: ['feature', 'bug', 'curation'] },
        closing_issues: [issue(other, 3), issue(disprot, 42), issue(disprot, 7)]
      }),
      capture
    )

    expect(event?.data.pull_request.labels).toEqual([
      'bug',
      'curation',
      'feature'
    ])
    expect(
      event?.data.relationships.map((r) => [
        r.target.repository.id,
        r.target.number
      ])
    ).toEqual([
      ['1171533853', 7],
      ['1171533853', 42],
      ['1171533999', 3]
    ])
    for (const relationship of event?.data.relationships ?? []) {
      expect(relationship.target.labels).toEqual(['alpha', 'zeta'])
    }
  })

  it('returns null for an unmerged pull request', () => {
    const event = buildPullRequestEvent(
      makeSnapshot({ pull_request: { merged: false, merged_by: null } }),
      capture
    )

    expect(event).toBeNull()
  })

  it('sets review_object_id only on review-thread comments with a review', () => {
    const event = buildPullRequestEvent(
      makeSnapshot({
        issue_comments: [comment(100, reviewer, BEFORE_CLOSE)],
        review_comments: [comment(200, reviewer, BEFORE_CLOSE, 300)]
      }),
      capture
    )

    const commented = event?.data.activities.filter(
      (a) => a.kind === 'commented'
    )
    const conversation = commented?.find((a) => a.channel === 'conversation')
    const reviewThread = commented?.find((a) => a.channel === 'review_thread')

    expect(reviewThread?.review_object_id).toBe('300')
    expect(conversation).toBeDefined()
    expect(conversation).not.toHaveProperty('review_object_id')
  })
})
