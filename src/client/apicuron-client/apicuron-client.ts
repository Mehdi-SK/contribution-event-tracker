import type { TTrackerEvent } from '../../types/events/index.js'
import {
  ApicuronRequestError,
  TBatchIngestResult,
  TIngestResult
} from './apicuron.types.js'

export const DEFAULT_APICURON_URL = 'https://apicuron.org/api'

export class ApicuronClient {
  constructor(
    private readonly baseUrl: string,
    private readonly token: string
  ) {}

  sendEvent(event: TTrackerEvent): Promise<TIngestResult> {
    return this.post('/tracker-events', event)
  }

  sendBatch(events: TTrackerEvent[]): Promise<TBatchIngestResult> {
    return this.post('/tracker-events/batch', { events })
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl.replace(/\/$/, '')}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        version: '2',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })
    const text = await response.text()
    if (response.status !== 202) {
      throw new ApicuronRequestError(
        response.status,
        `APICURON responded ${response.status}: ${text}`
      )
    }
    return (JSON.parse(text) as { data: T }).data
  }
}
