# create-pluto

Create a new [Pluto](https://pluto.vulmix.dev) project.

```bash
npm create pluto@latest
```

The CLI asks for a folder, a template and a package manager. Then it installs the dependencies
and shows the command that starts the dev server.

## Options

```bash
npm create pluto@latest my-blog -t core-blog --pm pnpm
```

| Option                      | What it does                                     |
| --------------------------- | ------------------------------------------------ |
| `<folder>`                  | The project folder.                              |
| `-t`, `--template`          | `core-blog`, `supabase-blog` or `supabase-shop`. |
| `--pm`, `--package-manager` | `npm`, `pnpm`, `yarn`, `bun` or `deno`.          |
| `--no-install`              | Do not install the dependencies.                 |

`core-blog` needs no database: posts are Markdown files in GitHub.

**Docs:** [Create a project](https://pluto.vulmix.dev/getting-started/create-a-project)

## License

MIT
