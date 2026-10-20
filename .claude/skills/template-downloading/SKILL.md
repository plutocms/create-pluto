# Template downloading

After gathering all user inputs, the CLI downloads a complete Pluto project template from GitHub.

## Mechanism

The CLI uses the `giget` library to download templates. This library pulls from GitHub repositories with the `gh:` prefix.

## Template URL construction

The template URL is built from the selected database provider and template choice:

```
gh:plutocms/pluto-<database-provider>-<template-choice>-template
```

Examples:
- `gh:plutocms/pluto-supabase-shop-template`
- `gh:plutocms/pluto-supabase-blog-template`
- `gh:plutocms/pluto-core-blog-template`

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
