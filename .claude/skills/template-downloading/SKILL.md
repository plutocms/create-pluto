# Template downloading

After gathering all user inputs, the CLI downloads a complete Pluto project template from GitHub.

## Mechanism

The CLI uses the `giget` library to download templates. This library pulls from GitHub repositories with the `gh:` prefix.

## Template sources

`templateSource(template)` in `src/menu.ts` gives the repository of each template:

- `blog`: `gh:plutocms/pluto-blog-template` (one template for both backends)
- `shop`: `gh:plutocms/pluto-supabase-shop-template`

## The blog backend

The blog template extends `@plutocms/core` (the GitHub CMS) and has the sample posts in
`content/`. After the download, `applyBlogBackend(dir, backend, range)` in `src/blog-backend.ts`
sets the backend:

- `github`: no change.
- `supabase`: `plutoLayer("@plutocms/core")` in `nuxt.config.ts` becomes
  `plutoLayer("@plutocms/supabase-blog")`; `package.json` gets `@plutocms/supabase-blog` (the
  caret range of its latest version on npm, from `latestRange()`, else `latest`), the
  `supabase-types` script and the Supabase packages in `trustedDependencies`; `content/` goes.

A config that does not extend `plutoLayer("@plutocms/core")` stops the CLI with an error.
Tests: `src/blog-backend.test.ts` (a temporary folder, a fake `fetch`).

## Download behavior

The `downloadTemplate()` call:

- Downloads to the directory the user specified
- Uses `force: true` to allow overwriting existing files if the user confirmed
- Returns the `source` URL, which is logged to the user for transparency

## Progress feedback

During the download, a spinner displays: `Downloading Pluto template...`

After the download succeeds, the CLI logs the template source and proceeds to environment file generation.

## Error handling

If the download fails, the process exits with a non-zero status and logs the error.
