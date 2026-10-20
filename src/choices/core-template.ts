import { randomBytes } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { cancel, isCancel, log, password, text } from '@clack/prompts'

export interface CoreValues {
  repo: string
  appSlug: string
  appId: string
  clientId: string
  clientSecret: string
  privateKeyPath: string
}

export interface CoreSetupOptions {
  // False skips every prompt and uses the defaults (empty values).
  interactive?: boolean
}

const REPO_PATTERN = /^[\w.-]+\/[\w.-]+$/
const LINE_BREAK_PATTERN = /\r?\n/
const QUOTED_PATTERN = /^(["'])(.*)\1$/

export function isValidRepo(value: string) {
  return REPO_PATTERN.test(value)
}

// Turn a PEM file into one line. Real line breaks become literal "\n".
export function flattenPrivateKey(pem: string) {
  return pem.trim().split(LINE_BREAK_PATTERN).join('\\n')
}

function stripQuotes(value: string) {
  return value.trim().replace(QUOTED_PATTERN, '$2')
}

async function ask(
  prompt: typeof text | typeof password,
  message: string,
  extra: Record<string, unknown> = {}
) {
  const answer = await (prompt as typeof text)({ message, ...extra })

  if (isCancel(answer)) {
    cancel('Operation cancelled.')
    process.exit(0)
  }

  return (answer ?? '').toString().trim()
}

export async function setupCore(
  options: CoreSetupOptions = {}
): Promise<CoreValues> {
  const values: CoreValues = {
    repo: '',
    appSlug: '',
    appId: '',
    clientId: '',
    clientSecret: '',
    privateKeyPath: '',
  }

  if (!(options.interactive ?? process.stdin.isTTY)) {
    return values
  }

  log.info(
    'Posts are Markdown files in a GitHub repository. You can skip any question and fill the .env file later.'
  )

  values.repo = await ask(
    text,
    'GitHub repository for the posts (owner/name, optional):',
    {
      placeholder: 'your-name/your-blog',
      validate: (value: string | undefined) =>
        value && !isValidRepo(value.trim())
          ? 'Use the format owner/name, like your-name/your-blog.'
          : undefined,
    }
  )
  values.appSlug = await ask(
    text,
    'GitHub App slug (github.com/apps/<slug>, optional):'
  )
  values.appId = await ask(text, 'GitHub App ID (optional):')
  values.clientId = await ask(text, 'GitHub App Client ID (optional):')
  values.clientSecret = await ask(
    password,
    'GitHub App Client secret (optional, hidden):'
  )
  values.privateKeyPath = stripQuotes(
    await ask(text, 'Path to the GitHub App private key .pem file (optional):')
  )

  return values
}

// Read the key file. Return an empty string if it is missing or not a PEM.
// This function never prints the key.
export function readPrivateKey(keyPath: string, cwd = process.cwd()) {
  if (!keyPath) {
    return ''
  }

  try {
    const pem = fs.readFileSync(path.resolve(cwd, keyPath), 'utf-8')

    if (!pem.includes('-----BEGIN')) {
      log.warn('The key file is not a PEM file. Skipping the private key.')
      return ''
    }

    return flattenPrivateKey(pem)
  } catch {
    log.warn(
      `Could not read the key file at ${keyPath}. Skipping the private key.`
    )
    return ''
  }
}

export function setupCoreEnvVars(values: CoreValues, cwd = process.cwd()) {
  const envVars: Record<string, string> = {
    PLUTO_CMS_REPO: values.repo,
    PLUTO_CMS_APP_SLUG: values.appSlug,
    NUXT_PLUTO_CMS_SESSION_PASSWORD: randomBytes(32).toString('base64url'),
    NUXT_PLUTO_CMS_GITHUB_APP_ID: values.appId,
    NUXT_PLUTO_CMS_GITHUB_CLIENT_ID: values.clientId,
    NUXT_PLUTO_CMS_GITHUB_CLIENT_SECRET: values.clientSecret,
    NUXT_PLUTO_CMS_GITHUB_PRIVATE_KEY: readPrivateKey(
      values.privateKeyPath,
      cwd
    ),
  }

  return { envVars }
}

export function logCoreNextSteps(values: CoreValues) {
  const steps = [
    'Create a GitHub App. Follow "Set up the CMS" in the template README:\nhttps://github.com/plutocms/pluto-core-blog-template#set-up-the-cms',
    'Install the App on the repository of your blog.',
    'Fill the empty GitHub values in .env.',
    'Run "bun run dev". It works locally with files in the content/ folder.',
  ]

  if (!values.repo) {
    steps.splice(2, 0, 'Set PLUTO_CMS_REPO in .env.')
  }

  log.info(
    `Next steps:\n${steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}`
  )
}
