import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  getAvailableShortcuts,
  getTemplatesFor,
  menu,
  resolveTemplateShortcut,
} from './menu.ts'

describe('database choices', () => {
  it('has the core choice with the expected shape', () => {
    const core = menu.databases.find((option) => option.value === 'core')

    assert.deepEqual(core, {
      value: 'core',
      label: 'None (Markdown files in Git)',
      hint: 'No database. Posts are Markdown files in your Git repository. Works with local Git out of the box; connect GitHub to publish from a deployed site',
      templates: ['blog'],
    })
  })

  it('keeps the supabase choice', () => {
    assert.deepEqual(
      getTemplatesFor('supabase').map((option) => option.value),
      ['shop', 'blog']
    )
  })

  it('allows only the blog template for core', () => {
    assert.deepEqual(
      getTemplatesFor('core').map((option) => option.value),
      ['blog']
    )
    assert.deepEqual(getTemplatesFor('unknown'), [])
  })

  it('lists only valid shortcuts', () => {
    assert.deepEqual(getAvailableShortcuts(), [
      'supabase-shop',
      'supabase-blog',
      'core-blog',
    ])
  })
})

describe('resolveTemplateShortcut', () => {
  it('resolves core-blog', () => {
    const result = resolveTemplateShortcut('core-blog')

    assert.deepEqual(result, {
      ok: true,
      databaseProvider: 'core',
      templateChoice: 'blog',
    })
    assert.ok(result.ok)
    assert.equal(
      `gh:plutocms/pluto-${result.databaseProvider}-${result.templateChoice}-template`,
      'gh:plutocms/pluto-core-blog-template'
    )
  })

  it('keeps the existing valid pairs working', () => {
    for (const shortcut of ['supabase-shop', 'supabase-blog']) {
      assert.equal(resolveTemplateShortcut(shortcut).ok, true)
    }
  })

  it('rejects core-shop with a clear message', () => {
    const result = resolveTemplateShortcut('core-shop')

    assert.equal(result.ok, false)
    assert.ok(!result.ok)
    assert.match(result.message, /"core" option has no "shop" template/)
    assert.match(result.message, /core-blog/)
  })

  it('rejects unknown, partial and extra-part shortcuts', () => {
    for (const shortcut of [
      'nope-blog',
      'core-nope',
      'core',
      '',
      'core-blog-extra',
      'supabase-shop-x',
    ]) {
      const result = resolveTemplateShortcut(shortcut)

      assert.equal(result.ok, false, shortcut)
      assert.ok(!result.ok)
      assert.match(result.message, /Available options:/)
    }

    assert.equal(resolveTemplateShortcut(undefined).ok, false)
  })
})
