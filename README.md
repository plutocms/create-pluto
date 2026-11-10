# create-pluto

Create a new [Pluto](https://pluto.vulmix.dev) project.

```bash
npm create pluto@latest
```

The CLI asks for a folder, a backend, a template and a package manager. Then it installs the
dependencies and shows the command that starts the dev server.

## Options

```bash
npm create pluto@latest my-blog -t blog --backend git --pm pnpm
```

| Option                      | What it does                                                          |
| --------------------------- | --------------------------------------------------------------------- |
| `<folder>`                  | The project folder. It also names the project in `package.json`.      |
| `-t`, `--template`          | The id of a template, for example `blog`. `none` starts from scratch. |
| `--backend`                 | `git` (the Git CMS) or `supabase`.                                    |
| `--layers`                  | Layers to add to `dashboard` or `none`, for example `shop,3d`.        |
| `--pm`, `--package-manager` | `npm`, `pnpm`, `yarn`, `bun` or `deno`.                               |
| `--seo`, `--no-seo`         | Add the SEO layer, or not. Skips the question of the blog template.   |
| `--no-install`              | Do not install the dependencies.                                      |

## Templates

The templates are in [plutocms/templates](https://github.com/plutocms/templates). The CLI reads
its list, `templates.json`, so a new template needs no new version of the CLI. The menu offers
the starter templates of the backend you pick:

| Template           | `-t`            | Backends          |
| ------------------ | --------------- | ----------------- |
| Blog (minimalist)  | `blog`          | Git CMS, Supabase |
| Shop (Supabase)    | `supabase-shop` | Supabase          |
| Dashboard only     | `dashboard`     | Git CMS, Supabase |
| Start from scratch | `none`          | Git CMS, Supabase |

`-t` also takes any other free template of the list. A new project gets the folder of the
template only, and the CLI sets the backend in it: the layer in `nuxt.config.ts`, the packages,
the files that only one backend uses (the sample posts of the Git CMS) and the `.env`.

- **Git CMS:** no database. Content is Markdown files in Git. It works out of the box with local
  Git in development (the CLI creates the repository, and each save is a commit). Connect GitHub
  to publish from a deployed site.
- **Supabase:** the CLI asks for the URL, the key and the connection string of your Supabase
  project. The first visit to `/admin` opens the setup.

**Start from scratch** (`-t none`) downloads nothing. The CLI writes a Nuxt app that extends
Pluto, with no pages of its own: `package.json`, `nuxt.config.ts`, `app/app.vue`,
`tsconfig.json` and `.gitignore`. It is a good start for an agent.

The **Blog** template asks "Add SEO?" (yes by default): the SEO layer gives the posts their SEO
fields, and the site its head tags, `sitemap.xml`, `robots.txt` and an RSS feed. `--seo` and
`--no-seo` skip the question. Without a terminal, the CLI adds it.

**Dashboard only** and **Start from scratch** can add layers. The CLI asks which (Supabase: Shop,
Blog, 3D, SEO; Git CMS: 3D, SEO). Pass `--layers shop,3d` to skip the question (`--layers none` for no
layers). Without a terminal, the CLI adds no layers.

```bash
npm create pluto@latest my-cms -t dashboard --backend supabase --layers shop,3d
npm create pluto@latest my-app -t none --backend git
```

**Docs:** [Quickstart](https://pluto.vulmix.dev/docs/start-here/quickstart)

## License

MIT
