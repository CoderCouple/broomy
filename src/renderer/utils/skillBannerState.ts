/**
 * Persistent dismiss state for the skill banner, keyed by repo directory.
 */

const STORAGE_KEY = 'broomy:skill-banner-dismissed'

function getDismissedSet(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    return new Set(JSON.parse(raw) as string[])
  } catch {
    return new Set()
  }
}

export function isSkillBannerDismissed(directory: string): boolean {
  return getDismissedSet().has(directory)
}

export function dismissSkillBanner(directory: string): void {
  const set = getDismissedSet()
  set.add(directory)
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]))
}
