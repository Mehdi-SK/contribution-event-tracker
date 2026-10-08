import { TCapture } from '../src/types/events/shared/capture.types.js'
import {
  TGithubUserSnapshot,
  TPullRequestSnapshot
} from '../src/types/snapshot.types.js'

export const CREATED_AT = '2026-09-10T08:00:00Z'
export const CLOSED_AT = '2026-09-11T12:56:34Z'
export const BEFORE_CLOSE = '2026-09-11T12:56:33Z'
export const AFTER_CLOSE = '2026-09-11T12:56:35Z'

export const PR_URL = 'https://github.com/BioComputingUP/disprot/pull/127'

export const capture: TCapture = {
  tool: 'contribution-event-tracker',
  version: '0.0.0-test',
  mode: 'live',
  observed_at: '2026-09-11T13:00:00Z'
}

export const author: TGithubUserSnapshot = {
  id: 70889826,
  login: 'geekn0rd',
  type: 'User'
}
export const reviewer: TGithubUserSnapshot = {
  id: 1001,
  login: 'alice',
  type: 'User'
}
export const merger: TGithubUserSnapshot = {
  id: 1002,
  login: 'bob',
  type: 'User'
}
export const bot: TGithubUserSnapshot = {
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
export function makeSnapshot(
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

export const review = (
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

export const comment = (
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
