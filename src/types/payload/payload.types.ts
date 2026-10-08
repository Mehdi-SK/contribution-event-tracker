import { EmitterWebhookEvent } from '@octokit/webhooks'

export type GHPullRequestPayload =
  EmitterWebhookEvent<'pull_request'>['payload']
