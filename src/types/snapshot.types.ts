export interface TGithubUserSnapshot {
  id: number
  login: string
  type: string // 'User' | 'Bot' | 'Organization'
}

export interface TGithubRepositorySnapshot {
  id: number
  full_name: string
  html_url: string
}

export interface TCommentSnapshot {
  id: number
  user: TGithubUserSnapshot | null
  created_at: string
  html_url: string
}

export interface TPullRequestSnapshot {
  repository: TGithubRepositorySnapshot
  pull_request: {
    id: number
    number: number
    html_url: string
    title: string
    base_ref: string
    is_cross_repository: boolean
    created_at: string
    closed_at: string
    merged: boolean
    labels: string[]
    user: TGithubUserSnapshot | null
    merged_by: TGithubUserSnapshot | null
  }
  reviews: {
    id: number
    user: TGithubUserSnapshot | null
    state: string
    submitted_at: string | null
    html_url: string
  }[]
  issue_comments: TCommentSnapshot[]
  review_comments: TCommentSnapshot[]
  closing_issues: {
    repository: TGithubRepositorySnapshot
    number: number
    html_url: string
    labels: string[]
  }[]
}

export interface TClosingIssueSnapshot {
  repository: TGithubRepositorySnapshot
  number: number
  html_url: string
  labels: string[]
}