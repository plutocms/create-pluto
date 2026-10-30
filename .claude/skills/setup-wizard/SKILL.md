# Interactive setup wizard

This is the core user-facing feature. The CLI prompts for all required configuration in sequence.

## Prompts

The wizard asks for four pieces of information in this order:

1. **Project directory** — Where to create the project. Defaults to `my-pluto-project`. The user can also pass this as a command-line argument to skip this prompt.
2. **Website title** — The human-readable name of the site. Defaults to `My Awesome Website`. Without a terminal (a script), the CLI uses the default and does not ask. The blog and the admin template write it to the `.env` file as `NUXT_PUBLIC_WEBSITE_NAME` (both backends); the shop writes it as `WEBSITE_NAME`.
3. **Backend** — `Supabase` or `GitHub CMS (Markdown files in Git)` (`github`). `--backend` skips it. With `-t`, the list shows only the backends of that template, and a template with one backend (the shop) skips it.
4. **Template choice** — Which template to scaffold. The list shows only the templates that the chosen backend allows:
   - `Shop` (e-commerce). Supabase only.
   - `Blog`. Supabase and GitHub CMS: one template, and the CLI sets the backend in it (see the template-downloading skill).

   - `Dashboard only` (`admin`). Supabase and GitHub CMS. No public site: the Pluto admin and the public API.

   If the backend has one template, the wizard picks it and does not ask.

5. **Layers** (admin template only) — A multi-select of the layers to add: Shop, Blog and 3D for Supabase, 3D for the GitHub CMS. `--layers` skips it. Without a terminal, no layers.

## Conditional prompts

If Supabase is selected as the backend, the wizard branches into `setupSupabase()` from `src/choices/supabase-template.ts`. This prompts for three more values:

- Supabase URL
- Supabase API Key
- Postgres database connection string

See the Supabase integration skill for details on those prompts.

If `github` is selected, the wizard asks nothing more. The GitHub App is made later from the admin of the site. See the core template skill.

## After the download

1. The CLI writes the `.env` file (see the env-generation skill).
2. **Package manager** — The CLI asks which package manager to use: npm, pnpm, yarn, bun or deno.
   The default is the one that runs the CLI (`npm_config_user_agent`, `detectRunningPackageManager`
   in `src/package-manager.ts`). The `--pm` flag skips the question. Without a terminal, the CLI
   uses the one that runs it.
3. **Install** — The CLI installs the dependencies with `nypm` (`installDependencies`, silent,
   with a spinner). `--no-install` skips it. A failed install is not fatal: the next steps then
   show the install command.
4. **Next steps** — A short note: `cd <dir>` (when the project is not the current folder; quoted
   when the path has a space), the install command (only when the install did not run), and the
   dev command of the package manager (`runScriptCommand` of `nypm`, for example `bun run dev`
   or `deno task dev`). Then "Then open /admin on the dev server." (no fixed port: Nuxt picks it). The outro links the docs:
   `https://pluto.vulmix.dev/docs/getting-started/create-a-project`. `nextStepCommands()` builds the
   commands and has tests.

## Safety checks

Before downloading the template, the wizard checks:

- **Nuxt detection** — If `nuxt.config.ts` exists in the current directory, the wizard asks permission before proceeding. This prevents accidental overwrites in an existing project.
- **Empty directory check** — If the target directory is not empty, the wizard asks for confirmation before continuing.

## Cancellation

The user can cancel at any prompt. The process exits gracefully with a "Operation cancelled." message.
