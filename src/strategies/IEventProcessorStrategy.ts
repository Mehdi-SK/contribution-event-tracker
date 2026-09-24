import { ContributionPayload } from '../types/contribution-payload.type.js'

export interface IEventProcessorStrategy {
  canHandle(event: string): boolean
  process(payload: unknown): Promise<ContributionPayload[] | null>
}
