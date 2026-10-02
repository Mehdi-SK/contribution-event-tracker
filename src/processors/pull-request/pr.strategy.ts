import { GitHubClient } from '../../client/github/github-client.js'
import { logger } from '../../logger/logger.js'
import { TTrackerEvent } from '../../types/events/index.js'
import { GHPullRequestPayload } from '../../types/payload/payload.types.js'
import {
  IEventProcessorStrategy,
  IPRActionHandler
} from '../processor.interface.js'

export class PRStrategy implements IEventProcessorStrategy {
  private readonly handlers: IPRActionHandler[]

  constructor(client: GitHubClient) {
    this.handlers = []
  }
  canHandle(event: string): boolean {
    logger.debug(`Checking if event type: ${event} can be handled`)
    return event === 'pull_request' || event === 'pull_request_target'
  }
  async process(payload: GHPullRequestPayload): Promise<TTrackerEvent[]> {
    logger.debug('Processing PR payload')
    const handler = this.handlers.find((h) => h.canHandle(payload))
    return handler ? await handler.process(payload) : []
  }
}
