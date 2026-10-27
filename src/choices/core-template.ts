import { randomBytes } from 'node:crypto'

// The core template needs no prompt. The GitHub App is made from the admin of
// the site (Settings > GitHub in development, the sign-in page after a deploy),
// so the CLI writes only the session password of the CMS.
export function setupCoreEnvVars() {
  const envVars: Record<string, string> = {
    NUXT_PLUTO_CMS_SESSION_PASSWORD: randomBytes(32).toString('base64url'),
  }

  return { envVars }
}
