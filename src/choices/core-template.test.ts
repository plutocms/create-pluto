import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, it, mock } from 'node:test'
import { writeEnvFile } from '../env.ts'

const answers: unknown[] = []
const prompted: string[] = []
const logged: string[] = []

function logger(message: string) {
  logged.push(message)
}

// Mock the prompts. The real library needs a terminal.
mock.module('@clack/prompts', {
  namedExports: {
    text: async (options: { message: string }) => {
      prompted.push(options.message)
      return answers.shift()
    },
    password: async (options: { message: string }) => {
      prompted.push(options.message)
      return answers.shift()
    },
    isCancel: () => false,
    cancel: () => {},
    log: { info: logger, warn: logger, error: logger, success: logger },
  },
})

const {
  flattenPrivateKey,
  isValidRepo,
  logCoreNextSteps,
  readPrivateKey,
  setupCore,
  setupCoreEnvVars,
} = await import('./core-template.ts')

const PEM = [
  '-----BEGIN RSA PRIVATE KEY-----',
  'MIIEabc',
  'defGHI',
  '-----END RSA PRIVATE KEY-----',
  '',
].join('\r\n')

const EMPTY = {
  repo: '',
  appSlug: '',
  appId: '',
  clientId: '',
  clientSecret: '',
  privateKeyPath: '',
}

let dir: string

beforeEach(() => {
  answers.length = 0
  prompted.length = 0
  logged.length = 0
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'create-pluto-test-'))
})

afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true })
})

describe('isValidRepo', () => {
  it('accepts owner/name and rejects other formats', () => {
    assert.equal(isValidRepo('ojvribeiro/my-blog'), true)
    assert.equal(isValidRepo('a.b/c_d'), true)
    for (const bad of ['', 'noslash', 'a/b/c', '/b', 'a/', 'a b/c']) {
      assert.equal(isValidRepo(bad), false, bad)
    }
  })
})

describe('setupCore', () => {
  it('returns empty defaults and asks nothing when not interactive', async () => {
    const values = await setupCore({ interactive: false })

    assert.deepEqual(prompted, [])
    assert.deepEqual(values, EMPTY)
  })

  it('collects the answers in order', async () => {
    answers.push(
      'me/blog',
      'my-app',
      '123',
      'Iv1.abc',
      'shh-secret',
      '"C:\\keys\\app.pem"'
    )

    const values = await setupCore({ interactive: true })

    assert.equal(prompted.length, 6)
    assert.deepEqual(values, {
      repo: 'me/blog',
      appSlug: 'my-app',
      appId: '123',
      clientId: 'Iv1.abc',
      clientSecret: 'shh-secret',
      privateKeyPath: 'C:\\keys\\app.pem',
    })
  })

  it('treats skipped answers as empty strings', async () => {
    answers.push(undefined, '', '', '', '', '')

    const values = await setupCore({ interactive: true })

    assert.deepEqual(values, EMPTY)
  })
})

describe('core env generation', () => {
  it('flattens a key to one line with literal \\n escapes', () => {
    const flat = flattenPrivateKey(PEM)

    assert.equal(
      flat,
      '-----BEGIN RSA PRIVATE KEY-----\\nMIIEabc\\ndefGHI\\n-----END RSA PRIVATE KEY-----'
    )
    assert.ok(!/[\r\n]/.test(flat))
  })

  it('generates a 43 char base64url session password every time', () => {
    const first = setupCoreEnvVars(EMPTY, dir).envVars
    const second = setupCoreEnvVars(EMPTY, dir).envVars
    const password = first.NUXT_PLUTO_CMS_SESSION_PASSWORD as string

    assert.equal(password.length, 43)
    assert.match(password, /^[\w-]{43}$/)
    assert.notEqual(password, second.NUXT_PLUTO_CMS_SESSION_PASSWORD)
    assert.equal(first.NUXT_PLUTO_CMS_GITHUB_PRIVATE_KEY, '')
  })

  it('maps every value to its variable and writes a one-line key', () => {
    const keyFile = path.join(dir, 'app.pem')
    fs.writeFileSync(keyFile, PEM)

    const { envVars } = setupCoreEnvVars(
      {
        repo: 'me/blog',
        appSlug: 'my-app',
        appId: '123',
        clientId: 'Iv1.abc',
        clientSecret: 'sec$&ret',
        privateKeyPath: keyFile,
      },
      dir
    )

    assert.equal(envVars.PLUTO_CMS_REPO, 'me/blog')
    assert.equal(envVars.PLUTO_CMS_APP_SLUG, 'my-app')
    assert.equal(envVars.NUXT_PLUTO_CMS_GITHUB_APP_ID, '123')
    assert.equal(envVars.NUXT_PLUTO_CMS_GITHUB_CLIENT_ID, 'Iv1.abc')
    assert.equal(envVars.NUXT_PLUTO_CMS_GITHUB_CLIENT_SECRET, 'sec$&ret')

    const envPath = path.join(dir, '.env')
    writeEnvFile(envPath, envVars)

    // Merge into the existing file. A "$" in a value must stay as it is.
    writeEnvFile(envPath, { NUXT_PLUTO_CMS_GITHUB_CLIENT_SECRET: 'a$&b' })

    const lines = fs.readFileSync(envPath, 'utf-8').trim().split('\n')
    const keyLine = lines.find((line) =>
      line.startsWith('NUXT_PLUTO_CMS_GITHUB_PRIVATE_KEY=')
    )

    assert.equal(lines.length, 8)
    assert.ok(keyLine?.includes('-----BEGIN RSA PRIVATE KEY-----\\nMIIEabc'))
    assert.ok(lines.includes('NUXT_PLUTO_CMS_GITHUB_CLIENT_SECRET="a$&b"'))
  })

  it('resolves a relative key path against the given cwd', () => {
    fs.writeFileSync(path.join(dir, 'k.pem'), PEM)

    assert.ok(readPrivateKey('k.pem', dir).startsWith('-----BEGIN'))
  })

  it('skips a missing or non-PEM key file with a warning', () => {
    fs.writeFileSync(path.join(dir, 'bad.pem'), 'not a key')

    assert.equal(readPrivateKey('missing.pem', dir), '')
    assert.equal(readPrivateKey('bad.pem', dir), '')
    assert.equal(logged.length, 2)
  })

  it('never prints the key or the secret', async () => {
    const keyFile = path.join(dir, 'app.pem')
    fs.writeFileSync(keyFile, PEM)
    answers.push('me/blog', '', '1', '2', 'top-secret-value', keyFile)

    const out: string[] = []
    const original = process.stdout.write
    process.stdout.write = ((chunk: string | Uint8Array) => {
      out.push(chunk.toString())
      return true
    }) as typeof process.stdout.write

    try {
      const values = await setupCore({ interactive: true })

      setupCoreEnvVars(values, dir)
      logCoreNextSteps(values)
    } finally {
      process.stdout.write = original
    }

    const printed = [...out, ...logged, ...prompted].join('\n')

    assert.ok(!printed.includes('top-secret-value'))
    assert.ok(!printed.includes('MIIEabc'))
    assert.ok(!printed.includes('BEGIN RSA'))
  })

  it('prints the next steps with the README link', () => {
    logCoreNextSteps(EMPTY)

    assert.match(logged.join('\n'), /#set-up-the-cms/)
    assert.match(logged.join('\n'), /bun run dev/)
  })
})
