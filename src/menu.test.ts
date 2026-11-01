import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  getBackendsFor,
  getTemplatesFor,
  menu,
  resolveChoice,
  templateSource,
} from './menu.ts'

describe('backend choices', () => {
  it('names the GitHub backend after the CMS', () => {
    const github = menu.backends.find((option) => option.value === 'git')

    assert.equal(github?.label, 'Git CMS (Markdown files in Git)')
    assert.deepEqual(github?.templates, ['blog', 'admin'])
  })

  it('gives each backend its templates', () => {
    assert.deepEqual(
      getTemplatesFor('supabase').map((option) => option.value),
      ['shop', 'blog', 'admin']
    )
    assert.deepEqual(
      getTemplatesFor('git').map((option) => option.value),
      ['blog', 'admin']
    )
    assert.deepEqual(getTemplatesFor('unknown'), [])
  })

  it('gives each template its backends', () => {
    assert.deepEqual(
      getBackendsFor('blog').map((option) => option.value),
      ['git', 'supabase']
    )
    assert.deepEqual(
      getBackendsFor('admin').map((option) => option.value),
      ['git', 'supabase']
    )
    assert.deepEqual(
      getBackendsFor('shop').map((option) => option.value),
      ['supabase']
    )
  })

  it('downloads one admin template for both backends', () => {
    assert.equal(templateSource('admin'), 'gh:plutocms/pluto-admin-template')
  })

  it('downloads one blog template for both backends', () => {
    assert.equal(templateSource('blog'), 'gh:plutocms/pluto-blog-template')
    assert.equal(
      templateSource('shop'),
      'gh:plutocms/pluto-supabase-shop-template'
    )
  })
})

describe('resolveChoice', () => {
  it('leaves both open without flags', () => {
    assert.deepEqual(resolveChoice(undefined, undefined), {
      ok: true,
      template: undefined,
      backend: undefined,
    })
  })

  it('takes -t blog with --backend', () => {
    assert.deepEqual(resolveChoice('blog', 'git'), {
      ok: true,
      template: 'blog',
      backend: 'git',
    })
    assert.deepEqual(resolveChoice('blog', 'supabase'), {
      ok: true,
      template: 'blog',
      backend: 'supabase',
    })
  })

  it('leaves the blog backend open, and sets the only shop backend', () => {
    assert.deepEqual(resolveChoice('blog', undefined), {
      ok: true,
      template: 'blog',
      backend: undefined,
    })
    assert.deepEqual(resolveChoice('shop', undefined), {
      ok: true,
      template: 'shop',
      backend: 'supabase',
    })
  })

  it('keeps the older names as aliases', () => {
    assert.deepEqual(resolveChoice('core-blog', undefined), {
      ok: true,
      template: 'blog',
      backend: 'git',
    })
    assert.deepEqual(resolveChoice('supabase-blog', undefined), {
      ok: true,
      template: 'blog',
      backend: 'supabase',
    })
    assert.deepEqual(resolveChoice('supabase-shop', 'supabase'), {
      ok: true,
      template: 'shop',
      backend: 'supabase',
    })
  })

  it('rejects an alias with another backend', () => {
    const result = resolveChoice('core-blog', 'supabase')

    assert.ok(!result.ok)
    assert.match(result.message, /uses the "git" backend/)
  })

  it('rejects a backend that the template does not support', () => {
    const result = resolveChoice('shop', 'git')

    assert.ok(!result.ok)
    assert.match(result.message, /does not work with the "git" backend/)
  })

  it('rejects unknown names', () => {
    for (const [template, backend] of [
      ['nope', undefined],
      ['core-shop', undefined],
      ['blog', 'core'],
      ['blog', 'nope'],
    ] as const) {
      const result = resolveChoice(template, backend)

      assert.equal(result.ok, false, `${template} ${backend}`)
      assert.ok(!result.ok)
      assert.match(result.message, /Use -t shop\|blog|Use --backend/)
    }
  })
})
