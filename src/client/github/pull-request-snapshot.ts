import {
  TPullRequestSnapshot,
  TClosingIssueSnapshot
} from '../../types/snapshot.types.js'
import { GitHubClient } from './github-client.js'
import { TPullRequestSource, toPullRequestPart, toUser, toComment } from './helpers.js';

export async function fetchPullRequestSnapshot(
  client: GitHubClient,
  owner: string,
  repo: string,
  number: number,
  prefetched?: TPullRequestSource // avoids an extra API call if the webhook provides it
): Promise<TPullRequestSnapshot> {
  const pr: TPullRequestSource =
    prefetched ?? (await client.getPullRequest(owner, repo, number))

  const [reviews, issueComments, reviewComments, closingNodes] =
    await Promise.all([
      client.listReviews(owner, repo, number),
      client.listIssueComments(owner, repo, number),
      client.listReviewComments(owner, repo, number),
      client.getClosingIssues(owner, repo, number)
    ])

  const closingIssues: TClosingIssueSnapshot[] = closingNodes
    .filter((n) => n.repository !== null) // apparently can be null for some reason...
    .map((n) => ({
      repository: {
        id: n.repository!.databaseId,
        full_name: n.repository!.nameWithOwner,
        html_url: n.repository!.url
      },
      number: n.number,
      html_url: n.url,
      labels: n.labels.nodes.map((l) => l.name)
    }))

  return {
    ...toPullRequestPart(pr),
    reviews: reviews.map((r) => ({
      id: r.id,
      user: toUser(r.user),
      state: r.state,
      submitted_at: r.submitted_at ?? null,
      html_url: r.html_url
    })),
    issue_comments: issueComments.map(toComment),
    review_comments: reviewComments.map((c) => ({ ...toComment(c), review_id: c.pull_request_review_id ?? undefined })),
    closing_issues: closingIssues
  }
}
