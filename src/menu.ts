export interface MenuOption {
  value: string
  label: string
  hint?: string
}

export interface DatabaseOption extends MenuOption {
  // The template values this database can use.
  templates: string[]
}

export interface Menu {
  databases: DatabaseOption[]
  templates: MenuOption[]
}

export const menu: Menu = {
  databases: [
    {
      value: 'supabase',
      label: 'Supabase',
      hint: 'Hosted Postgres Database',
      templates: ['shop', 'blog'],
    },
    {
      value: 'core',
      label: 'None (Markdown files in GitHub)',
      hint: 'No database. Posts are Markdown files in a GitHub repository',
      templates: ['blog'],
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
      hint: 'A simple blog template with a rich text editor',
    },
  ],
}

export function getTemplatesFor(databaseProvider: string) {
  const database = menu.databases.find(
    (option) => option.value === databaseProvider
  )

  return menu.templates.filter((template) =>
    database?.templates.includes(template.value)
  )
}

export function getAvailableShortcuts() {
  return menu.databases.flatMap((database) =>
    getTemplatesFor(database.value).map(
      (template) => `${database.value}-${template.value}`
    )
  )
}

export type ShortcutResult =
  | { ok: true, databaseProvider: string, templateChoice: string }
  | { ok: false, message: string }

export function resolveTemplateShortcut(
  templateShortcut: string | undefined
): ShortcutResult {
  const parts = (templateShortcut ?? '').split('-')
  const [databaseProvider, templateChoice] = parts
  const available = `Available options: ${getAvailableShortcuts().join(', ')}`

  const database = menu.databases.find(
    (option) => option.value === databaseProvider
  )
  const templateExists = menu.templates.some(
    (option) => option.value === templateChoice
  )

  if (parts.length !== 2 || !database || !templateExists) {
    return {
      ok: false,
      message: `Unknown template "${templateShortcut}". ${available}`,
    }
  }

  if (!database.templates.includes(templateChoice as string)) {
    return {
      ok: false,
      message: `The "${databaseProvider}" option has no "${templateChoice}" template. ${available}`,
    }
  }

  return {
    ok: true,
    databaseProvider: databaseProvider as string,
    templateChoice: templateChoice as string,
  }
}
