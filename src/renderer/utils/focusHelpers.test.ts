// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '../../test/react-setup'
import { sendAgentPrompt } from './focusHelpers'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('sendAgentPrompt', () => {
  it('writes prompt to pty and focuses agent terminal', async () => {
    await sendAgentPrompt('pty-1', 'do something')

    expect(window.pty.write).toHaveBeenCalledWith('pty-1', 'do something')
  })
})
