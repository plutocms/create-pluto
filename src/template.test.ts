import type { TemplateEntry } from './registry.ts'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, it } from 'node:test'
import { latestRange } from './npm.ts'
import { scratchTemplate } from './registry.ts'
import {
  applyTemplate,
  packageNameOf,
  setPackageName,
  writeScratchProject,
} from './template.ts'

let root: string
let dir: string

function readJson(file: string) {
  return JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'))
}

function readConfig() {
  return fs.readFileSync(path.join(dir, 'nuxt.config.ts'), 'utf8')
}

const rangeOf = async (name: string) => `^1.0.0-${name}`

// The blog entry of the registry.
const blog: TemplateEntry = {
  id: 'blog',
  name: 'Blog (minimalist)',
  description: '',
  category: 'blog',
  access: 'free',
  source: 'gh:plutocms/templates/templates/blog',
  backends: {
    git: {},
    supabase: { layer: '@plutocms/supabase-blog', remove: ['content'] },
  },
}

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'pluto-template-'))
  dir = path.join(root, 'My Blog')
  fs.mkdirSync(path.join(dir, 'content', 'posts'), { recursive: true })
  fs.writeFileSync(
    path.join(dir, 'nuxt.config.ts'),
    'export default defineNuxtConfig({\n  extends: ["@plutocms/core"],\n})\n'
  )
  fs.writeFileSync(
    path.join(dir, 'package.json'),
    JSON.stringify({
      name: 'pluto-template-blog',
      dependencies: { '@plutocms/core': '^0.33.0', nuxt: '^4.6.3' },
      scripts: { dev: 'nuxt dev' },
    })
  )
  fs.writeFileSync(path.join(dir, 'content', 'posts', 'hello.md'), '# Hello')
})

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true })
})

describe('applyTemplate', () => {
  it('keeps the template as it is for the Git CMS', async () => {
    await applyTemplate(dir, blog, 'git', [], rangeOf)

    assert.match(readConfig(), /"@plutocms\/core"/)
    assert.ok(fs.existsSync(path.join(dir, 'content')))
    assert.equal(
      readJson('package.json').dependencies['@plutocms/supabase-blog'],
      undefined
    )
  })

  it('switches the layer, the packages and removes the paths for Supabase', async () => {
    await applyTemplate(dir, blog, 'supabase', [], rangeOf)

    assert.match(readConfig(), /extends: \["@plutocms\/supabase-blog"\]/)
    assert.ok(!fs.existsSync(path.join(dir, 'content')))

    const pkg = readJson('package.json')
    assert.equal(
      pkg.dependencies['@plutocms/supabase-blog'],
      '^1.0.0-@plutocms/supabase-blog'
    )
    assert.equal(pkg.dependencies['@plutocms/core'], '^0.33.0')
    assert.match(pkg.scripts['supabase-types'], /supabase-typegen\.ts/)
  })

  it('changes nothing for a backend with no changes', async () => {
    const before = readConfig()
    await applyTemplate(
      dir,
      { ...blog, backends: { supabase: {} } },
      'supabase',
      [],
      rangeOf
    )

    assert.equal(readConfig(), before)
  })

  it('fails when the config does not extend a layer', async () => {
    fs.writeFileSync(
      path.join(dir, 'nuxt.config.ts'),
      'export default defineNuxtConfig({})\n'
    )

    await assert.rejects(
      applyTemplate(dir, blog, 'supabase', [], rangeOf),
      /does not extend a layer/
    )
  })
})

describe('the package name', () => {
  it('comes from the folder', () => {
    assert.equal(packageNameOf('/x/My Blog'), 'my-blog')
    assert.equal(packageNameOf('/x/shop_2 (copy)'), 'shop_2-copy')
    assert.equal(packageNameOf('/x/.hidden'), 'hidden')
    assert.equal(packageNameOf('/x/@@@'), 'pluto-app')
  })

  it('replaces the name of the template', () => {
    setPackageName(dir)

    const pkg = readJson('package.json')
    assert.equal(pkg.name, 'my-blog')
    assert.equal(pkg.dependencies.nuxt, '^4.6.3')
  })
})

describe('writeScratchProject', () => {
  beforeEach(() => {
    fs.rmSync(dir, { recursive: true, force: true })
    fs.mkdirSync(dir)
  })

  it('writes a bare project that extends core', async () => {
    await writeScratchProject(dir, rangeOf, new Date('2026-11-04T12:00:00Z'))

    assert.deepEqual(fs.readdirSync(dir).sort(), [
      '.gitignore',
      'app',
      'nuxt.config.ts',
      'package.json',
      'tsconfig.json',
    ])
    assert.match(readConfig(), /extends: \["@plutocms\/core"\]/)
    assert.match(readConfig(), /compatibilityDate: "2026-11-04"/)
    assert.match(
      fs.readFileSync(path.join(dir, 'app', 'app.vue'), 'utf8'),
      /<PlutoRoot>\s*<NuxtPage \/>\s*<\/PlutoRoot>/
    )

    const pkg = readJson('package.json')
    assert.equal(pkg.name, 'my-blog')
    assert.deepEqual(Object.keys(pkg.dependencies), [
      '@plutocms/core',
      'nuxt',
      'vue',
      'vue-router',
    ])
    assert.equal(pkg.devDependencies.typescript, '^5.9.3')
    assert.equal(pkg.scripts.postinstall, 'nuxt prepare')
  })

  it('takes the backend and the layers like a template', async () => {
    await writeScratchProject(dir, rangeOf)
    await applyTemplate(dir, scratchTemplate, 'supabase', ['shop'], rangeOf)

    assert.match(readConfig(), /extends: \["@plutocms\/supabase-shop"\]/)
    const pkg = readJson('package.json')
    assert.equal(pkg.dependencies['@plutocms/supabase'], undefined)
    assert.ok(pkg.dependencies['@plutocms/supabase-shop'])
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
