import type { TemplateEntry } from './registry.ts'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, it } from 'node:test'
import { getLayersFor, resolveLayers, withSeo } from './layers.ts'
import { applyTemplate } from './template.ts'

// The dashboard entry of the registry.
const dashboard: TemplateEntry = {
  id: 'dashboard',
  name: 'Dashboard only',
  description: '',
  category: 'dashboard',
  access: 'free',
  layers: true,
  source: '',
  backends: { git: {}, supabase: { layer: '@plutocms/supabase' } },
}

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
  it('offers shop, blog, 3D and SEO on Supabase', () => {
    assert.deepEqual(
      getLayersFor('supabase').map((layer) => layer.value),
      ['shop', 'blog', '3d', 'seo']
    )
  })

  it('offers 3D and SEO on the Git CMS', () => {
    assert.deepEqual(
      getLayersFor('git').map((layer) => layer.value),
      ['3d', 'seo']
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

describe('applyTemplate with layers (the dashboard)', () => {
  it('keeps the template as it is: Git CMS, no layers', async () => {
    await applyTemplate(dir, dashboard, 'git', [], rangeOf)

    assert.match(readConfig(), /extends: \["@plutocms\/core"\]/)
    assert.equal(
      readJson('package.json').dependencies['@plutocms/3d'],
      undefined
    )
  })

  it('adds 3D next to core on the Git CMS', async () => {
    await applyTemplate(dir, dashboard, 'git', ['3d'], rangeOf)

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
    await applyTemplate(dir, dashboard, 'supabase', [], rangeOf)

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
    await applyTemplate(
      dir,
      dashboard,
      'supabase',
      ['shop', 'blog', '3d'],
      rangeOf
    )

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
    await applyTemplate(dir, dashboard, 'supabase', ['3d'], rangeOf)

    assert.match(
      readConfig(),
      /extends: \["@plutocms\/supabase", "@plutocms\/3d"\]/
    )
    assert.ok(readJson('package.json').dependencies['@plutocms/supabase'])
  })
})

describe('withSeo', () => {
  it('adds seo once', () => {
    assert.deepEqual(withSeo([], true), ['seo'])
    assert.deepEqual(withSeo(['3d', 'seo'], true), ['3d', 'seo'])
  })

  it('takes seo out', () => {
    assert.deepEqual(withSeo(['3d', 'seo'], false), ['3d'])
  })

  it('keeps the list without a choice', () => {
    assert.deepEqual(withSeo(['3d'], undefined), ['3d'])
  })
})

describe('applyTemplate and the SEO choice (the blog)', () => {
  // The blog entry of the registry: it asks to add the SEO layer.
  const blog: TemplateEntry = {
    id: 'blog',
    name: 'Blog',
    description: '',
    category: 'blog',
    access: 'free',
    seo: true,
    source: '',
    backends: {
      git: {},
      supabase: { layer: '@plutocms/supabase-blog', remove: ['content'] },
    },
  }

  it('adds the SEO layer next to core', async () => {
    await applyTemplate(dir, blog, 'git', ['seo'], rangeOf)

    assert.match(
      readConfig(),
      /extends: \["@plutocms\/core", "@plutocms\/seo"\]/
    )
    assert.equal(
      readJson('package.json').dependencies['@plutocms/seo'],
      '^1.0.0-@plutocms/seo'
    )
  })

  it('adds the SEO layer next to the Supabase blog layer', async () => {
    await applyTemplate(dir, blog, 'supabase', ['seo'], rangeOf)

    assert.match(
      readConfig(),
      /extends: \["@plutocms\/supabase-blog", "@plutocms\/seo"\]/
    )
  })

  it('takes the SEO layer out of a template that ships it', async () => {
    fs.writeFileSync(
      path.join(dir, 'nuxt.config.ts'),
      'export default defineNuxtConfig({\n  extends: ["@plutocms/core", "@plutocms/seo"],\n})\n'
    )
    const pkg = readJson('package.json')
    pkg.dependencies['@plutocms/seo'] = '^0.2.0'
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify(pkg))

    await applyTemplate(dir, blog, 'git', [], rangeOf, ['seo'])

    assert.match(readConfig(), /extends: \["@plutocms\/core"\]/)
    assert.equal(
      readJson('package.json').dependencies['@plutocms/seo'],
      undefined
    )
  })
})
