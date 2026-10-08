import { appendFileSync } from 'fs'
import { buildPullRequestEvent } from '../builders/pull-request.builder.js'
import { captureInfo } from '../capture/capture-info.js'
import { GitHubClient } from '../client/github/github-client.js'
import { fetchPullRequestSnapshot } from '../client/github/pull-request-snapshot.js'
import { CaptureMode } from '../types/events/shared/capture.types.js'
import {
  ApicuronClient,
  DEFAULT_APICURON_URL
} from '../client/apicuron-client/apicuron-client.js'
import { TTrackerEvent } from '../types/events/index.js'
import { BatchSender } from './helpers/batch-sender.js'

interface BackfillConfig {
  owner: string
  repo: string
  githubToken: string
  outFile: string
  apicuron: { url: string; token: string } | null // null: file only
}

function readConfig(): BackfillConfig {
  const [owner, repo, outFile] = process.argv.slice(2)
  const githubToken = process.env.GITHUB_TOKEN
  if (!owner || !repo || !githubToken) {
    throw new Error(
      'Usage: GITHUB_TOKEN=... yarn backfill <owner> <repo> [outFile]'
    )
  }

  const runStamp = new Date().toISOString().replace(/[:.]/g, '-')
  const apicuronToken = process.env.APICURON_TOKEN

  return {
    owner,
    repo,
    githubToken,
    outFile: outFile ?? `backfill-${owner}-${repo}-${runStamp}.jsonl`,
    apicuron: apicuronToken
      ? {
          url: process.env.APICURON_URL ?? DEFAULT_APICURON_URL,
          token: apicuronToken
        }
      : null
  }
}

/** Yields one event per merged pull request in the repository. */
async function* mergedPullRequestEvents(
  github: GitHubClient,
  owner: string,
  repo: string
): AsyncGenerator<TTrackerEvent> {
  for await (const { data: prs } of github.listClosedPullRequests(
    owner,
    repo
  )) {
    for (const pr of prs) {
      if (!pr.merged_at) continue // TODO: handle closed-unmerged

      // pulls.list lacks merged_by, so each PR is fetched individually
      const snapshot = await fetchPullRequestSnapshot(
        github,
        owner,
        repo,
        pr.number
      )
      const event = buildPullRequestEvent(
        snapshot,
        captureInfo(CaptureMode.BACKFILL)
      )
      if (event) yield event
    }
  }
}

async function main(): Promise<void> {
  const config = readConfig()
  const github = new GitHubClient(config.githubToken)
  const sender = config.apicuron
    ? new BatchSender(
        new ApicuronClient(config.apicuron.url, config.apicuron.token)
      )
    : null

  console.log(
    sender
      ? `Sending to ${config.apicuron?.url} and writing ${config.outFile}`
      : `No APICURON_TOKEN: writing ${config.outFile} only`
  )

  let built = 0
  // fetch, append to file, add to batch sender
  for await (const event of mergedPullRequestEvents(
    github,
    config.owner,
    config.repo
  )) {
    appendFileSync(config.outFile, JSON.stringify(event) + '\n')
    built++
    await sender?.add(event)
  }
  // flush any remaining events in the batch sender
  await sender?.flush()

  const sent = sender
    ? `, ${sender.totals.stored} stored, ${sender.totals.duplicates} already received`
    : ''
  console.log(`Done: ${built} events built${sent}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
