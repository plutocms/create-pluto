import type { TemplateEntry } from './registry.ts'

export interface MenuOption {
  value: string
  label: string
  hint?: string
}

// The Git CMS comes first: it needs no account and no database.
export const backends: MenuOption[] = [
  {
    value: 'git',
    label: 'Git CMS (Markdown files in Git)',
    hint: 'No database. Posts are Markdown files in your Git repository. Works with local Git out of the box; connect GitHub to publish from a deployed site',
  },
  {
    value: 'supabase',
    label: 'Supabase',
    hint: 'Hosted Postgres Database',
  },
]

function toOption(template: TemplateEntry): MenuOption {
  return {
    value: template.id,
    label: template.name,
    hint: template.description,
  }
}

/** The menu of a backend: the starter templates that work with it. */
export function getTemplatesFor(
  templates: TemplateEntry[],
  backend: string
): MenuOption[] {
  return templates
    .filter((template) => template.starter && template.backends[backend])
    .map(toOption)
}

/** The backends of a template, in the order of the menu. */
export function getBackendsFor(template: TemplateEntry): MenuOption[] {
  return backends.filter((backend) => template.backends[backend.value])
}

export type ChoiceResult =
  | { ok: true; template?: TemplateEntry; backend?: string }
  | { ok: false; message: string }

/**
 * Resolves `-t <id>` and `--backend <backend>` against the templates of the registry. Either
 * can be missing: the CLI asks for it. A template with one backend gets that backend.
 */
export function resolveChoice(
  templates: TemplateEntry[],
  templateArg: string | undefined,
  backendArg: string | undefined
): ChoiceResult {
  const backendNames = backends.map((option) => option.value)
  const template = templateArg
    ? templates.find((item) => item.id === templateArg)
    : undefined

  if (templateArg && !template) {
    const starters = templates
      .filter((item) => item.starter)
      .map((item) => item.id)
    return {
      ok: false,
      message: `Unknown template "${templateArg}". Use -t ${starters.join('|')}, or the id of a template in https://github.com/plutocms/templates.`,
    }
  }

  if (template && template.access !== 'free') {
    return {
      ok: false,
      message: `"${template.name}" is a premium template. The CLI cannot download it yet.`,
    }
  }

  if (backendArg && !backendNames.includes(backendArg)) {
    return {
      ok: false,
      message: `Unknown backend "${backendArg}". Use --backend ${backendNames.join('|')}.`,
    }
  }

  let backend = backendArg

  if (template && backend && !template.backends[backend]) {
    const allowed = getBackendsFor(template).map((option) => option.value)
    return {
      ok: false,
      message: `The "${template.id}" template does not work with the "${backend}" backend. Use --backend ${allowed.join('|')}.`,
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
