import { logger } from '../../logger/logger.js'
import { ContributionPayload as TContributionPayload } from '../../types/contribution-payload.type.js'
import { GHPullRequestPayload } from '../../types/payload/payload.types.js'
import { IEventProcessorStrategy } from '../IEventProcessorStrategy.js'
import { PRMergedEventHandler } from './handlers/PRMergedEventHandler.js'
import { IPRActionHandler } from './PREventHandler.js'

export class PRStrategy implements IEventProcessorStrategy {
  private readonly handlers: IPRActionHandler[] = [new PRMergedEventHandler()]

  canHandle(event: string): boolean {
    logger.debug(`Checking if event type: ${event} can be handled`)
    return event === 'pull_request'
  }
  async process(
    payload: GHPullRequestPayload
  ): Promise<TContributionPayload[] | null> {
    logger.debug(`Processing PR payload`)
    const handler = this.handlers.find((h) => h.canHandle(payload))
    return handler ? await handler.process(payload) : null
  }
}
