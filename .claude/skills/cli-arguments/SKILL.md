# CLI argument support

The CLI accepts arguments to skip interactive prompts. This is useful for scripting and quick setups.

## Positional argument

Pass a directory name as the first positional argument:

```bash
create-pluto my-project
```

This sets the project directory without prompting.

## Template and backend

- `-t <template>`, `--template <template>`, `--template=<template>`: the id of a template of the
  registry (`blog`, `supabase-shop`, `dashboard`, or any other free one), or `none` (start from
  scratch). See the template-downloading skill.
- `--backend <backend>`, `--backend=<backend>`: `git` (the Git CMS) or `supabase`.

```bash
create-pluto my-blog -t blog --backend git
create-pluto my-blog -t blog --backend supabase
create-pluto my-shop -t supabase-shop
create-pluto my-app -t none --backend git
```

Not every backend works with every template: the Supabase shop needs `supabase`, the blog works
with both. A template with one backend gets it without a flag (`-t supabase-shop` means
`supabase`). Without `--backend`, the blog asks for it. Without `-t`, the CLI asks for the
backend, then for a starter template of that backend. A premium template is refused.

A wrong name stops the CLI with status 1 and a message that lists the right names, for example
`The "supabase-shop" template does not work with the "git" backend. Use --backend supabase.`

## Layers (dashboard, none)

- `--layers <list>`, `--layers=<list>`: the layers to add to a template with `layers` in the registry (`dashboard`)
  or to `-t none`, separated by commas.
  The names are `shop`, `blog`, `3d` and `seo`. `shop` and `blog` need `--backend supabase`; `3d` and
  `seo` work with both.
  `none` (or an empty value) means no layers.

```bash
create-pluto my-cms -t dashboard --backend git --layers 3d
create-pluto my-cms -t dashboard --backend supabase --layers shop,3d
```

Without `--layers`, the CLI asks (a multi-select) with a terminal, and adds no layers without one.
`--layers` with another template, an unknown name, or a layer the backend does not allow stops the CLI
with status 1. `resolveLayers()` in `src/layers.ts` validates it.

## SEO

A template with `seo: true` in the registry (the blog) asks "Add SEO?" (a confirm, yes by default).
Without a terminal the answer is yes. `--seo` and `--no-seo` skip the question, for any template.

- Yes: `withSeo()` adds `seo` to the layers, and `addLayers` puts `@plutocms/seo` in `extends`
  and `package.json`.
- No: `applyTemplate(..., without)` calls `removeLayers()`, so a template that still ships the
  layer loses it too. The template itself ships without `@plutocms/seo`.

Tests: `src/layers.test.ts` ("withSeo", "applyTemplate and the SEO choice").

## Package manager and install

- `--pm <name>`, `--pm=<name>`, `--package-manager <name>`: use this package manager and do not
  ask. The name is one of `npm`, `pnpm`, `yarn`, `bun`, `deno`. Another name stops the CLI with
  status 1 and the list of names.
- `--no-install`: do not install the dependencies. The next steps show the install command.

```bash
create-pluto my-blog -t blog --backend git --pm bun
create-pluto my-blog -t blog --backend git --pm pnpm --no-install
```

## Combining arguments

The wizard still prompts for what the flags do not give: the website title, the Supabase
credentials and the package manager. Without a terminal, the title and the package manager use
their defaults, so `create-pluto my-blog -t blog --backend git --pm bun` runs with no
question.

## Validation

`parseCliArgs()` in `src/index.ts` parses the arguments. `resolveChoice(template, backend)` in
`src/menu.ts` validates them: it expands an alias, checks that the template and the backend
exist, and that the backend allows the template (each backend in the menu lists its templates).
`src/menu.test.ts` tests it.
