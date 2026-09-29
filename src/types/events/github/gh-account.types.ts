import { TAccount } from '../shared/account.types.js'

export type TGithubAccount = TAccount<'github'> & { login: string }
