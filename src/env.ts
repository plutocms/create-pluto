import fs from 'node:fs'

// Write the variables to a .env file. Merge into the file if it exists.
export function writeEnvFile(envPath: string, envVars: Record<string, string>) {
  let envContent = ''

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8')

    Object.entries(envVars).forEach(([key, value]) => {
      const regex = new RegExp(`^${key}=.*$`, 'm')
      const line = `${key}="${value}"`

      if (regex.test(envContent)) {
        // A function replacer keeps "$" in a value from acting as a pattern.
        envContent = envContent.replace(regex, () => line)
      } else {
        envContent += `\n${line}`
      }
    })
  } else {
    envContent = '# Pluto Configurations\n'
    Object.entries(envVars).forEach(([key, value]) => {
      envContent += `${key}="${value}"\n`
    })
  }

  fs.writeFileSync(envPath, `${envContent.trim()}\n`)
}
