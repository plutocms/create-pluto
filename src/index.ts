import {
  text,
  select,
  spinner,
  log,
  isCancel,
  cancel,
  confirm,
} from '@clack/prompts'
import { downloadTemplate } from 'giget'
import fs from 'fs'
import {
  setupSupabase,
  setupSupabaseEnvVars,
} from './choices/supabase-template.ts'

interface MenuOption {
  value: string
  label: string
  hint?: string
}

interface Menu {
  databases: MenuOption[]
  templates: MenuOption[]
}

const cwd = process.cwd()

const color = {
  blue: (text: string) => `\x1b[34m${text}\x1b[0m`,
  green: (text: string) => `\x1b[32m${text}\x1b[0m`,
}

const menu: Menu = {
  databases: [
    {
      value: 'supabase',
      label: 'Supabase',
      hint: 'Hosted Postgres Database',
    },
  ],

  templates: [
    {
      value: 'shop',
      label: 'Shop (e-commerce)',
      hint: 'A full-featured online store template',
    },
  ],
}

// Where you want to download the template
const templateDir = await text({
  message: 'Where do you want to create your Pluto project?',
  placeholder: './my-pluto-project',
  defaultValue: 'my-pluto-project',
})

if (isCancel(templateDir)) {
  cancel('Operation cancelled.')

  process.exit(0)
}

const templatePath = `${cwd}/${templateDir}`

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
const databaseProvider = await select({
  message: 'Pick a database provider.',
  options: menu.databases,
})

if (isCancel(databaseProvider)) {
  cancel('Operation cancelled.')

  process.exit(0)
}

let supabaseUrl: string | symbol | undefined
let supabaseKey: string | symbol | undefined

if (databaseProvider === 'supabase') {
  log.warn(
    `You must have a Supabase project set up. If you do not have one, please create it at:\n${color.blue('https://database.new/')}.`
  )

  const { supabaseUrl: url, supabaseKey: key } = await setupSupabase()

  if (!url || !key) {
    log.error('Supabase setup failed.')

    process.exit(1)
  }

  supabaseUrl = url
  supabaseKey = key
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
const templateChoice = await select({
  message: 'Select a template to use. You can add more layers as needed.',
  options: menu.templates,
})

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
const envPath = `${cwd}/${templateDir}/.env`
const envVars: Record<string, string> = {
  PLUTO_WEBSITE_TITLE: websiteTitle?.toString() ?? '',
}

if (databaseProvider === 'supabase') {
  const { envVars: supabaseEnvVars } = setupSupabaseEnvVars(
    supabaseUrl,
    supabaseKey
  )

  Object.assign(envVars, supabaseEnvVars)
}

try {
  let envContent = ''
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8')

    Object.entries(envVars).forEach(([key, value]) => {
      const regex = new RegExp(`^${key}=.*$`, 'm')
      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, `${key}="${value}"`)
      } else {
        envContent += `\n${key}="${value}"`
      }
    })
  } else {
    envContent = '# Pluto Configurations\n'
    Object.entries(envVars).forEach(([key, value]) => {
      envContent += `${key}="${value}"\n`
    })
  }

  fs.writeFileSync(envPath, envContent.trim() + '\n')
} catch (error) {
  log.error(`Failed to write to .env file: ${error}`)

  process.exit(1)
}

s.stop('All done!')

log.success('Setup complete! 🎉')

log.info(`Nuxt project created in: ${color.green(templateDir)}`)
