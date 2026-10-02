import * as github from '@actions/github'

export interface TClosingIssueNode {
  number: number
  url: string
  repository: { databaseId: number; nameWithOwner: string; url: string } | null
  labels: { nodes: { name: string }[] }
}
export class GitHubClient {
  private octokit: ReturnType<typeof github.getOctokit>
  constructor(token: string) {
    this.octokit = github.getOctokit(token)
  }
  async getPullRequest(owner: string, repo: string, number: number) {
    const { data } = await this.octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: number
    })
    return data
  }

  listReviews(owner: string, repo: string, number: number) {
    return this.octokit.paginate(this.octokit.rest.pulls.listReviews, {
      owner,
      repo,
      pull_number: number,
      per_page: 100
    })
  }

  listIssueComments(owner: string, repo: string, number: number) {
    return this.octokit.paginate(this.octokit.rest.issues.listComments, {
      owner,
      repo,
      issue_number: number,
      per_page: 100
    })
  }

  listReviewComments(owner: string, repo: string, number: number) {
    return this.octokit.paginate(this.octokit.rest.pulls.listReviewComments, {
      owner,
      repo,
      pull_number: number,
      per_page: 100
    })
  }

  async getClosingIssues(owner: string, repo: string, number: number) {
    const CLOSING_ISSUES_QUERY = `
    query($owner: String!, $repo: String!, $number: Int!) {
      repository(owner: $owner, name: $repo) {
        pullRequest(number: $number) {
          closingIssuesReferences(first: 50) {
            nodes {
              number
              url
              repository { databaseId nameWithOwner url }
              labels(first: 50) { nodes { name } }
            }
          }
        }
      }
    }`
    const res = await this.octokit.graphql<{
      repository: {
        pullRequest: {
          closingIssuesReferences: { nodes: (TClosingIssueNode | null)[] }
        } | null
      } | null
    }>(CLOSING_ISSUES_QUERY, { owner, repo, number })

    return (
      res.repository?.pullRequest?.closingIssuesReferences.nodes ?? []
    ).filter((n): n is TClosingIssueNode => n !== null)
  }
}
