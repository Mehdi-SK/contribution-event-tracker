import * as core from '@actions/core'
import chalk from 'chalk'

const format = (msg: unknown): string =>
  typeof msg === 'object' ? JSON.stringify(msg, null, 2) : String(msg)

export const logger = {
  info: (msg: unknown) => {
    console.log(chalk.cyan('ℹ'), format(msg))
  },

  success: (msg: unknown) => {
    console.log(chalk.green('✔'), format(msg))
  },

  debug: (msg: unknown) => {
    core.debug(format(msg))
  },

  warn: (msg: unknown) => {
    const message = format(msg)
    console.log(chalk.yellow('⚠'), message)
    core.warning(message)
  },

  error: (msg: unknown) => {
    const message = format(msg)
    console.log(chalk.red('✖'), message)
    core.error(format(message))
  },

  group: (name: string, fn: () => void | Promise<void>) => {
    core.startGroup(name)
    const result = fn()
    if (result instanceof Promise) {
      return result.finally(() => core.endGroup())
    }
    core.endGroup()
    return result
  }
}
