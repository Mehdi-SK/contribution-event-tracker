import { TCapture } from '../shared/capture.types.js'
import { TEventEnvelope } from '../shared/envelope.types.js'
import { TRelationship } from '../shared/relationship.types.js'
import { TGithubAccount } from './gh-account.types.js'
import { GithubEventTypes } from './gh-event.types.js'
import { TGithubRepositoryRef } from './gh-repository.types.js'
import { TGithubIssueTarget } from './gh-targets.types.js'

export interface TPullRequestRelationship extends TRelationship<
  'closes',
  TGithubIssueTarget
> {}

// 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'DISMISSED'
export const ReviewState = {
  APPROVED: 'APPROVED',
  CHANGES_REQUESTED: 'CHANGES_REQUESTED',
  COMMENTED: 'COMMENTED',
  DISMISSED: 'DISMISSED'
} as const
export type TReviewState = (typeof ReviewState)[keyof typeof ReviewState]

interface TActivityBase {
  account: TGithubAccount
  at: string
  object_id?: string
  url?: string
}
export type TPullRequestActivity =
  | (TActivityBase & { kind: 'opened' })
  | (TActivityBase & {
      kind: 'reviewed'
      state: TReviewState
      object_id: string
      url: string
    })
  | (TActivityBase & {
      kind: 'commented'
      channel: 'conversation' | 'review_thread'
      object_id: string
      url: string
    })
  | (TActivityBase & { kind: 'merged' })

export interface TPullRequestData {
  repository: TGithubRepositoryRef
  pull_request: {
    id: string
    /**
     * @asType integer
     */
    number: number
    url: string
    title: string
    base_ref: string
    is_cross_repository: boolean
    created_at: string
    closed_at: string
    merged: boolean
    labels: string[]
  }
  /** @minItems 1 */
  activities: TPullRequestActivity[]
  relationships: TPullRequestRelationship[]
  capture: TCapture
}

export type TPullRequestMergedEvent = TEventEnvelope<
  typeof GithubEventTypes.PULL_REQUEST_MERGED,
  TPullRequestData
>
