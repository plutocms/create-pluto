import fs from 'node:fs'
import path from 'node:path'

// Helpers that change the layers of a downloaded template. The blog and the
// admin template both use them: each template starts on the GitHub CMS
// (`@plutocms/core`), and the CLI switches the layers after the download.

export const GITHUB_LAYER = '@plutocms/core'
// The old name of core. A template that is not moved yet still extends it.
const GITHUB_LAYER_OLD = '@plutocms/pluto'
export const SUPABASE_LAYER = '@plutocms/supabase'

// Packages with install scripts that bun must run (the Supabase layers and
// the Supabase CLI that the types script uses).
export const SUPABASE_TRUSTED = [
  '@plutocms/supabase',
  '@plutocms/utils',
  'supabase',
]

const SUPABASE_TYPES_SCRIPT =
  'bun node_modules/@plutocms/supabase/scripts/supabase-typegen.ts'

const EXTENDS_PATTERN = /extends:\s*\[([^\]]*)\]/
const LAYER_PATTERN = /plutoLayer\(\s*(["'])([^"']+)\1\s*\)/g
const QUOTE_PATTERN = /plutoLayer\(\s*(["'])/

/**
 * The layers in `extends` of nuxt.config.ts, for example `@plutocms/core`.
 * Throws when the config has no `plutoLayer("...")` list.
 */
export function readExtends(dir: string): string[] {
  const config = fs.readFileSync(path.join(dir, 'nuxt.config.ts'), 'utf8')
  const match = EXTENDS_PATTERN.exec(config)
  const layers = Array.from(
    (match?.[1] ?? '').matchAll(LAYER_PATTERN),
    (item) => item[2]!
  )

  if (layers.length === 0) {
    throw new Error('nuxt.config.ts does not extend a plutoLayer("...").')
  }

  return layers
}

/**
 * Writes the layers to `extends` of nuxt.config.ts. The first layer name in the file sets
 * the quote style. The old name of core counts as core.
 */
export function writeExtends(dir: string, layers: string[]): void {
  const configPath = path.join(dir, 'nuxt.config.ts')
  const config = fs.readFileSync(configPath, 'utf8')
  const quote = QUOTE_PATTERN.exec(config)?.[1] ?? '"'

  if (!EXTENDS_PATTERN.test(config)) {
    throw new Error('nuxt.config.ts has no extends list.')
  }

  const list = layers
    .map((layer) => `plutoLayer(${quote}${layer}${quote})`)
    .join(', ')

  fs.writeFileSync(
    configPath,
    config.replace(EXTENDS_PATTERN, () => `extends: [${list}]`)
  )
}

export interface PackageChanges {
  // Packages to add to `dependencies`, with their version ranges.
  dependencies?: Record<string, string>
  // Packages that bun may run install scripts for.
  trusted?: string[]
  // Packages to remove from `dependencies`.
  remove?: string[]
  // Scripts to add.
  scripts?: Record<string, string>
}

/** Changes `package.json`. Keeps the other keys, and sorts `trustedDependencies`. */
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
  if (changes.trusted) {
    pkg.trustedDependencies = [
      ...new Set([...(pkg.trustedDependencies ?? []), ...changes.trusted]),
    ].sort()
  }
  fs.writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`)
}

/**
 * Switches the base layer of a template from the GitHub CMS to a Supabase layer: the layer in
 * nuxt.config.ts, the package, the trusted packages and the `supabase-types` script. Returns
 * nothing for the GitHub backend: the template stays as it is.
 */
export function switchToSupabase(
  dir: string,
  layer: string,
  range: string,
  trusted: string[] = []
): void {
  const layers = readExtends(dir)
  if (
    !layers.some((name) => name === GITHUB_LAYER || name === GITHUB_LAYER_OLD)
  ) {
    throw new Error(
      `nuxt.config.ts does not extend plutoLayer("${GITHUB_LAYER}").`
    )
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
    trusted: [...SUPABASE_TRUSTED, layer, ...trusted],
  })
}
