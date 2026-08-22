import { log, text } from '@clack/prompts'

type Value = string | symbol | undefined

// TODO: add validation for Supabase URL and Key
export async function setupSupabase() {
  let supabaseUrl: Value
  let supabaseKey: Value

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

  return { supabaseUrl, supabaseKey }
}

export function setupSupabaseEnvVars(supabaseUrl: Value, supabaseKey: Value) {
  const envVars: Record<string, string> = {}

  envVars.SUPABASE_PROJECT_ID = supabaseUrl
    ? (supabaseUrl.toString().split('//')[1]?.split('.')[0] ?? '')
    : ''
  envVars.SUPABASE_URL = supabaseUrl?.toString() ?? ''
  envVars.SUPABASE_KEY = supabaseKey?.toString() ?? ''

  return { envVars }
}
