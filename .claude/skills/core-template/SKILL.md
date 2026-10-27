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

## No GitHub App prompts

The CLI asks nothing about GitHub. The site makes the GitHub App itself:

- In development, the dev server signs in a local user and edits the files in `content/`. No App
  is needed. Settings > GitHub has the **Create the GitHub App** button, which writes `.env`.
- After a deploy, `/admin/login` shows the setup check and the **Create the GitHub App** button.

Pluto finds the repository from `PLUTO_CMS_REPO`, from Vercel, or (in development) from the
`origin` git remote, so the CLI does not ask for it either.

## Environment

`setupCoreEnvVars()` in `src/choices/core-template.ts` writes `NUXT_PLUTO_CMS_SESSION_PASSWORD`.
The value is `crypto.randomBytes(32).toString('base64url')`. It has 43 characters. The website
title goes to `NUXT_PUBLIC_WEBSITE_NAME`. The Supabase templates still use `WEBSITE_NAME`.

## Next steps

The next steps are the same for every template. See the setup-wizard skill. The docs page
"Create a project" explains the first sign-in and the GitHub App.

## Tests

Run `bun run test`. The tests use `node:test` and do not use the network.
