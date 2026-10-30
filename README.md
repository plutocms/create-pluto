# create-pluto

Create a new [Pluto](https://pluto.vulmix.dev) project.

```bash
npm create pluto@latest
```

The CLI asks for a folder, a backend, a template and a package manager. Then it installs the
dependencies and shows the command that starts the dev server.

## Options

```bash
npm create pluto@latest my-blog -t blog --backend github --pm pnpm
```

| Option                      | What it does                                        |
| --------------------------- | --------------------------------------------------- |
| `<folder>`                  | The project folder.                                 |
| `-t`, `--template`          | `blog`, `shop` or `admin`.                          |
| `--backend`                 | `github` (GitHub CMS, the blog only) or `supabase`. |
| `--layers`                  | Layers to add to `admin`, for example `shop,3d`.    |
| `--pm`, `--package-manager` | `npm`, `pnpm`, `yarn`, `bun` or `deno`.             |
| `--no-install`              | Do not install the dependencies.                    |

The blog is one template for both backends. The CLI sets the backend in it: the layer in
`nuxt.config.ts`, the packages, the sample posts (GitHub CMS only) and the `.env`.

- **GitHub CMS:** no database. Posts are Markdown files in Git. It works out of the box with local
  Git in development (the CLI creates the repository, and each save is a commit). Connect GitHub
  to publish from a deployed site.
- **Supabase:** the CLI asks for the URL, the key and the connection string of your Supabase
  project. The first visit to `/admin` opens the setup.

**Dashboard only** (`-t admin`) has no public site: the Pluto admin and the public API, for a site
in any stack. It works with both backends. The CLI asks which layers to add (Supabase: Shop, Blog,
3D; GitHub CMS: 3D). Pass `--layers shop,3d` to skip the question (`--layers none` for no layers).
Without a terminal, the CLI adds no layers.

```bash
npm create pluto@latest my-cms -t admin --backend github
npm create pluto@latest my-cms -t admin --backend supabase --layers shop,3d
```

The older names still work: `-t core-blog` (`blog` with `github`), `-t supabase-blog` and
`-t supabase-shop`.

**Docs:** [Create a project](https://pluto.vulmix.dev/docs/getting-started/create-a-project)

## License

MIT
