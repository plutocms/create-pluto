import type { PackageManagerName } from 'nypm'
import path from 'node:path'
import { installDependenciesCommand, runScriptCommand } from 'nypm'

export const PACKAGE_MANAGERS = [
  'npm',
  'pnpm',
  'yarn',
  'bun',
  'deno',
] as const satisfies readonly PackageManagerName[]

export type SupportedPackageManager = (typeof PACKAGE_MANAGERS)[number]

export function isSupportedPackageManager(
  value: unknown
): value is SupportedPackageManager {
  return (
    typeof value === 'string' &&
    (PACKAGE_MANAGERS as readonly string[]).includes(value)
  )
}

/**
 * The package manager that runs the CLI, from `npm_config_user_agent`
 * (for example `pnpm/9.12.0 npm/? node/v22.0.0`). Default `npm`.
 */
export function detectRunningPackageManager(
  userAgent: string | undefined
): SupportedPackageManager {
  const name = userAgent?.split('/')[0]?.trim()
  return isSupportedPackageManager(name) ? name : 'npm'
}

export interface NextStepsInput {
  /** The folder of the new project. */
  projectPath: string
  /** The folder where the CLI runs. */
  cwd: string
  packageManager: SupportedPackageManager
  /** False when the install was skipped or failed. Then the steps include it. */
  installed: boolean
}

/** The commands to run after the CLI: `cd`, the install when needed, and the dev server. */
export function nextStepCommands(input: NextStepsInput): string[] {
  const commands: string[] = []
  const relative = path.relative(input.cwd, input.projectPath)

  if (relative) {
    commands.push(`cd ${relative.includes(' ') ? `"${relative}"` : relative}`)
  }
  if (!input.installed) {
    commands.push(installDependenciesCommand(input.packageManager))
  }
  commands.push(runScriptCommand(input.packageManager, 'dev'))

  return commands
}
