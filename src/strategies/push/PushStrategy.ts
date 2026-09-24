import { ContributionPayload } from '../../types/contribution-payload.type.js'
import { IEventProcessorStrategy } from '../IEventProcessorStrategy.js'

export class PushStrategy implements IEventProcessorStrategy {
  canHandle(event: string): boolean {
    return event === 'push'
  }
  async process(): Promise<ContributionPayload[] | null> {
    throw new Error('Not implemented')
  }
}
