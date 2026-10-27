import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { setupCoreEnvVars } from './core-template.ts'

describe('setupCoreEnvVars', () => {
  it('writes only a new session password of 43 characters', () => {
    const { envVars } = setupCoreEnvVars()

    assert.deepEqual(Object.keys(envVars), ['NUXT_PLUTO_GITHUB_SESSION_PASSWORD'])
    assert.equal(envVars.NUXT_PLUTO_GITHUB_SESSION_PASSWORD?.length, 43)
  })

  it('makes a different password each time', () => {
    assert.notEqual(
      setupCoreEnvVars().envVars.NUXT_PLUTO_GITHUB_SESSION_PASSWORD,
      setupCoreEnvVars().envVars.NUXT_PLUTO_GITHUB_SESSION_PASSWORD
    )
  })
})
