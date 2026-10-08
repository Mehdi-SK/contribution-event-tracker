import { TGithubRepositoryRef } from './gh-repository.types.js'

export interface TGithubIssueTarget {
  system: 'github'
  kind: 'issue'
  repository: TGithubRepositoryRef
  number: number
  url: string
  labels: string[]
}
