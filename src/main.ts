import * as github from '@actions/github'
import * as core from '@actions/core'
import { logger } from './logger/logger.js'
import { GitHubClient } from './client/github/github-client.js'
import { createProcessors } from './processors/processors.js'
import {
  ApicuronClient,
  DEFAULT_APICURON_URL
} from './client/apicuron-client/apicuron-client.js'

// Safety invariant: this action runs under `pull_request_target`, with access to
// secrets. It only reads PR metadata through the API and must never check out
// or execute the PR's code.
export async function run(): Promise<void> {
  try {
    const dryRun = core.getBooleanInput('dry-run')
    const token = core.getInput('apicuron-token')
    if (!dryRun && !token) {
      throw new Error('apicuron-token is required unless dry-run is true')
    }

    const client = new GitHubClient(
      core.getInput('github-token', { required: true })
    )
    const processors = createProcessors(client)

    const processor = processors.find((p) =>
      p.canHandle(github.context.eventName)
    )
    const trackedEvents = processor
      ? await processor.process(github.context.payload)
      : []

    if (trackedEvents.length === 0) {
      logger.info('No event to send')
      return
    }
    if (dryRun) {
      logger.info('Dry run, not sending:')
      logger.info(JSON.stringify(trackedEvents, null, 2))
      return
    }

    const apicuron = new ApicuronClient(
      core.getInput('apicuron-url') || DEFAULT_APICURON_URL,
      token
    )
    for (const event of trackedEvents) {
      const result = await apicuron.sendEvent(event)
      logger.info(
        `Event ${result.event_id}: ${result.stored ? 'stored' : 'already received'}`
      )
    }
  } catch (error) {
    core.setFailed(error instanceof Error ? error.message : String(error))
  }
}
