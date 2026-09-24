import { GitHubClient } from '../client/github/github-client.js'
import * as github from '@actions/github'
import { TReview } from '../types/contribution-payload.type.js'

async function run() {
  const token = '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'
  if (!token) {
    console.error('Error: GITHUB_TOKEN environment variable is not set.')
    process.exit(1)
  }

  // Initialize the client
  GitHubClient.initialize(token)

  // Initialize an octokit instance to list pull requests
  const octokit = github.getOctokit(token)

  const owner = 'BioComputingUP'
  const repo = 'disprot'

  console.log(`Fetching list of pull requests for ${owner}/${repo}...`)
  try {
    // Fetch the 20 most recent PRs (state 'all' gets both open and closed PRs)
    const { data: pulls } = await octokit.rest.pulls.list({
      owner,
      repo,
      state: 'all',
      per_page: 20
    })

    console.log(
      `Found ${pulls.length} pull requests. Fetching reviews for each...\n`
    )

    const allReviews: {
      pullNumber: number
      title: string
      reviews: TReview[]
    }[] = []

    for (const pr of pulls) {
      console.log(`Fetching reviews for PR #${pr.number} (${pr.title})...`)
      try {
        const reviews = await GitHubClient.getPRReviews(owner, repo, pr.number)
        allReviews.push({
          pullNumber: pr.number,
          title: pr.title,
          reviews
        })
      } catch (error: unknown) {
        console.error(
          `Error fetching reviews for PR #${pr.number}:`,
          error instanceof Error ? error.message : error
        )
      }
    }

    console.log('\n--- Final Output ---')
    console.log(JSON.stringify(allReviews, null, 2))
  } catch (error) {
    console.error('Error listing PRs:', error)
  }
}

run()
