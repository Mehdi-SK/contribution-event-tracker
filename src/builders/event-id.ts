import { v5 as uuidv5 } from 'uuid'

const TRACKER_NAMESPACE = 'abe70222-8b1c-4ff1-84be-d290a6b88202'

export const buildEventId = (
  repositoryId: string,
  number: number,
  type: string,
  closedAt: string
): string =>
  uuidv5(
    `${repositoryId}:pull_request:${number}:${type}:${closedAt}`,
    TRACKER_NAMESPACE
  )
