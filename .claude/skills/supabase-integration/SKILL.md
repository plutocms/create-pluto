# Supabase integration

When Supabase is selected as the database provider, the CLI guides the user through inputting Supabase credentials. These credentials are then written to the `.env` file.

## Setup prompts

The `setupSupabase()` function from `src/choices/supabase-template.ts` prompts for three values in sequence, with validation on each:

### Supabase URL

Prompt: `Type/Paste your Supabase URL:`

- Accepts any valid URL string (validated with `URL.canParse()`).
- Example: `https://xxxxx.supabase.co`
- On invalid input, the CLI displays an error and re-prompts.
- On cancel, the process exits.

### Supabase Key

Prompt: `Type/Paste your Supabase Key:`

- Requires a non-empty string.
- This is the anonymous API key from the Supabase project settings.
- On empty input, the CLI displays an error and re-prompts.
- On cancel, the process exits.

### Database connection string

Prompt: `Type/Paste your Supabase database connection string:`

- Requires a Postgres connection string starting with `postgres://` or `postgresql://`.
- The CLI provides instructions on where to find this in Supabase: Project Settings > Database > Connection string.
- Notes that the pooler connection string also works.
- On invalid format, the CLI displays an error and re-prompts.
- On cancel, the process exits.

## Environment variables

After collecting the three values, `setupSupabaseEnvVars()` converts them into environment variables:

- `SUPABASE_URL` ← Supabase URL
- `SUPABASE_KEY` ← Supabase Key
- `DATABASE_URL` ← Connection string

These are merged into the `.env` file by the environment file generation feature.

## Initial notification

Before prompting for credentials, the CLI warns the user that they must have a Supabase project set up. If they do not, it directs them to create one at `https://database.new/`.

## Error handling

If any credential is missing or invalid, the prompt loop continues until a valid value is entered. If setup fails (all three values are not collected), the main process exits with status 1.
