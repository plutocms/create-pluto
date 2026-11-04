import fs from 'node:fs'

// The templates come from the registry of the templates repo
// (github.com/plutocms/templates, `templates.json`). A new template there needs
// no release of the CLI. The menu shows the starter templates; `-t <id>`
// takes any free template of the registry.

/** What the CLI changes in a downloaded template for one backend. */
export interface BackendChanges {
  /** The layer that replaces `@plutocms/core` in `extends`, with its package. */
  layer?: string
  /** Paths to delete, relative to the project. */
  remove?: string[]
}

export interface TemplateEntry {
  id: string
  name: string
  description: string
  category: string
  access: 'free' | 'premium'
  /** Offered in the menu of the CLI. */
  starter?: boolean
  /** The CLI can add layers (`--layers`). */
  layers?: boolean
  /** A giget source, for example `gh:plutocms/templates/templates/blog`. */
  source: string
  demo?: string
  /** The backends the template works with. As downloaded, it uses the first one. */
  backends: Record<string, BackendChanges>
}

export interface Registry {
  version: number
  templates: TemplateEntry[]
}

const HTTP_URL = /^https?:\/\//

export const REGISTRY_URL =
  'https://raw.githubusercontent.com/plutocms/templates/main/templates.json'

/** `-t none`: no template, the CLI writes a bare project. */
export const NO_TEMPLATE = 'none'

export const scratchTemplate: TemplateEntry = {
  id: NO_TEMPLATE,
  name: 'Start from scratch',
  description:
    'No template: a Nuxt app that extends Pluto, with no pages of its own. A good start for an agent',
  category: 'none',
  access: 'free',
  starter: true,
  layers: true,
  source: '',
  backends: {
    git: {},
    supabase: { layer: '@plutocms/supabase' },
  },
}

/**
 * Reads the registry. `PLUTO_TEMPLATES_URL` overrides the URL, and a value
 * that is not an http(s) URL is a local file (to test a registry before it
 * is pushed).
 */
export async function fetchRegistry(
  fetchImpl: typeof fetch = fetch,
  location = process.env.PLUTO_TEMPLATES_URL || REGISTRY_URL
): Promise<Registry> {
  const data = HTTP_URL.test(location)
    ? await fetchJson(fetchImpl, location)
    : JSON.parse(fs.readFileSync(location, 'utf8'))

  if (data?.version !== 1 || !Array.isArray(data.templates)) {
    throw new Error(
      `The template registry at ${location} has an unknown format.`
    )
  }

  return data as Registry
}

async function fetchJson(fetchImpl: typeof fetch, url: string) {
  const response = await fetchImpl(url)
  if (!response.ok) {
    throw new Error(`The template registry answered ${response.status}.`)
  }
  return response.json()
}

/** Every template the CLI can use: the registry, then "Start from scratch". */
export function allTemplates(registry: Registry | undefined): TemplateEntry[] {
  return [
    ...(registry?.templates ?? []).filter(
      (template) => template.id !== NO_TEMPLATE
    ),
    scratchTemplate,
  ]
}
