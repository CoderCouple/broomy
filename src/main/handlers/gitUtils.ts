/**
 * Shared git utility functions used across handler modules.
 */
import type { SimpleGit } from 'simple-git'

/**
 * Detect the default branch for a repository by checking (in order):
 * 1. The symbolic ref `refs/remotes/origin/HEAD`
 * 2. Whether `origin/main` exists
 * 3. Whether `origin/master` exists
 * 4. Falls back to 'main'
 */
export async function getDefaultBranch(git: SimpleGit): Promise<string> {
  try {
    const ref = await git.raw(['symbolic-ref', 'refs/remotes/origin/HEAD'])
    return ref.trim().replace('refs/remotes/origin/', '')
  } catch {
    for (const candidate of ['main', 'master']) {
      try {
        await git.raw(['rev-parse', '--verify', `origin/${candidate}`])
        return candidate
      } catch { /* try next candidate */ }
    }
    return 'main'
  }
}
