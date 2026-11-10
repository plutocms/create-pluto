# Features

This file lists every implemented feature of this project. Each entry links to a skill file
with full detail, so this file stays short.

See the workspace-level `CLAUDE.md` (one directory up) for the delegation, writing, and git
policies shared by every project here.

- Interactive setup wizard: prompts for project directory, website title, backend,
  template choice (the starters of the registry, then "Start from scratch") and package manager, installs the dependencies with nypm, and prints short
  next steps. @.claude/skills/setup-wizard/SKILL.md
- CLI argument support: accepts project directory, `-t <id>` (any free template of the registry, `none` from scratch), `--layers`, `--seo`/`--no-seo` (the blog asks "Add SEO?"), `--backend git|supabase`, `--pm` and `--no-install`
  to skip interactive prompts. @.claude/skills/cli-arguments/SKILL.md
- Template downloading: reads the registry of `plutocms/templates` (`templates.json`), downloads the
  folder of a template with giget, names the project after its folder, and applies the backend
  changes of the registry and the layers (`applyTemplate`). `-t none` writes a bare project
  (`writeScratchProject`).
  @.claude/skills/template-downloading/SKILL.md
- Environment file generation: creates or updates `.env` with configuration variables.
  @.claude/skills/env-generation/SKILL.md
- Git CMS backend (no database): the `git` backend scaffolds the Markdown-in-Git blog, makes it a Git repo (local Git publishing in dev), and writes
  the site name and a session password. The GitHub App is made from the admin.
  @.claude/skills/core-template/SKILL.md
- Supabase integration: prompts for Supabase credentials and generates corresponding
  environment variables. @.claude/skills/supabase-integration/SKILL.md
