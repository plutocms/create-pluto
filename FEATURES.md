# Features

This file lists every implemented feature of this project. Each entry links to a skill file
with full detail, so this file stays short.

See the workspace-level `CLAUDE.md` (one directory up) for the delegation, writing, and git
policies shared by every project here.

- Interactive setup wizard: prompts for project directory, website title, database provider,
  template choice and package manager, installs the dependencies with nypm, and prints short
  next steps. @.claude/skills/setup-wizard/SKILL.md
- CLI argument support: accepts project directory, template shortcut, `--pm` and `--no-install`
  to skip interactive prompts. @.claude/skills/cli-arguments/SKILL.md
- Template downloading: downloads Pluto project templates from GitHub using giget.
  @.claude/skills/template-downloading/SKILL.md
- Environment file generation: creates or updates `.env` with configuration variables.
  @.claude/skills/env-generation/SKILL.md
- Core template (no database): the `core` choice scaffolds the Markdown-in-Git blog, makes it a Git repo (local Git publishing in dev), and writes
  the site name and a session password. The GitHub App is made from the admin.
  @.claude/skills/core-template/SKILL.md
- Supabase integration: prompts for Supabase credentials and generates corresponding
  environment variables. @.claude/skills/supabase-integration/SKILL.md
