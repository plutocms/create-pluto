# Core template (no database)

The `core` database choice scaffolds `plutocms/pluto-core-blog-template`. This template has no
database. Posts are Markdown files in a GitHub repository. Editors sign in with a GitHub App.

## Choice

The choice is `core` with the label `None (Markdown files in GitHub)`. It allows only the
`blog` template. The shortcut is `core-blog`:

```bash
create-pluto my-blog -t core-blog
```

The CLI downloads `gh:plutocms/pluto-core-blog-template`.

## Prompts

`setupCore()` in `src/choices/core-template.ts` runs after the download. Every prompt is
optional. The user can press Enter to skip it and fill the `.env` file later.

1. GitHub repository, as `owner/name`. The CLI validates the format. Writes `PLUTO_CMS_REPO`.
2. GitHub App slug. Writes `PLUTO_CMS_APP_SLUG`.
3. App ID. Writes `NUXT_PLUTO_CMS_GITHUB_APP_ID`.
4. Client ID. Writes `NUXT_PLUTO_CMS_GITHUB_CLIENT_ID`.
5. Client secret. The prompt hides the input. Writes `NUXT_PLUTO_CMS_GITHUB_CLIENT_SECRET`.
6. Path to the private key `.pem` file. Writes `NUXT_PLUTO_CMS_GITHUB_PRIVATE_KEY`.

If stdin is not a terminal, the CLI asks nothing and uses empty values.

## Private key

`readPrivateKey()` reads the file. It writes the contents on one line. Each line break
becomes a literal `\n`. If the file is missing or is not a PEM file, the CLI warns and skips
the key. The CLI never prints the key or the client secret.

## Session password

`setupCoreEnvVars()` always writes `NUXT_PLUTO_CMS_SESSION_PASSWORD`. The value is
`crypto.randomBytes(32).toString('base64url')`. It has 43 characters.

## Website title

For `core`, the title goes to `NUXT_PUBLIC_WEBSITE_NAME`. The Supabase templates still use
`WEBSITE_NAME`.

## Next steps

At the end, the CLI prints the next steps:

1. Run `bun run dev` and open `/admin`: a local user, files in `content/`, no GitHub App needed.
2. Deploy, open `/admin/login` on the deployed site and select "Create the GitHub App". The
   page gives the values for the host, and the install link of the App.
3. A link to the docs quickstart (`https://pluto.vulmix.dev/github-cms/quickstart`) and to the
   manual steps in the README of the template.

The CLI adds "Set PLUTO_CMS_REPO in .env, or deploy from a GitHub repository" when the
repository is empty.

## Tests

Run `bun run test`. The tests use `node:test` and do not use the network.
