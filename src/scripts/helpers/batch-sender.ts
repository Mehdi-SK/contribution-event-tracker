import { ApicuronClient } from '../../client/apicuron-client/apicuron-client.js'
import { ApicuronRequestError } from '../../client/apicuron-client/apicuron.types.js'
import type { TTrackerEvent } from '../../types/events/index.js'

const MAX_BATCH_BYTES = 900_000 // 0.9MB < 1MB, the backend's batch cap
const MAX_BATCH_EVENTS = 500

/**
 * Queues events and sends them to APICURON in batches packed by size.
 * Call add() for each event, then flush() once at the end.
 */
export class BatchSender {
  readonly totals = { stored: 0, duplicates: 0 }

  private batch: TTrackerEvent[] = []
  private batchBytes = 0

  constructor(private readonly client: ApicuronClient) {}

  /** Queues an event, sending the current batch first if this event would not fit. */
  async add(event: TTrackerEvent): Promise<void> {
    const size = Buffer.byteLength(JSON.stringify(event))
    const wouldOverflow =
      this.batchBytes + size > MAX_BATCH_BYTES ||
      this.batch.length >= MAX_BATCH_EVENTS
    if (this.batch.length > 0 && wouldOverflow) {
      await this.flush()
    }
    this.batch.push(event)
    this.batchBytes += size
  }

  /** Sends whatever is queued. */
  async flush(): Promise<void> {
    if (this.batch.length === 0) return

    const result = await this.send(this.batch)
    this.totals.stored += result.stored
    this.totals.duplicates += result.duplicates
    console.log(
      `Sent ${this.batch.length} events: ${result.stored} stored, ${result.duplicates} already received`
    )

    this.batch = []
    this.batchBytes = 0
  }

  /** One event uses the single route. If a batch is too large (413), split it in half and retry. */
  private async send(
    events: TTrackerEvent[]
  ): Promise<{ stored: number; duplicates: number }> {
    try {
      if (events.length === 1) {
        const result = await this.client.sendEvent(events[0])
        return {
          stored: result.stored ? 1 : 0,
          duplicates: result.stored ? 0 : 1
        }
      }
      const result = await this.client.sendBatch(events)
      return { stored: result.stored, duplicates: result.duplicates }
    } catch (error) {
      const tooLarge =
        error instanceof ApicuronRequestError && error.status === 413
      if (!tooLarge || events.length === 1) throw error

      const middle = Math.ceil(events.length / 2)
      const first = await this.send(events.slice(0, middle))
      const second = await this.send(events.slice(middle))
      return {
        stored: first.stored + second.stored,
        duplicates: first.duplicates + second.duplicates
      }
    }
  }
}
