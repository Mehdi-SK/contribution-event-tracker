import {
  TGithubUserSnapshot,
  TCommentSnapshot,
  TPullRequestSnapshot
} from '../../types/snapshot.types.js'

type TUserLike = { id: number; login: string; type?: string } | null | undefined

// Structural subset shared by the webhook payload's pull_request and pulls.get's response
export interface TPullRequestSource {
  id: number
  number: number
  html_url: string
  title: string
  created_at: string
  closed_at: string | null
  merged?: boolean | null
  labels: { name?: string }[]
  user: TUserLike
  merged_by?: TUserLike
  base: {
    ref: string
    repo: { id: number; full_name: string; html_url: string }
  }
  head: { repo: { id: number } | null }
}

export const toUser = (u: TUserLike): TGithubUserSnapshot | null =>
  u ? { id: u.id, login: u.login, type: u.type ?? 'User' } : null
export const toComment = (c: {
  id: number
  user: TUserLike
  created_at: string
  html_url: string
}): TCommentSnapshot => ({
  id: c.id,
  user: toUser(c.user),
  created_at: c.created_at,
  html_url: c.html_url
})

// allow to share the code of extracting the part of the snapshot (PR data, repository)
// from both the webhook payload and the pulls.get response. simply to avoid an extra API call when the webhook already provides the PR data.
// further fields require different handling, so they are not included here.
export function toPullRequestPart(
  pr: TPullRequestSource
): Pick<TPullRequestSnapshot, 'repository' | 'pull_request'> {
  if (!pr.closed_at) throw new Error(`PR #${pr.number} has no closed_at`)
  return {
    repository: {
      id: pr.base.repo.id,
      full_name: pr.base.repo.full_name,
      html_url: pr.base.repo.html_url
    },
    pull_request: {
      id: pr.id,
      number: pr.number,
      html_url: pr.html_url,
      title: pr.title,
      base_ref: pr.base.ref,
      is_cross_repository: !pr.head.repo || pr.head.repo.id !== pr.base.repo.id, // deleted fork → cross-repo
      created_at: pr.created_at,
      closed_at: pr.closed_at,
      merged: pr.merged === true,
      labels: pr.labels.map((l) => l.name ?? '').filter(Boolean),
      user: toUser(pr.user),
      merged_by: toUser(pr.merged_by)
    }
  }
}
