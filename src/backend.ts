import fs from 'node:fs'
import path from 'node:path'

// Helpers that change the layers of a downloaded template. The blog and the
// admin template both use them: each template starts on the GitHub CMS
// (`@plutocms/core`), and the CLI switches the layers after the download.

export const GITHUB_LAYER = '@plutocms/core'
// The old name of core. A template that is not moved yet still extends it.
const GITHUB_LAYER_OLD = '@plutocms/pluto'
export const SUPABASE_LAYER = '@plutocms/supabase'

const SUPABASE_TYPES_SCRIPT =
  'bun node_modules/@plutocms/supabase/scripts/supabase-typegen.ts'

const EXTENDS_PATTERN = /extends:\s*\[([^\]]*)\]/
// A layer in `extends`: a plain name (`"@plutocms/core"`), or the older
// `plutoLayer("@plutocms/core")` of the templates before 2026-11.
const LAYER_PATTERN = /(?:plutoLayer\(\s*)?(["'])([^"']+)\1(?:\s*\))?/g
const QUOTE_PATTERN = /(["'])/
// The import of `plutoLayer`. The CLI writes plain names, so the import goes
// when no `plutoLayer(` call is left.
const PLUTO_LAYER_CALL = /plutoLayer\(/
const PLUTO_LAYER_IMPORT =
  /^import\s*\{\s*plutoLayer\s*\}\s*from\s*(["'])@plutocms\/(?:core|pluto)\/layers\1;?[ \t]*\r?\n(?:\r?\n)?/m

/**
 * The layers in `extends` of nuxt.config.ts, for example `@plutocms/core`.
 * Throws when the config extends no layer.
 */
export function readExtends(dir: string): string[] {
  const config = fs.readFileSync(path.join(dir, 'nuxt.config.ts'), 'utf8')
  const match = EXTENDS_PATTERN.exec(config)
  const layers = Array.from(
    (match?.[1] ?? '').matchAll(LAYER_PATTERN),
    (item) => item[2]!
  )

  if (layers.length === 0) {
    throw new Error('nuxt.config.ts does not extend a layer.')
  }

  return layers
}

/**
 * Writes the layers to `extends` of nuxt.config.ts, as plain names. The first layer in the
 * list sets the quote style. A `plutoLayer` import that is not used anymore goes.
 */
export function writeExtends(dir: string, layers: string[]): void {
  const configPath = path.join(dir, 'nuxt.config.ts')
  const config = fs.readFileSync(configPath, 'utf8')
  const match = EXTENDS_PATTERN.exec(config)

  if (!match) {
    throw new Error('nuxt.config.ts has no extends list.')
  }

  const quote = QUOTE_PATTERN.exec(match[1] ?? '')?.[1] ?? '"'
  const list = layers.map((layer) => `${quote}${layer}${quote}`).join(', ')
  let next = config.replace(EXTENDS_PATTERN, () => `extends: [${list}]`)
  if (!PLUTO_LAYER_CALL.test(next)) {
    next = next.replace(PLUTO_LAYER_IMPORT, '')
  }

  fs.writeFileSync(configPath, next)
}

export interface PackageChanges {
  // Packages to add to `dependencies`, with their version ranges.
  dependencies?: Record<string, string>
  // Packages to remove from `dependencies`.
  remove?: string[]
  // Scripts to add.
  scripts?: Record<string, string>
}

/** Changes `package.json`. Keeps the other keys. */
export function updatePackage(dir: string, changes: PackageChanges): void {
  const packagePath = path.join(dir, 'package.json')
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'))

  pkg.dependencies = { ...pkg.dependencies, ...changes.dependencies }
  for (const name of changes.remove ?? []) {
    delete pkg.dependencies[name]
  }
  if (changes.scripts) {
    pkg.scripts = { ...pkg.scripts, ...changes.scripts }
  }
  fs.writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`)
}

/**
 * Switches the base layer of a template from the GitHub CMS to a Supabase layer: the layer in
 * nuxt.config.ts, the package and the `supabase-types` script. Returns nothing for the GitHub
 * backend: the template stays as it is.
 */
export function switchToSupabase(
  dir: string,
  layer: string,
  range: string
): void {
  const layers = readExtends(dir)
  if (
    !layers.some((name) => name === GITHUB_LAYER || name === GITHUB_LAYER_OLD)
  ) {
    throw new Error(`nuxt.config.ts does not extend "${GITHUB_LAYER}".`)
  }

  writeExtends(
    dir,
    layers.map((name) =>
      name === GITHUB_LAYER || name === GITHUB_LAYER_OLD ? layer : name
    )
  )
  updatePackage(dir, {
    dependencies: { [layer]: range },
    scripts: { 'supabase-types': SUPABASE_TYPES_SCRIPT },
  })
}
