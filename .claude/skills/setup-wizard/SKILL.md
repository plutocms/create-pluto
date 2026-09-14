# Interactive setup wizard

This is the core user-facing feature. The CLI prompts for all required configuration in sequence.

## Prompts

The wizard asks for four pieces of information in this order:

1. **Project directory** — Where to create the project. Defaults to `my-pluto-project`. The user can also pass this as a command-line argument to skip this prompt.
2. **Website title** — The human-readable name of the site. Defaults to `My Awesome Website`. This is written to the `.env` file as `WEBSITE_NAME`.
3. **Database provider** — Which backend to use. Currently only `Supabase` is available. If the user passes a template shortcut via CLI, this step is skipped.
4. **Template choice** — Which template to scaffold. Options are:
   - `Shop` (e-commerce)
   - `Blog` (blog with rich text editor)

## Conditional prompts

If Supabase is selected as the database provider, the wizard branches into `setupSupabase()` from `src/choices/supabase-template.ts`. This prompts for three more values:
- Supabase URL
- Supabase API Key
- Postgres database connection string

See the Supabase integration skill for details on those prompts.

## Safety checks

Before downloading the template, the wizard checks:

- **Nuxt detection** — If `nuxt.config.ts` exists in the current directory, the wizard asks permission before proceeding. This prevents accidental overwrites in an existing project.
- **Empty directory check** — If the target directory is not empty, the wizard asks for confirmation before continuing.

## Cancellation

The user can cancel at any prompt. The process exits gracefully with a "Operation cancelled." message.
