import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, it } from 'node:test'
import { applyAdminTemplate, getLayersFor, resolveLayers } from './layers.ts'

let dir: string

function readJson(file: string) {
  return JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'))
}

function readConfig() {
  return fs.readFileSync(path.join(dir, 'nuxt.config.ts'), 'utf8')
}

const rangeOf = async (name: string) => `^1.0.0-${name}`

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pluto-admin-'))
  fs.writeFileSync(
    path.join(dir, 'nuxt.config.ts'),
    'export default defineNuxtConfig({\n  extends: ["@plutocms/core"],\n  routeRules: { "/": { redirect: "/admin" } },\n})\n'
  )
  fs.writeFileSync(
    path.join(dir, 'package.json'),
    JSON.stringify({
      dependencies: { '@plutocms/core': '^0.38.2', nuxt: '^4.6.3' },
      scripts: { dev: 'nuxt dev' },
    })
  )
})

afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true })
})

describe('getLayersFor', () => {
  it('offers shop, blog and 3D on Supabase', () => {
    assert.deepEqual(
      getLayersFor('supabase').map((layer) => layer.value),
      ['shop', 'blog', '3d']
    )
  })

  it('offers only 3D on the Git CMS', () => {
    assert.deepEqual(
      getLayersFor('git').map((layer) => layer.value),
      ['3d']
    )
  })
})

describe('resolveLayers', () => {
  it('gives no layers without the flag', () => {
    assert.deepEqual(resolveLayers(undefined, 'supabase'), {
      ok: true,
      layers: [],
    })
  })

  it('reads a list and drops duplicates', () => {
    assert.deepEqual(resolveLayers('shop, 3D,shop', 'supabase'), {
      ok: true,
      layers: ['shop', '3d'],
    })
  })

  it('accepts none and an empty value', () => {
    assert.deepEqual(resolveLayers('none', 'git'), { ok: true, layers: [] })
    assert.deepEqual(resolveLayers('', 'git'), { ok: true, layers: [] })
  })

  it('rejects an unknown layer', () => {
    const result = resolveLayers('forum', undefined)

    assert.equal(result.ok, false)
    assert.match(String(!result.ok && result.message), /Unknown layer "forum"/)
  })

  it('rejects a layer that needs another backend', () => {
    const result = resolveLayers('shop', 'git')

    assert.equal(result.ok, false)
    assert.match(
      String(!result.ok && result.message),
      /"shop" layer does not work with the "git" backend/
    )
  })

  it('checks only the names without a backend', () => {
    assert.deepEqual(resolveLayers('shop', undefined), {
      ok: true,
      layers: ['shop'],
    })
  })
})

describe('applyAdminTemplate', () => {
  it('keeps the template as it is: Git CMS, no layers', async () => {
    await applyAdminTemplate(dir, 'git', [], rangeOf)

    assert.match(readConfig(), /extends: \["@plutocms\/core"\]/)
    assert.equal(
      readJson('package.json').dependencies['@plutocms/3d'],
      undefined
    )
  })

  it('adds 3D next to core on the Git CMS', async () => {
    await applyAdminTemplate(dir, 'git', ['3d'], rangeOf)

    assert.match(
      readConfig(),
      /extends: \["@plutocms\/core", "@plutocms\/3d"\]/
    )
    assert.match(readConfig(), /routeRules/)
    assert.equal(
      readJson('package.json').dependencies['@plutocms/3d'],
      '^1.0.0-@plutocms/3d'
    )
  })

  it('switches to @plutocms/supabase without a layer', async () => {
    await applyAdminTemplate(dir, 'supabase', [], rangeOf)

    assert.match(readConfig(), /extends: \["@plutocms\/supabase"\]/)
    const pkg = readJson('package.json')
    assert.equal(
      pkg.dependencies['@plutocms/supabase'],
      '^1.0.0-@plutocms/supabase'
    )
    assert.match(pkg.scripts['supabase-types'], /supabase-typegen\.ts/)
    assert.equal(pkg.trustedDependencies, undefined)
  })

  it('extends the feature layers instead of @plutocms/supabase', async () => {
    await applyAdminTemplate(dir, 'supabase', ['shop', 'blog', '3d'], rangeOf)

    assert.match(
      readConfig(),
      /extends: \["@plutocms\/supabase-shop", "@plutocms\/supabase-blog", "@plutocms\/3d"\]/
    )
    const pkg = readJson('package.json')
    assert.equal(pkg.dependencies['@plutocms/supabase'], undefined)
    assert.equal(
      pkg.dependencies['@plutocms/supabase-shop'],
      '^1.0.0-@plutocms/supabase-shop'
    )
    assert.ok(pkg.dependencies['@plutocms/supabase-blog'])
    assert.ok(pkg.dependencies['@plutocms/3d'])
    assert.ok(pkg.scripts['supabase-types'])
  })

  it('adds 3D next to @plutocms/supabase', async () => {
    await applyAdminTemplate(dir, 'supabase', ['3d'], rangeOf)

    assert.match(
      readConfig(),
      /extends: \["@plutocms\/supabase", "@plutocms\/3d"\]/
    )
    assert.ok(readJson('package.json').dependencies['@plutocms/supabase'])
  })
})
