import { cancel, isCancel, log, text } from '@clack/prompts'

type Value = string | symbol | undefined

const CONNECTION_STRING_PATTERN = /^postgres(?:ql)?:\/\//i

function isValidUrl(value: string) {
  return URL.canParse(value)
}

function isValidConnectionString(value: string) {
  return CONNECTION_STRING_PATTERN.test(value)
}

export async function setupSupabase() {
  let supabaseUrl: Value
  let supabaseKey: Value
  let databaseUrl: Value

  while (!supabaseUrl) {
    const answer = await text({
      message: 'Type/Paste your Supabase URL:',
    })

    if (isCancel(answer)) {
      cancel('Operation cancelled.')
      process.exit(0)
    }

    if (!answer || !isValidUrl(answer)) {
      log.error('Enter a valid Supabase URL, like https://xxxxx.supabase.co.')
      continue
    }

    supabaseUrl = answer
  }

  while (!supabaseKey) {
    const answer = await text({
      message: 'Type/Paste your Supabase Key:',
    })

    if (isCancel(answer)) {
      cancel('Operation cancelled.')
      process.exit(0)
    }

    if (!answer) {
      log.error('Supabase Key is required.')
      continue
    }

    supabaseKey = answer
  }

  log.info(
    'Now find your database connection string: open your Supabase project, go to Project Settings > Database > Connection string, and copy the URI (the pooler connection works too).'
  )

  while (!databaseUrl) {
    const answer = await text({
      message: 'Type/Paste your Supabase database connection string:',
    })

    if (isCancel(answer)) {
      cancel('Operation cancelled.')
      process.exit(0)
    }

    if (!answer || !isValidConnectionString(answer)) {
      log.error(
        'Enter a valid Postgres connection string, starting with postgres:// or postgresql://.'
      )
      continue
    }

    databaseUrl = answer
  }

  return { supabaseUrl, supabaseKey, databaseUrl }
}

export function setupSupabaseEnvVars(
  supabaseUrl: Value,
  supabaseKey: Value,
  databaseUrl: Value
) {
  const envVars: Record<string, string> = {}

  envVars.SUPABASE_URL = supabaseUrl?.toString() ?? ''
  envVars.SUPABASE_KEY = supabaseKey?.toString() ?? ''
  envVars.DATABASE_URL = databaseUrl?.toString() ?? ''

  return { envVars }
}
