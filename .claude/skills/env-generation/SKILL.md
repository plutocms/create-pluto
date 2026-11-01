# Environment file generation

After downloading the template, the CLI generates or updates a `.env` file in the project directory with configuration variables.

## File handling

If `.env` already exists, the CLI merges new variables into it. If a variable already has a value, that value is replaced. If a variable does not exist, it is appended to the file.

If `.env` does not exist, the CLI creates it with a header comment:

```
# Pluto Configurations
```

## Variables written

The CLI always writes:

- The website title from the user prompt: `NUXT_PUBLIC_WEBSITE_NAME` for the blog (both backends), `WEBSITE_NAME` for the shop.

If Supabase is selected as the backend, the CLI also writes:

- `SUPABASE_URL` — The Supabase project URL.
- `SUPABASE_KEY` — The Supabase anonymous API key.
- `DATABASE_URL` — The Postgres connection string.

See the Supabase integration skill for how these are obtained.

If `git` is selected, the CLI also writes `NUXT_PLUTO_GITHUB_SESSION_PASSWORD`. See the core template skill.

The `writeEnvFile()` function in `src/env.ts` writes the file.

## Format

Each variable is written as:

```
KEY="value"
```

Values are always quoted to handle special characters.

## Completion

After the `.env` file is written, the CLI displays a success message and logs the project directory. The setup process is complete.

## Error handling

If writing the `.env` file fails, the CLI logs an error message and exits with status 1.
