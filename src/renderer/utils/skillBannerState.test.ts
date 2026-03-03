// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { isSkillBannerDismissed, dismissSkillBanner } from './skillBannerState'

beforeEach(() => {
  localStorage.clear()
})

describe('skillBannerState', () => {
  it('returns false when not dismissed', () => {
    expect(isSkillBannerDismissed('/repo')).toBe(false)
  })

  it('returns true after dismissing', () => {
    dismissSkillBanner('/repo')
    expect(isSkillBannerDismissed('/repo')).toBe(true)
  })

  it('tracks dismissals independently per directory', () => {
    dismissSkillBanner('/repo-a')
    expect(isSkillBannerDismissed('/repo-a')).toBe(true)
    expect(isSkillBannerDismissed('/repo-b')).toBe(false)
  })

  it('persists across calls', () => {
    dismissSkillBanner('/repo-a')
    dismissSkillBanner('/repo-b')
    expect(isSkillBannerDismissed('/repo-a')).toBe(true)
    expect(isSkillBannerDismissed('/repo-b')).toBe(true)
  })

  it('handles corrupted localStorage gracefully', () => {
    localStorage.setItem('broomy:skill-banner-dismissed', 'not-json')
    expect(isSkillBannerDismissed('/repo')).toBe(false)
  })
})
