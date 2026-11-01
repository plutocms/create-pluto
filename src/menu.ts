export interface MenuOption {
  value: string
  label: string
  hint?: string
}

export interface BackendOption extends MenuOption {
  // The template values this backend can use.
  templates: string[]
}

export interface Menu {
  backends: BackendOption[]
  templates: MenuOption[]
}

export const menu: Menu = {
  // The Git CMS comes first: it needs no account and no database.
  backends: [
    {
      value: 'git',
      label: 'Git CMS (Markdown files in Git)',
      hint: 'No database. Posts are Markdown files in your Git repository. Works with local Git out of the box; connect GitHub to publish from a deployed site',
      templates: ['blog', 'admin'],
    },
    {
      value: 'supabase',
      label: 'Supabase',
      hint: 'Hosted Postgres Database',
      templates: ['shop', 'blog', 'admin'],
    },
  ],

  templates: [
    {
      value: 'shop',
      label: 'Shop (e-commerce)',
      hint: 'A full-featured online store template',
    },
    {
      value: 'blog',
      label: 'Blog',
      hint: 'A blog with search, languages and a post editor with a live preview',
    },
    {
      value: 'admin',
      label: 'Dashboard only',
      hint: 'No public site: the Pluto admin and the public API, for a site in any stack',
    },
  ],
}

// The GitHub repository of each template. The blog is one template for both
// backends: the CLI sets the backend after the download (blog-backend.ts). The admin template
// works the same way (layers.ts).
const TEMPLATE_REPOS: Record<string, string> = {
  blog: 'pluto-blog-template',
  shop: 'pluto-supabase-shop-template',
  admin: 'pluto-admin-template',
}

export function templateSource(template: string): string {
  return `gh:plutocms/${TEMPLATE_REPOS[template]}`
}

export function getTemplatesFor(backend: string) {
  const option = menu.backends.find((item) => item.value === backend)

  return menu.templates.filter((template) =>
    option?.templates.includes(template.value)
  )
}

export function getBackendsFor(template: string) {
  return menu.backends.filter((backend) => backend.templates.includes(template))
}

// The older `-t <backend>-<template>` names. `core` was the GitHub backend.
const ALIASES: Record<string, { template: string; backend: string }> = {
  'core-blog': { template: 'blog', backend: 'git' },
  'supabase-blog': { template: 'blog', backend: 'supabase' },
  'supabase-shop': { template: 'shop', backend: 'supabase' },
}

export type ChoiceResult =
  | { ok: true; template?: string; backend?: string }
  | { ok: false; message: string }

/**
 * Resolves `-t <template>` and `--backend <backend>`. Either can be missing: the CLI asks for
 * it. A template with one backend (the shop) gets that backend.
 */
export function resolveChoice(
  templateArg: string | undefined,
  backendArg: string | undefined
): ChoiceResult {
  const templates = menu.templates.map((option) => option.value)
  const backends = menu.backends.map((option) => option.value)
  const usage = `Use -t ${templates.join('|')} and --backend ${backends.join('|')}.`

  let template = templateArg
  let backend = backendArg
  const alias = template ? ALIASES[template] : undefined

  if (alias) {
    if (backend && backend !== alias.backend) {
      return {
        ok: false,
        message: `"-t ${template}" uses the "${alias.backend}" backend, not "${backend}". ${usage}`,
      }
    }
    template = alias.template
    backend = alias.backend
  }

  if (template && !templates.includes(template)) {
    return { ok: false, message: `Unknown template "${template}". ${usage}` }
  }

  if (backend && !backends.includes(backend)) {
    return { ok: false, message: `Unknown backend "${backend}". ${usage}` }
  }

  if (template && backend) {
    const allowed = getBackendsFor(template).map((option) => option.value)
    if (!allowed.includes(backend)) {
      return {
        ok: false,
        message: `The "${template}" template does not work with the "${backend}" backend. Use --backend ${allowed.join('|')}.`,
      }
    }
  }

  if (template && !backend) {
    const allowed = getBackendsFor(template)
    if (allowed.length === 1) {
      backend = allowed[0]!.value
    }
  }

  return { ok: true, template, backend }
}
