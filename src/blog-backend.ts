import fs from 'node:fs'
import path from 'node:path'

// The blog template works with both backends. As downloaded, it uses the
// GitHub CMS: it extends `@plutocms/core` and has the sample posts in
// `content/`. For Supabase, the CLI changes three things: the layer in
// nuxt.config.ts, the packages in package.json, and the `content/` folder.

const GITHUB_LAYER = '@plutocms/core'
// The old name of core. A template that is not moved yet still extends it.
const GITHUB_LAYER_OLD = '@plutocms/pluto'
const SUPABASE_LAYER = '@plutocms/supabase-blog'

// Packages with install scripts that bun must run (the Supabase layers and
// the Supabase CLI that the types script uses).
const SUPABASE_TRUSTED = [
  '@plutocms/supabase',
  '@plutocms/supabase-blog',
  '@plutocms/utils',
  'supabase',
]

/**
 * Sets the backend of a downloaded blog template. `github` keeps the template
 * as it is. `supabase` needs the version range of `@plutocms/supabase-blog`.
 */
export function applyBlogBackend(
  dir: string,
  backend: string,
  supabaseBlogRange = 'latest'
): void {
  if (backend !== 'supabase') {
    return
  }

  const configPath = path.join(dir, 'nuxt.config.ts')
  const config = fs.readFileSync(configPath, 'utf8')
  const layer = new RegExp(
    `plutoLayer\\((["'])(?:${GITHUB_LAYER}|${GITHUB_LAYER_OLD})\\1\\)`
  )
  if (!layer.test(config)) {
    throw new Error(
      `nuxt.config.ts does not extend plutoLayer("${GITHUB_LAYER}").`
    )
  }
  fs.writeFileSync(
    configPath,
    config.replace(layer, `plutoLayer($1${SUPABASE_LAYER}$1)`)
  )

  const packagePath = path.join(dir, 'package.json')
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
  pkg.dependencies = {
    ...pkg.dependencies,
    [SUPABASE_LAYER]: supabaseBlogRange,
  }
  pkg.scripts = {
    ...pkg.scripts,
    'supabase-types':
      'bun node_modules/@plutocms/supabase/scripts/supabase-typegen.ts',
  }
  pkg.trustedDependencies = [
    ...new Set([...(pkg.trustedDependencies ?? []), ...SUPABASE_TRUSTED]),
  ].sort()
  fs.writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`)

  fs.rmSync(path.join(dir, 'content'), { recursive: true, force: true })
}

/**
 * The caret range of the latest version of a package on npm, for example
 * `^0.15.1`. `latest` when npm does not answer.
 */
export async function latestRange(
  name: string,
  fetchImpl: typeof fetch = fetch
): Promise<string> {
  try {
    const response = await fetchImpl(
      `https://registry.npmjs.org/${name}/latest`
    )
    if (!response.ok) {
      return 'latest'
    }
    const data = (await response.json()) as { version?: unknown }
    return typeof data.version === 'string' ? `^${data.version}` : 'latest'
  } catch {
    return 'latest'
  }
}
