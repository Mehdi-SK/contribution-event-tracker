export type TReview = {
  username: string
  state: string
  submitted_at: string
}
export const EventTypes = {
  PULL_REQUEST: 'pull_request',
  RELEASE: 'release',
  ISSUE: 'issue'
} as const

export type EventType = (typeof EventTypes)[keyof typeof EventTypes]

interface BasePayload {
  contribution_id: string
  github_login: string
  repository: string
  timestamp: string
}

export interface PRPayload extends BasePayload {
  event_type: typeof EventTypes.PULL_REQUEST
  context: {
    pr_id: string
    pr_url: string
    target_branch: string
    labels: string[]
    reviewers: TReview[]
    title: string
  }
}

// example for antoher contribution type
export interface ReleasePayload extends BasePayload {
  event_type: typeof EventTypes.RELEASE
  context: {
    release_tag: string
    release_url: string
  }
}

export type ContributionPayload = PRPayload | ReleasePayload
