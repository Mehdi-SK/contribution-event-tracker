import * as github from '@actions/github'
import * as core from '@actions/core'
import { logger } from './logger/logger.js'
import { GitHubClient } from './client/github/github-client.js'
import { createProcessors } from './processors/processors.js'

export async function run(): Promise<void> {
  try {
    const client = new GitHubClient(
      core.getInput('github-token', { required: true })
    )
    const processors = createProcessors(client)

    const event = github.context.eventName
    const payload = github.context.payload

    const processor = processors.find((p) => p.canHandle(event))
    const trackedEvents = processor ? await processor.process(payload) : []

    logger.info('Output:')
    logger.info(JSON.stringify(trackedEvents, null, 2))
    // TODO: await apicuronClient.send(trackedEvents)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    core.setFailed(message)
  }
}
