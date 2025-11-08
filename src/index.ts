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

const cwd = process.cwd()

const websiteTitle = await text({
  message: 'Website title:',
  placeholder: 'My Awesome Website',
  defaultValue: 'My Awesome Website',
})

if (isCancel(websiteTitle)) {
  cancel('Operation cancelled.')

  process.exit(0)
}

const databaseProvider = await select({
  message: 'Pick a database provider.',
  options: [
    { value: 'supabase', label: 'Supabase' },
    { value: 'mysql', label: 'MySQL' },
  ],
})

if (isCancel(databaseProvider)) {
  cancel('Operation cancelled.')

  process.exit(0)
}

let supabaseUrl: string | symbol | undefined
let supabaseKey: string | symbol | undefined

if (databaseProvider === 'supabase') {
  await setupSupabase()
}

async function setupSupabase() {
  while (!supabaseUrl) {
    supabaseUrl = await text({
      message: 'Type/Paste your Supabase URL:',
    })

    if (!supabaseUrl || typeof supabaseUrl !== 'string') {
      log.error('Supabase URL is required.')
    }
  }

  while (!supabaseKey) {
    supabaseKey = await text({
      message: 'Type/Paste your Supabase Key:',
    })

    if (!supabaseKey || typeof supabaseKey !== 'string') {
      log.error('Supabase Key is required.')
    }
  }
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

s.start('Setting things up...')

log.success(
  `Data: ${JSON.stringify({
    websiteTitle,
    databaseProvider,
    supabaseUrl,
    supabaseKey,
  })}`
)

// Write to .env file if exists or create a new one
const envPath = `${cwd}/.env`
const envVars: Record<string, string> = {
  PLUTO_WEBSITE_TITLE: websiteTitle?.toString() ?? '',
}

if (databaseProvider === 'supabase') {
  envVars.SUPABASE_PROJECT_ID = supabaseUrl
    ? (supabaseUrl.toString().split('//')[1]?.split('.')[0] ?? '')
    : ''
  envVars.SUPABASE_URL = supabaseUrl?.toString() ?? ''
  envVars.SUPABASE_KEY = supabaseKey?.toString() ?? ''
}

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

s.stop('All done!')

log.success('Setup complete! 🎉')
