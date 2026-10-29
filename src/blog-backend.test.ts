import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, it } from 'node:test'
import { applyBlogBackend, latestRange } from './blog-backend.ts'

let dir: string

function readJson(file: string) {
  return JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'))
}

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pluto-blog-'))
  fs.writeFileSync(
    path.join(dir, 'nuxt.config.ts'),
    'export default defineNuxtConfig({\n  extends: [plutoLayer("@plutocms/pluto")],\n})\n'
  )
  fs.writeFileSync(
    path.join(dir, 'package.json'),
    JSON.stringify({
      dependencies: { '@plutocms/pluto': '^0.33.0', nuxt: '^4.6.3' },
      scripts: { dev: 'nuxt dev' },
      trustedDependencies: ['@plutocms/pluto', 'esbuild'],
    })
  )
  fs.mkdirSync(path.join(dir, 'content', 'posts'), { recursive: true })
  fs.writeFileSync(path.join(dir, 'content', 'posts', 'hello.md'), '# Hello')
})

afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true })
})

describe('applyBlogBackend', () => {
  it('keeps the template as it is for the GitHub backend', () => {
    applyBlogBackend(dir, 'github')

    assert.match(
      fs.readFileSync(path.join(dir, 'nuxt.config.ts'), 'utf8'),
      /plutoLayer\("@plutocms\/pluto"\)/
    )
    assert.ok(fs.existsSync(path.join(dir, 'content')))
    assert.equal(
      readJson('package.json').dependencies['@plutocms/supabase-blog'],
      undefined
    )
  })

  it('switches the layer, the packages and the content for Supabase', () => {
    applyBlogBackend(dir, 'supabase', '^0.15.1')

    assert.match(
      fs.readFileSync(path.join(dir, 'nuxt.config.ts'), 'utf8'),
      /plutoLayer\("@plutocms\/supabase-blog"\)/
    )
    assert.ok(!fs.existsSync(path.join(dir, 'content')))

    const pkg = readJson('package.json')
    assert.equal(pkg.dependencies['@plutocms/supabase-blog'], '^0.15.1')
    assert.equal(pkg.dependencies['@plutocms/pluto'], '^0.33.0')
    assert.match(pkg.scripts['supabase-types'], /supabase-typegen\.ts/)
    assert.deepEqual(pkg.trustedDependencies, [
      '@plutocms/pluto',
      '@plutocms/supabase',
      '@plutocms/supabase-blog',
      '@plutocms/supabase-storage',
      '@plutocms/utils',
      'esbuild',
      'supabase',
    ])
  })

  it('fails when the config does not extend the core layer', () => {
    fs.writeFileSync(
      path.join(dir, 'nuxt.config.ts'),
      'export default defineNuxtConfig({})\n'
    )

    assert.throws(() => applyBlogBackend(dir, 'supabase'), /plutoLayer/)
  })
})

describe('latestRange', () => {
  it('gives a caret range of the latest version', async () => {
    const fetchImpl = (async () =>
      new Response(JSON.stringify({ version: '0.15.1' }))) as typeof fetch

    assert.equal(
      await latestRange('@plutocms/supabase-blog', fetchImpl),
      '^0.15.1'
    )
  })

  it('falls back to latest when npm does not answer', async () => {
    const failing = (async () => {
      throw new Error('offline')
    }) as typeof fetch
    const notFound = (async () =>
      new Response('', { status: 404 })) as typeof fetch

    assert.equal(await latestRange('x', failing), 'latest')
    assert.equal(await latestRange('x', notFound), 'latest')
  })
})
