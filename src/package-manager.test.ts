import assert from 'node:assert/strict'
import path from 'node:path'
import { describe, it } from 'node:test'
import { detectRunningPackageManager, isSupportedPackageManager, nextStepCommands } from './package-manager.ts'

describe('detectRunningPackageManager', () => {
  it('reads the name from the user agent', () => {
    assert.equal(detectRunningPackageManager('pnpm/9.12.0 npm/? node/v22.0.0 win32 x64'), 'pnpm')
    assert.equal(detectRunningPackageManager('bun/1.3.0 npm/? node/v24.3.0 linux x64'), 'bun')
    assert.equal(detectRunningPackageManager('yarn/4.5.0 npm/? node/v22.0.0'), 'yarn')
    assert.equal(detectRunningPackageManager('npm/10.9.0 node/v22.0.0'), 'npm')
  })

  it('falls back to npm', () => {
    assert.equal(detectRunningPackageManager(undefined), 'npm')
    assert.equal(detectRunningPackageManager(''), 'npm')
    assert.equal(detectRunningPackageManager('unknown/1.0'), 'npm')
  })
})

describe('isSupportedPackageManager', () => {
  it('accepts the five package managers only', () => {
    for (const name of ['npm', 'pnpm', 'yarn', 'bun', 'deno']) {
      assert.equal(isSupportedPackageManager(name), true, name)
    }
    assert.equal(isSupportedPackageManager('cnpm'), false)
    assert.equal(isSupportedPackageManager(undefined), false)
  })
})

describe('nextStepCommands', () => {
  const cwd = path.resolve('/work')

  it('gives cd and the dev command after an install', () => {
    assert.deepEqual(
      nextStepCommands({ cwd, projectPath: path.join(cwd, 'my-blog'), packageManager: 'bun', installed: true }),
      ['cd my-blog', 'bun run dev']
    )
  })

  it('adds the install command when the install did not run', () => {
    assert.deepEqual(
      nextStepCommands({ cwd, projectPath: path.join(cwd, 'my-blog'), packageManager: 'pnpm', installed: false }),
      ['cd my-blog', 'pnpm install', 'pnpm run dev']
    )
  })

  it('skips cd when the project is the current folder, and quotes a path with a space', () => {
    assert.deepEqual(nextStepCommands({ cwd, projectPath: cwd, packageManager: 'deno', installed: true }), ['deno task dev'])
    assert.deepEqual(
      nextStepCommands({ cwd, projectPath: path.join(cwd, 'my blog'), packageManager: 'npm', installed: true }),
      ['cd "my blog"', 'npm run dev']
    )
  })
})
