import { PRPayload } from '../../types/contribution-payload.type.js'
import { GHPullRequestPayload } from '../../types/payloads/payload.types.js'

export interface IPRActionHandler {
  canHandle(payload: GHPullRequestPayload, action?: string): boolean
  process(payload: GHPullRequestPayload): PRPayload[] | Promise<PRPayload[]>
}
