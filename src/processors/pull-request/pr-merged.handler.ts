import { buildPullRequestEvent } from '../../builders/pull-request.builder.js'
import { captureInfo } from '../../capture/capture-info.js'
import { GitHubClient } from '../../client/github/github-client.js'
import { fetchPullRequestSnapshot } from '../../client/github/pull-request-snapshot.js'
import { logger } from '../../logger/logger.js'
import { TTrackerEvent } from '../../types/events/index.js'
import { CaptureMode } from '../../types/events/shared/capture.types.js'
import { GHPullRequestPayload } from '../../types/payload/payload.types.js'
import { IPRActionHandler } from '../processor.interface.js'

export class PRMergedEventHandler implements IPRActionHandler {
  constructor(private readonly client: GitHubClient) {}
  canHandle(payload: GHPullRequestPayload): boolean {
    const result =
      payload.action === 'closed' && payload.pull_request.merged === true
    logger.debug(
      `PRMergedEventHandler.canHandle: ${payload.action} ${payload.pull_request.merged} → ${result}`
    )
    return result
  }
  async process(payload: GHPullRequestPayload): Promise<TTrackerEvent[]> {
    const { repository, pull_request } = payload
    const snapshot = await fetchPullRequestSnapshot(
      this.client,
      repository.owner.login,
      repository.name,
      pull_request.number,
      pull_request
    )
    const event = buildPullRequestEvent(snapshot, captureInfo(CaptureMode.LIVE))
    return event ? [event] : []
  }
}
