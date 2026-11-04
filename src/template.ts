import type { TemplateEntry } from './registry.ts'
import fs from 'node:fs'
import path from 'node:path'
import { switchToSupabase } from './backend.ts'
import { addLayers } from './layers.ts'

/**
 * Sets the backend and the layers of a project, from the changes of the
 * registry: as downloaded (or written from scratch), a template uses the Git
 * CMS. `rangeOf` gives the version range of a package (the latest on npm).
 */
export async function applyTemplate(
  dir: string,
  template: TemplateEntry,
  backend: string,
  layers: string[],
  rangeOf: (name: string) => Promise<string>
): Promise<void> {
  const changes = template.backends[backend] ?? {}

  if (changes.layer) {
    switchToSupabase(dir, changes.layer, await rangeOf(changes.layer))
  }

  for (const item of changes.remove ?? []) {
    fs.rmSync(path.join(dir, item), { recursive: true, force: true })
  }

  await addLayers(dir, layers, rangeOf)
}

const NOT_NAME_CHARS = /[^a-z0-9._~-]+/g
const NAME_EDGES = /^[-._]+|-+$/g

/** A package name from a folder name: `My Blog` gives `my-blog`. */
export function packageNameOf(dir: string): string {
  const name = path
    .basename(path.resolve(dir))
    .toLowerCase()
    .replace(NOT_NAME_CHARS, '-')
    .replace(NAME_EDGES, '')
  return name || 'pluto-app'
}

/** Names the project after its folder. A template keeps the name of its repo otherwise. */
export function setPackageName(dir: string): void {
  const packagePath = path.join(dir, 'package.json')
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
  fs.writeFileSync(
    packagePath,
    `${JSON.stringify({ ...pkg, name: packageNameOf(dir) }, null, 2)}\n`
  )
}

const SCRATCH_PACKAGES = [
  '@plutocms/core',
  'nuxt',
  'vue',
  'vue-router',
] as const

// The range of the templates. The latest TypeScript can be a major that the Vue
// tools do not support yet, so it is not read from npm.
const TYPESCRIPT_RANGE = '^5.9.3'

const GITIGNORE = `# Nuxt dev/build outputs
.output
.data
.nuxt
.nitro
.cache
dist

# Node dependencies
node_modules

# Logs
logs
*.log

# Misc
.DS_Store
.fleet
.idea

# Local env files
.env
.env.*
*.pem
`

const TSCONFIG = `{
  // https://nuxt.com/docs/guide/concepts/typescript
  "files": [],
  "references": [
    { "path": "./.nuxt/tsconfig.app.json" },
    { "path": "./.nuxt/tsconfig.server.json" },
    { "path": "./.nuxt/tsconfig.shared.json" },
    { "path": "./.nuxt/tsconfig.node.json" }
  ]
}
`

const APP_VUE = `<template>
  <PlutoRoot>
    <NuxtPage />
  </PlutoRoot>
</template>
`

/**
 * `-t none`: a bare project that extends `@plutocms/core`, with no pages of
 * its own. `applyTemplate` then sets the backend and the layers, as for a
 * downloaded template.
 */
export async function writeScratchProject(
  dir: string,
  rangeOf: (name: string) => Promise<string>,
  today = new Date()
): Promise<void> {
  const dependencies = Object.fromEntries(
    await Promise.all(
      SCRATCH_PACKAGES.map(async (name) => [name, await rangeOf(name)] as const)
    )
  )

  const pkg = {
    name: packageNameOf(dir),
    type: 'module',
    private: true,
    scripts: {
      build: 'nuxt build',
      dev: 'nuxt dev',
      preview: 'nuxt preview',
      postinstall: 'nuxt prepare',
    },
    dependencies,
    devDependencies: { typescript: TYPESCRIPT_RANGE },
  }

  const config = `export default defineNuxtConfig({
  extends: ["@plutocms/core"],

  compatibilityDate: "${today.toISOString().slice(0, 10)}",

  devtools: { enabled: true },
});
`

  fs.mkdirSync(path.join(dir, 'app'), { recursive: true })
  fs.writeFileSync(
    path.join(dir, 'package.json'),
    `${JSON.stringify(pkg, null, 2)}\n`
  )
  fs.writeFileSync(path.join(dir, 'nuxt.config.ts'), config)
  fs.writeFileSync(path.join(dir, 'app', 'app.vue'), APP_VUE)
  fs.writeFileSync(path.join(dir, 'tsconfig.json'), TSCONFIG)
  fs.writeFileSync(path.join(dir, '.gitignore'), GITIGNORE)
}
