# Template downloading

The CLI starts a project from a template of the templates repo, or from scratch (`-t none`).

## The registry

The templates are in `plutocms/templates`: each folder `templates/<id>/` is a project, and
`templates.json` at the root is the registry. `src/registry.ts`:

- `fetchRegistry()` reads `REGISTRY_URL` (the raw `templates.json` on `main`).
  `PLUTO_TEMPLATES_URL` overrides it; a value that is not an http(s) URL is a local file (to test
  a registry before it is pushed). A registry with `version` other than 1 is refused.
- An entry (`TemplateEntry`): `id`, `name`, `description`, `category`, `access`
  (`free` / `premium`), `starter` (in the menu), `layers` (the CLI can add layers), `source` (a
  giget source, `gh:plutocms/templates/templates/<id>`), `demo`, and `backends`: per backend the
  changes `{ layer?, remove? }`. As downloaded, a template uses the Git CMS (or its only backend).
- `allTemplates(registry)` is the registry plus `scratchTemplate` (`id: 'none'`, both backends,
  `layers: true`, last in the menu).
- The CLI loads the registry first, except for `-t none`. With a `-t` and no registry, it stops.
  Without a `-t`, it warns and offers "Start from scratch" only.

## The menu and the flags

`src/menu.ts`: `backends` (Git CMS first), `getTemplatesFor(templates, backend)` (the starters
of a backend), `getBackendsFor(template)`, and `resolveChoice(templates, -t, --backend)`: any
template of the registry, not only a starter; a premium one is refused ("The CLI cannot download
it yet"); a template with one backend gets it. The old names (`core-blog`, `supabase-blog`,
`admin`, `shop`) are gone. Tests: `src/menu.test.ts`.

## Download and changes

- giget downloads `template.source` (the folder only) with `force: true`. `setPackageName(dir)`
  then names the project after its folder (`packageNameOf`: `My Blog` gives `my-blog`).
- `-t none`: `writeScratchProject(dir, rangeOf)` writes `package.json` (the latest caret ranges
  of `@plutocms/core`, `nuxt`, `vue`, `vue-router`; TypeScript `^5.9.3`, the range of the
  templates), `nuxt.config.ts` (extends core, today as `compatibilityDate`), `app/app.vue`
  (`PlutoRoot` + `NuxtPage`), `tsconfig.json` and `.gitignore`.
- `applyTemplate(dir, template, backend, layers, rangeOf)` (`src/template.ts`): `layer` swaps
  `@plutocms/core` for that layer (`switchToSupabase`: `extends`, the package, the
  `supabase-types` script), `remove` deletes paths, then `addLayers` (`src/layers.ts`) adds the
  picked layers. A feature layer (shop, blog) replaces `@plutocms/supabase` in `extends` and in
  `dependencies`. The layers menu shows Shop, Blog, 3D and SEO for Supabase, and 3D and SEO for the Git CMS.
- `latestRange(name)` (`src/npm.ts`): the caret range of the latest version on npm, else
  `latest`.

The shared helpers (`readExtends`, `writeExtends`, `updatePackage`, `switchToSupabase`) are in
`src/backend.ts`. Tests: `src/template.test.ts`, `src/layers.test.ts` (temporary folders, a fake
`fetch`).

## Progress feedback

A spinner shows `Downloading the template "<name>"...` (or `Writing the project...`), then the
source. A failed download exits with a non-zero status.
