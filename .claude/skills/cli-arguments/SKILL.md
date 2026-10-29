# CLI argument support

The CLI accepts arguments to skip interactive prompts. This is useful for scripting and quick setups.

## Positional argument

Pass a directory name as the first positional argument:

```bash
create-pluto my-project
```

This sets the project directory without prompting.

## Template and backend

- `-t <template>`, `--template <template>`, `--template=<template>`: `blog` or `shop`.
- `--backend <backend>`, `--backend=<backend>`: `github` (the GitHub CMS) or `supabase`.

```bash
create-pluto my-blog -t blog --backend github
create-pluto my-blog -t blog --backend supabase
create-pluto my-shop -t shop
```

Not every backend works with every template: the shop needs `supabase`, the blog works with
both. A template with one backend gets it without a flag (`-t shop` means `supabase`). Without
`--backend`, the blog asks for it. Without `-t`, the CLI asks for the backend, then for the
template of that backend.

The older names are aliases: `core-blog` (`blog` with `github`), `supabase-blog` and
`supabase-shop`. An alias with another `--backend` (`-t core-blog --backend supabase`) is an
error.

A wrong name stops the CLI with status 1 and a message that lists the right names, for example
`The "shop" template does not work with the "github" backend. Use --backend supabase.`

## Package manager and install

- `--pm <name>`, `--pm=<name>`, `--package-manager <name>`: use this package manager and do not
  ask. The name is one of `npm`, `pnpm`, `yarn`, `bun`, `deno`. Another name stops the CLI with
  status 1 and the list of names.
- `--no-install`: do not install the dependencies. The next steps show the install command.

```bash
create-pluto my-blog -t blog --backend github --pm bun
create-pluto my-blog -t blog --backend github --pm pnpm --no-install
```

## Combining arguments

The wizard still prompts for what the flags do not give: the website title, the Supabase
credentials and the package manager. Without a terminal, the title and the package manager use
their defaults, so `create-pluto my-blog -t blog --backend github --pm bun` runs with no
question.

## Validation

`parseCliArgs()` in `src/index.ts` parses the arguments. `resolveChoice(template, backend)` in
`src/menu.ts` validates them: it expands an alias, checks that the template and the backend
exist, and that the backend allows the template (each backend in the menu lists its templates).
`src/menu.test.ts` tests it.
