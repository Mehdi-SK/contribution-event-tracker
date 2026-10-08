export const CaptureMode = {
  LIVE: 'live',
  BACKFILL: 'backfill'
} as const

export type TCaptureMode = (typeof CaptureMode)[keyof typeof CaptureMode]

export interface TCapture {
  tool: string
  version: string
  mode: TCaptureMode
  observed_at: string
}
