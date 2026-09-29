export const CaptureMode = {
  Live: 'live',
  Backfill: 'backfill'
} as const

export type TCaptureMode = (typeof CaptureMode)[keyof typeof CaptureMode]

export interface TCapture {
  tool: string
  version: string
  mode: TCaptureMode
  observed_at: string
}
