import type { Registry } from './registry.ts'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, it } from 'node:test'
import {
  backends,
  getBackendsFor,
  getTemplatesFor,
  resolveChoice,
} from './menu.ts'
import { allTemplates, fetchRegistry, NO_TEMPLATE } from './registry.ts'

const entry = {
  description: '',
  category: 'blog',
  access: 'free',
  source: '',
} as const

const registry: Registry = {
  version: 1,
  templates: [
    {
      ...entry,
      id: 'blog',
      name: 'Blog (minimalist)',
      starter: true,
      backends: { git: {}, supabase: { layer: '@plutocms/supabase-blog' } },
    },
    {
      ...entry,
      id: 'supabase-shop',
      name: 'Shop (Supabase)',
      starter: true,
      backends: { supabase: {} },
    },
    {
      ...entry,
      id: 'charon',
      name: 'Charon',
      backends: { git: {} },
    },
    {
      ...entry,
      id: 'hydra',
      name: 'Hydra',
      access: 'premium',
      backends: { git: {} },
    },
  ],
}

const templates = allTemplates(registry)
const byId = (id: string) => templates.find((template) => template.id === id)!

describe('the menu', () => {
  it('names the Git backend after the CMS, first', () => {
    assert.equal(backends[0]?.value, 'git')
    assert.equal(backends[0]?.label, 'Git CMS (Markdown files in Git)')
  })

  it('offers the starters of a backend, then "Start from scratch"', () => {
    assert.deepEqual(
      getTemplatesFor(templates, 'git').map((option) => option.value),
      ['blog', NO_TEMPLATE]
    )
    assert.deepEqual(
      getTemplatesFor(templates, 'supabase').map((option) => option.value),
      ['blog', 'supabase-shop', NO_TEMPLATE]
    )
    assert.equal(
      getTemplatesFor(templates, 'git')[0]?.label,
      'Blog (minimalist)'
    )
  })

  it('gives each template its backends', () => {
    assert.deepEqual(
      getBackendsFor(byId('blog')).map((option) => option.value),
      ['git', 'supabase']
    )
    assert.deepEqual(
      getBackendsFor(byId('supabase-shop')).map((option) => option.value),
      ['supabase']
    )
    assert.deepEqual(
      getBackendsFor(byId(NO_TEMPLATE)).map((option) => option.value),
      ['git', 'supabase']
    )
  })

  it('offers only "Start from scratch" without a registry', () => {
    assert.deepEqual(
      getTemplatesFor(allTemplates(undefined), 'git').map(
        (option) => option.value
      ),
      [NO_TEMPLATE]
    )
  })
})

describe('resolveChoice', () => {
  it('leaves both open without flags', () => {
    assert.deepEqual(resolveChoice(templates, undefined, undefined), {
      ok: true,
      template: undefined,
      backend: undefined,
    })
  })

  it('takes -t with --backend', () => {
    const result = resolveChoice(templates, 'blog', 'supabase')

    assert.ok(result.ok)
    assert.equal(result.template?.id, 'blog')
    assert.equal(result.backend, 'supabase')
  })

  it('leaves the backend open, or sets the only one', () => {
    const blog = resolveChoice(templates, 'blog', undefined)
    const shop = resolveChoice(templates, 'supabase-shop', undefined)

    assert.ok(blog.ok && shop.ok)
    assert.equal(blog.backend, undefined)
    assert.equal(shop.backend, 'supabase')
  })

  it('takes a template that is not in the menu, and -t none', () => {
    const charon = resolveChoice(templates, 'charon', undefined)
    const none = resolveChoice(templates, NO_TEMPLATE, 'supabase')

    assert.ok(charon.ok && none.ok)
    assert.equal(charon.template?.id, 'charon')
    assert.equal(charon.backend, 'git')
    assert.equal(none.template?.id, NO_TEMPLATE)
  })

  it('refuses a premium template', () => {
    const result = resolveChoice(templates, 'hydra', undefined)

    assert.ok(!result.ok)
    assert.match(result.message, /premium template/)
  })

  it('rejects a backend that the template does not support', () => {
    const result = resolveChoice(templates, 'supabase-shop', 'git')

    assert.ok(!result.ok)
    assert.match(result.message, /does not work with the "git" backend/)
  })

  it('rejects unknown names', () => {
    const template = resolveChoice(templates, 'core-blog', undefined)
    const backend = resolveChoice(templates, 'blog', 'core')

    assert.ok(!template.ok && !backend.ok)
    assert.match(template.message, /Use -t blog\|supabase-shop\|none/)
    assert.match(backend.message, /Use --backend git\|supabase/)
  })
})

describe('fetchRegistry', () => {
  it('reads the registry from a URL', async () => {
    const fetchImpl = (async () =>
      new Response(JSON.stringify(registry))) as typeof fetch

    assert.deepEqual(
      await fetchRegistry(fetchImpl, 'https://example.com/templates.json'),
      registry
    )
  })

  it('reads a local file', async () => {
    const file = path.join(os.tmpdir(), `pluto-registry-${Date.now()}.json`)
    fs.writeFileSync(file, JSON.stringify(registry))
    try {
      assert.equal((await fetchRegistry(fetch, file)).templates.length, 4)
    } finally {
      fs.rmSync(file)
    }
  })

  it('fails on an error or an unknown format', async () => {
    const notFound = (async () =>
      new Response('', { status: 404 })) as typeof fetch
    const other = (async () =>
      new Response(
        JSON.stringify({ version: 2, templates: [] })
      )) as typeof fetch

    await assert.rejects(fetchRegistry(notFound, 'https://x.dev/t.json'), /404/)
    await assert.rejects(
      fetchRegistry(other, 'https://x.dev/t.json'),
      /unknown format/
    )
  })
})
