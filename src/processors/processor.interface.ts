import type { TTrackerEvent } from '../types/events/index.js'
import { GHPullRequestPayload } from '../types/payload/payload.types.js'

export interface IEventProcessorStrategy {
  canHandle(event: string): boolean
  process(payload: unknown): Promise<TTrackerEvent[]>
}

export interface IPRActionHandler {
  canHandle(payload: GHPullRequestPayload): boolean
  process(payload: GHPullRequestPayload): Promise<TTrackerEvent[]>
}
