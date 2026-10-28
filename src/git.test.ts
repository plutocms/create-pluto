import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, it } from 'node:test'
import { initGitRepo } from './git.ts'

let dir: string

const git = (cwd: string, ...args: string[]) =>
  execFileSync('git', args, { cwd, encoding: 'utf8' }).trim()

// A Git author for the commits in these tests, without the user's global config.
const AUTHOR = {
  GIT_AUTHOR_NAME: 'Test',
  GIT_AUTHOR_EMAIL: 'test@example.com',
  GIT_COMMITTER_NAME: 'Test',
  GIT_COMMITTER_EMAIL: 'test@example.com',
}
let saved: Record<string, string | undefined>

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'create-pluto-git-'))
  saved = Object.fromEntries(
    Object.keys(AUTHOR).map((key) => [key, process.env[key]])
  )
  Object.assign(process.env, AUTHOR)
})

afterEach(() => {
  for (const [key, value] of Object.entries(saved)) {
    if (value === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = value
    }
  }
  rmSync(dir, { recursive: true, force: true })
})

describe('initGitRepo', () => {
  it('creates a repo with a first commit, without the ignored .env', () => {
    writeFileSync(join(dir, '.gitignore'), '.env\n')
    writeFileSync(join(dir, '.env'), 'SECRET=1\n')
    writeFileSync(join(dir, 'nuxt.config.ts'), 'export default {}\n')

    assert.equal(initGitRepo(dir), 'created')
    assert.equal(
      git(dir, 'log', '-1', '--format=%s'),
      'chore: create a Pluto site'
    )
    assert.equal(git(dir, 'ls-files'), '.gitignore\nnuxt.config.ts')
  })

  it('never commits a .env that the template does not ignore', () => {
    writeFileSync(join(dir, '.env'), 'SECRET=1\n')
    writeFileSync(join(dir, 'nuxt.config.ts'), 'export default {}\n')

    assert.equal(initGitRepo(dir), 'created-without-commit')
    assert.equal(git(dir, 'ls-files'), '')
  })

  it('leaves a folder inside a repo alone', () => {
    git(dir, 'init', '-q')
    const site = join(dir, 'site')
    mkdirSync(site)
    writeFileSync(join(site, 'a.txt'), 'a')

    assert.equal(initGitRepo(site), 'inside-repo')
    assert.equal(git(dir, 'ls-files'), '')
  })
})
