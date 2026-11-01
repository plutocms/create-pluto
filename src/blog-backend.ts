import fs from 'node:fs'
import path from 'node:path'
import { switchToSupabase } from './backend.ts'

// The blog template works with both backends. As downloaded, it uses the
// Git CMS: it extends `@plutocms/core` and has the sample posts in
// `content/`. For Supabase, the CLI changes three things: the layer in
// nuxt.config.ts, the packages in package.json, and the `content/` folder.

const SUPABASE_BLOG_LAYER = '@plutocms/supabase-blog'

/**
 * Sets the backend of a downloaded blog template. `git` keeps the template
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

  switchToSupabase(dir, SUPABASE_BLOG_LAYER, supabaseBlogRange)
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
