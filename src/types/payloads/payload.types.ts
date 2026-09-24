import { EmitterWebhookEvent } from '@octokit/webhooks'

export type GHPushEventPayload = EmitterWebhookEvent<'push'>['payload']
export type GHPullRequestPayload =
  EmitterWebhookEvent<'pull_request'>['payload']
