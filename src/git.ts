import { execFileSync } from 'node:child_process'

/** What `initGitRepo` did. */
export type GitInitResult =
  'created' | 'created-without-commit' | 'inside-repo' | 'no-git'

// A `.env` file at any depth, also `.env.local` and the like.
const ENV_FILE = /(?:^|\/)\.env(?:\.|$)/

function git(cwd: string, args: string[]): string {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  }).trim()
}

/**
 * Makes `dir` a Git repo with a first commit, so the GitHub CMS can commit each save to it in
 * development (local Git publishing). It does nothing when `dir` is already inside a Git repo or
 * when Git is not installed. It never commits a `.env` file: the template ignores it, and a
 * `.env` in the first commit stops the commit (`created-without-commit`). A missing Git author
 * also gives `created-without-commit`: the repo exists, and the first save makes a commit once
 * the author is set.
 */
export function initGitRepo(dir: string): GitInitResult {
  try {
    git(dir, ['--version'])
  } catch {
    return 'no-git'
  }
  try {
    if (git(dir, ['rev-parse', '--is-inside-work-tree']) === 'true') {
      return 'inside-repo'
    }
  } catch {
    // Not a repo: go on.
  }

  git(dir, ['init', '-q'])
  try {
    git(dir, ['add', '-A'])
    const staged = git(dir, ['diff', '--cached', '--name-only']).split('\n')
    if (staged.some((file) => ENV_FILE.test(file))) {
      git(dir, ['reset', '-q'])
      return 'created-without-commit'
    }
    git(dir, ['commit', '-q', '-m', 'chore: create a Pluto site'])
    return 'created'
  } catch {
    return 'created-without-commit'
  }
}
