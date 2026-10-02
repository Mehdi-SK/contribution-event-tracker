import { GitHubClient } from '../../client/github/github-client.js'
import { TTrackerEvent } from '../../types/events/index.js'
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
        throw new Error('Method not implemented.')
    }
    process(payload: any): Promise<TTrackerEvent[]> {
        throw new Error('Method not implemented.')
    }
}
