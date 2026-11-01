import {
  readExtends,
  SUPABASE_LAYER,
  switchToSupabase,
  updatePackage,
  writeExtends,
} from './backend.ts'

// The layers that the admin template can add. A feature layer on Supabase (shop, blog) extends
// `@plutocms/supabase` itself, so the app extends the feature layer instead of the backend layer.

export interface LayerOption {
  value: string
  label: string
  hint: string
  package: string
  // The backends that the layer works with.
  backends: string[]
  // A layer that extends the backend layer. It replaces that layer in `extends`.
  feature: boolean
}

export const layerOptions: LayerOption[] = [
  {
    value: 'shop',
    label: 'Shop',
    hint: 'Products, stock and the media library',
    package: '@plutocms/supabase-shop',
    backends: ['supabase'],
    feature: true,
  },
  {
    value: 'blog',
    label: 'Blog',
    hint: 'Posts with a rich text editor',
    package: '@plutocms/supabase-blog',
    backends: ['supabase'],
    feature: true,
  },
  {
    value: '3d',
    label: '3D',
    hint: 'Show 3D models (works with both backends)',
    package: '@plutocms/3d',
    backends: ['git', 'supabase'],
    feature: false,
  },
]

export function getLayersFor(backend: string): LayerOption[] {
  return layerOptions.filter((layer) => layer.backends.includes(backend))
}

export type LayersResult =
  { ok: true; layers: string[] } | { ok: false; message: string }

/**
 * Resolves `--layers shop,3d`. `none` and an empty value mean no layers. The backend can be
 * missing: then only the names are checked.
 */
export function resolveLayers(
  layersArg: string | undefined,
  backend: string | undefined
): LayersResult {
  if (layersArg === undefined) {
    return { ok: true, layers: [] }
  }

  const names = layersArg
    .split(',')
    .map((name) => name.trim().toLowerCase())
    .filter((name) => name && name !== 'none')
  const known = layerOptions.map((layer) => layer.value)
  const unknown = names.find((name) => !known.includes(name))

  if (unknown) {
    return {
      ok: false,
      message: `Unknown layer "${unknown}". Use --layers ${known.join(',')}.`,
    }
  }

  if (backend) {
    const allowed = getLayersFor(backend).map((layer) => layer.value)
    const wrong = names.find((name) => !allowed.includes(name))
    if (wrong) {
      return {
        ok: false,
        message: `The "${wrong}" layer does not work with the "${backend}" backend. Use --layers ${allowed.join(',')}.`,
      }
    }
  }

  return { ok: true, layers: [...new Set(names)] }
}

/**
 * Sets the backend and the layers of a downloaded admin template. As downloaded, it extends
 * `@plutocms/core`. `rangeOf` gives the version range of a package (the latest on npm).
 */
export async function applyAdminTemplate(
  dir: string,
  backend: string,
  layers: string[],
  rangeOf: (name: string) => Promise<string>
): Promise<void> {
  const picked = layerOptions.filter((layer) => layers.includes(layer.value))
  const features = picked.filter((layer) => layer.feature)

  if (backend === 'supabase') {
    // A feature layer brings `@plutocms/supabase`. Without one, the app extends it itself.
    switchToSupabase(dir, SUPABASE_LAYER, await rangeOf(SUPABASE_LAYER))
  }

  if (picked.length === 0) {
    return
  }

  // Only the top layers go in `extends`.
  const base = readExtends(dir).filter(
    (name) => !(features.length > 0 && name === SUPABASE_LAYER)
  )
  const added = picked.map((layer) => layer.package)
  writeExtends(dir, [...new Set([...base, ...added])])

  const dependencies: Record<string, string> = {}
  for (const name of added) {
    dependencies[name] = await rangeOf(name)
  }
  updatePackage(dir, {
    dependencies,
    // The feature layer brings `@plutocms/supabase`.
    remove: features.length > 0 ? [SUPABASE_LAYER] : [],
  })
}
