import { GitHubClient } from '../../client/github/github-client.js'
import { logger } from '../../logger/logger.js'
import { TTrackerEvent } from '../../types/events/index.js'
import { GHPullRequestPayload } from '../../types/payload/payload.types.js'
import {
  IEventProcessorStrategy,
  IPRActionHandler
} from '../processor.interface.js'
import { PRMergedEventHandler } from './pr-merged.handler.js'

export class PRStrategy implements IEventProcessorStrategy {
  private readonly handlers: IPRActionHandler[]

  constructor(client: GitHubClient) {
    this.handlers = [new PRMergedEventHandler(client)]
  }
  canHandle(event: string): boolean {
    logger.debug(`Checking if event type: ${event} can be handled`)
    return event === 'pull_request' || event === 'pull_request_target'
  }
  async process(payload: unknown): Promise<TTrackerEvent[]> {
    logger.debug('Processing PR payload')
    const prPayload = payload as GHPullRequestPayload
    const handler = this.handlers.find((h) => h.canHandle(prPayload))
    return handler ? await handler.process(prPayload) : []
  }
}
