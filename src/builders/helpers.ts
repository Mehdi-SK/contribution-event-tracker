import { TGithubAccount } from '../types/events/github/gh-account.types.js'
import { TGithubUserSnapshot } from '../types/snapshot.types.js'

export const isHuman = (
  u: TGithubUserSnapshot | null
): u is TGithubUserSnapshot => !!u && u.type !== 'Bot'

export const toAccount = (u: TGithubUserSnapshot): TGithubAccount => ({
  system: 'github',
  id: String(u.id),
  login: u.login
})
export const occurredBy = (cutoff: string) => {
  const cutoffMs = Date.parse(cutoff)
  return (at: string | null): at is string => !!at && Date.parse(at) <= cutoffMs
}
