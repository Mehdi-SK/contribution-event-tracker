import { ContributionPayload } from '../../../types/contribution-payload.type.js'
import { GHPullRequestPayload } from '../../../types/payloads/payload.types.js'

export async function extractAuthors(
  payload: GHPullRequestPayload
): Promise<ContributionPayload[]> {
  throw new Error('Method not implemented.')
}
