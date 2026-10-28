# CLI argument support

The CLI accepts arguments to skip interactive prompts. This is useful for scripting and quick setups.

## Positional argument

Pass a directory name as the first positional argument:

```bash
create-pluto my-project
```

This sets the project directory without prompting.

## Template shortcut

Use the `-t`, `--template`, or `--template=` flag to select a template:

```bash
create-pluto -t supabase-shop
create-pluto --template supabase-shop
create-pluto --template=supabase-shop
```

## Template shortcut format

A shortcut combines a database provider and a template choice with a hyphen:

```
<database-provider>-<template-choice>
```

Currently available combinations:

- `supabase-shop` — Supabase + Shop template
- `supabase-blog` — Supabase + Blog template
- `core-blog` — No database (Markdown files in GitHub) + Blog template

Not every database works with every template. The `core` option has only the `blog` template, so `core-shop` is not valid.

If an invalid shortcut is passed, the CLI reports the available options and exits with status 1. The shortcut must have exactly two parts. A message like `The "core" option has no "shop" template` tells the user which pair is not valid.

## Package manager and install

- `--pm <name>`, `--pm=<name>`, `--package-manager <name>`: use this package manager and do not
  ask. The name is one of `npm`, `pnpm`, `yarn`, `bun`, `deno`. Another name stops the CLI with
  status 1 and the list of names.
- `--no-install`: do not install the dependencies. The next steps show the install command.

```bash
create-pluto my-blog -t core-blog --pm bun
create-pluto my-blog -t core-blog --pm pnpm --no-install
```

## Combining arguments

You can use both together:

```bash
create-pluto my-project -t supabase-shop
```

This sets the directory to `my-project` and selects the `supabase-shop` template. The wizard still prompts for website title, the Supabase credentials and the package manager. Without a terminal, the title and the package manager use their defaults, so `create-pluto my-blog -t core-blog --pm bun` runs with no question.

## Validation

The `parseCliArgs()` function parses all arguments. The `resolveTemplateShortcut()` function in `src/menu.ts` validates the template shortcut. It checks that the database exists, that the template exists, and that the database allows the template. Each database in the menu lists its allowed templates.
