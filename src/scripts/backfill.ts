import { appendFileSync } from 'fs'
import { buildPullRequestEvent } from '../builders/pull-request.builder.js'
import { captureInfo } from '../capture/capture-info.js'
import { GitHubClient } from '../client/github/github-client.js'
import { fetchPullRequestSnapshot } from '../client/github/pull-request-snapshot.js'
import { CaptureMode } from '../types/events/shared/capture.types.js'

async function main() {
  const [owner, repo, outFile = `backfill-${repo}.jsonl`] =
    process.argv.slice(2)
  const token = process.env.GITHUB_TOKEN
  if (!owner || !repo || !token) {
    throw new Error(
      'Usage: GITHUB_TOKEN=... tsx scripts/backfill.ts <owner> <repo> [outFile]'
    )
  }

  const client = new GitHubClient(token)
  let emitted = 0
  let skipped = 0

  for await (const { data: prs } of client.listClosedPullRequests(
    owner,
    repo
  )) {
    for (const pr of prs) {
      if (!pr.merged_at) continue // TODO: handle closed-unmerged

      // pulls.list lacks merged_by, so fetch each PR individually (no prefetched)
      const snapshot = await fetchPullRequestSnapshot(
        client,
        owner,
        repo,
        pr.number
      )
      const event = buildPullRequestEvent(
        snapshot,
        captureInfo(CaptureMode.BACKFILL)
      )

      if (event) {
        appendFileSync(outFile, JSON.stringify(event) + '\n')
        emitted++
      } else {
        skipped++
      }
    }
    //TODO: send to apicuron in batches instead of writing to file
  }

  console.log(
    `Done: ${emitted} events written to ${outFile}, ${skipped} PRs produced no event`
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
