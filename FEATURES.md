# Features

This file lists every implemented feature of this project. Each entry links to a skill file
with full detail, so this file stays short.

See the workspace-level `CLAUDE.md` (one directory up) for the delegation, writing, and git
policies shared by every project here.

- Interactive setup wizard: prompts for project directory, website title, database provider, and
  template choice. @.claude/skills/setup-wizard/SKILL.md
- CLI argument support: accepts project directory and template shortcut arguments to skip
  interactive prompts. @.claude/skills/cli-arguments/SKILL.md
- Template downloading: downloads Pluto project templates from GitHub using giget.
  @.claude/skills/template-downloading/SKILL.md
- Environment file generation: creates or updates `.env` with configuration variables.
  @.claude/skills/env-generation/SKILL.md
- Supabase integration: prompts for Supabase credentials and generates corresponding
  environment variables. @.claude/skills/supabase-integration/SKILL.md
