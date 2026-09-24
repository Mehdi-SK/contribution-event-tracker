import { GitHubClient } from './client/github/github-client.js'
import { processors } from './strategies/index.js'
import * as github from '@actions/github'
import * as core from '@actions/core'
import { logger } from './logger/logger.js'

async function initializeClients(): Promise<void> {
  GitHubClient.initialize(core.getInput('github-token', { required: true }))
}

export async function run(): Promise<void> {
  try {
    await initializeClients()

    const event = github.context.eventName
    const payload = github.context.payload

    const processor = processors.find((p) => p.canHandle(event))
    const trackedEvents = processor ? await processor.process(payload) : null

    logger.info('Output:')
    logger.info(JSON.stringify(trackedEvents, null, 2))
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    core.setFailed(message)
  }
}
