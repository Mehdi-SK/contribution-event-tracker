import { TRACKER_VERSION } from '../generated/version.js'
import { type TCapture, type TCaptureMode } from '../types/events/shared/capture.types.js'


export const captureInfo = (mode: TCaptureMode): TCapture => ({
  tool: 'contribution-event-tracker',
  version: TRACKER_VERSION,
  mode,
  observed_at: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'), // second precision, GitHub's format
})