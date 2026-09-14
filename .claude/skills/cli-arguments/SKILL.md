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

If an invalid shortcut is passed, the CLI reports the available options and exits with status 1.

## Combining arguments

You can use both together:

```bash
create-pluto my-project -t supabase-shop
```

This sets the directory to `my-project` and selects the `supabase-shop` template. The wizard still prompts for website title and Supabase credentials.

## Validation

The `parseCliArgs()` function parses all arguments. The `resolveTemplateShortcut()` function validates the template shortcut against available options in the menu definition.
