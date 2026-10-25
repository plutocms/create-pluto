# create-pluto

A command-line tool to quickly set up a new Pluto CMS project with your preferred configurations.

## Usage

```bash
npm create pluto@latest

# or
pnpm create pluto@latest

# or
bun create pluto@latest
```

You can also pass a target directory and preselect a template shortcut.

```bash
npm create pluto@latest my-project -t supabase-shop
```

Supported template shortcuts currently include:

```bash
supabase-shop
supabase-blog
core-blog
```

The `core-blog` template has no database. Posts are Markdown files in a GitHub repository. The
core option works only with the blog template.
