import fs from 'node:fs'
import path from 'node:path'
import {
  cancel,
  confirm,
  isCancel,
  log,
  select,
  spinner,
  text,
} from '@clack/prompts'
import { downloadTemplate } from 'giget'
import {
  logCoreNextSteps,
  setupCore,
  setupCoreEnvVars,
} from './choices/core-template.ts'
import {
  setupSupabase,
  setupSupabaseEnvVars,
} from './choices/supabase-template.ts'
import { writeEnvFile } from './env.ts'
import { getTemplatesFor, menu, resolveTemplateShortcut } from './menu.ts'

interface ParsedArgs {
  projectDir?: string
  templateShortcut?: string
}

const cwd = process.cwd()

const color = {
  blue: (text: string) => `\x1B[34m${text}\x1B[0m`,
  green: (text: string) => `\x1B[32m${text}\x1B[0m`,
}

function parseCliArgs(argv: string[]): ParsedArgs {
  const parsedArgs: ParsedArgs = {}

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]

    if (arg === '-t' || arg === '--template') {
      parsedArgs.templateShortcut = argv[index + 1]
      index += 1
      continue
    }

    if (arg?.startsWith('--template=')) {
      parsedArgs.templateShortcut = arg.split('=')[1]
      continue
    }

    if (!arg?.startsWith('-') && !parsedArgs.projectDir) {
      parsedArgs.projectDir = arg
    }
  }

  return parsedArgs
}

const args = parseCliArgs(process.argv.slice(2))
let selectedTemplate:
  | { databaseProvider: string, templateChoice: string }
  | undefined

if (args.templateShortcut) {
  const result = resolveTemplateShortcut(args.templateShortcut)

  if (!result.ok) {
    log.error(result.message)

    process.exit(1)
  }

  selectedTemplate = result
}

// Where you want to download the template
const templateDir = args.projectDir
  ? args.projectDir
  : await text({
      message: 'Where do you want to create your Pluto project?',
      placeholder: './my-pluto-project',
      defaultValue: 'my-pluto-project',
    })

if (isCancel(templateDir)) {
  cancel('Operation cancelled.')

  process.exit(0)
}

const templatePath = path.resolve(cwd, templateDir)

if (!fs.existsSync(templatePath)) {
  fs.mkdirSync(templatePath, { recursive: true })
}

// Ask for website title
const websiteTitle = await text({
  message: 'Website title:',
  placeholder: 'My Awesome Website',
  defaultValue: 'My Awesome Website',
})

if (isCancel(websiteTitle)) {
  cancel('Operation cancelled.')

  process.exit(0)
}

// Ask for database provider
const databaseProvider = selectedTemplate
  ? selectedTemplate.databaseProvider
  : await select({
      message: 'Pick a database provider.',
      options: menu.databases,
    })

if (isCancel(databaseProvider)) {
  cancel('Operation cancelled.')

  process.exit(0)
}

let supabaseUrl: string | symbol | undefined
let supabaseKey: string | symbol | undefined
let databaseUrl: string | symbol | undefined

if (databaseProvider === 'supabase') {
  log.warn(
    `You must have a Supabase project set up. If you do not have one, please create it at:\n${color.blue('https://database.new/')}.`
  )

  const {
    supabaseUrl: url,
    supabaseKey: key,
    databaseUrl: connectionString,
  } = await setupSupabase()

  if (!url || !key || !connectionString) {
    log.error('Supabase setup failed.')

    process.exit(1)
  }

  supabaseUrl = url
  supabaseKey = key
  databaseUrl = connectionString
}

const s = spinner()

// Check if nuxt.config.ts exists
if (fs.existsSync(`${cwd}/nuxt.config.ts`)) {
  const shouldContinue = await confirm({
    message:
      'Nuxt project detected. Do you want to add Pluto environment variables?',
  })

  if (!shouldContinue) {
    process.exit(0)
  }
}

// Select template
const templateOptions = getTemplatesFor(String(databaseProvider))
const onlyTemplate =
  templateOptions.length === 1 ? templateOptions[0] : undefined

if (onlyTemplate && !selectedTemplate) {
  log.info(`Using the only template available: ${onlyTemplate.label}`)
}

const templateChoice = selectedTemplate
  ? selectedTemplate.templateChoice
  : (onlyTemplate?.value ??
    (await select({
      message: 'Select a template to use. You can add more layers as needed.',
      options: templateOptions,
    })))

if (isCancel(templateChoice)) {
  cancel('Operation cancelled.')

  process.exit(0)
}

// Download template

// If folder is not empty, ask for confirmation to continue
if (fs.readdirSync(templatePath).length > 0) {
  const shouldContinue = await confirm({
    message: `The folder ${color.green(
      templateDir
    )} is not empty. Do you want to continue and potentially overwrite existing files?`,
  })

  if (!shouldContinue) {
    cancel('Operation cancelled.')

    process.exit(0)
  }
}

s.start(`Downloading Pluto template...`)

const { source } = await downloadTemplate(
  `gh:plutocms/pluto-${databaseProvider}-${templateChoice}-template`,
  {
    dir: templatePath,
    force: true,
  }
)

log.info(`Template downloaded from ${color.green(source)}`)

// Write to .env file if exists or create a new one
const envPath = path.resolve(templatePath, '.env')
const envVars: Record<string, string> = {}
let coreValues: Awaited<ReturnType<typeof setupCore>> | undefined

if (databaseProvider === 'core') {
  // The core template reads its site name from NUXT_PUBLIC_WEBSITE_NAME.
  envVars.NUXT_PUBLIC_WEBSITE_NAME = websiteTitle?.toString() ?? ''

  // Stop the spinner so it does not draw over the prompts.
  s.stop('Template downloaded.')
  coreValues = await setupCore()

  Object.assign(envVars, setupCoreEnvVars(coreValues).envVars)
} else {
  envVars.WEBSITE_NAME = websiteTitle?.toString() ?? ''
}

if (databaseProvider === 'supabase') {
  const { envVars: supabaseEnvVars } = setupSupabaseEnvVars(
    supabaseUrl,
    supabaseKey,
    databaseUrl
  )

  Object.assign(envVars, supabaseEnvVars)
}

try {
  writeEnvFile(envPath, envVars)
} catch (error) {
  log.error(`Failed to write to .env file: ${error}`)

  process.exit(1)
}

if (!coreValues) {
  s.stop('All done!')
}

log.success('Setup complete! 🎉')

log.info(`Nuxt project created in: ${color.green(templateDir)}`)

if (coreValues) {
  logCoreNextSteps(coreValues)
}
