import { GitHubClient } from '../client/github/github-client.js'
import { IEventProcessorStrategy } from './processor.interface.js'
import { PRStrategy } from './pull-request/pr.strategy.js'

export const createProcessors = (
  client: GitHubClient
): IEventProcessorStrategy[] => [new PRStrategy(client)]
