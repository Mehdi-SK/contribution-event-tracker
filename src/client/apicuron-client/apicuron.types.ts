export interface TIngestResult {
  event_id: string
  id: string
  stored: boolean
}

export interface TBatchIngestResult {
  received: number
  stored: number
  duplicates: number
  events: TIngestResult[]
}

export class ApicuronRequestError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message)
  }
}
