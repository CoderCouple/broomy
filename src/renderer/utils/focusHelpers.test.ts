// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '../../test/react-setup'
import { sendAgentPrompt } from './focusHelpers'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('sendAgentPrompt', () => {
  it('writes prompt text and \\r as separate calls so agent treats Enter as a keypress', async () => {
    await sendAgentPrompt('pty-1', 'do something')

    expect(window.pty.write).toHaveBeenCalledTimes(2)
    expect(window.pty.write).toHaveBeenNthCalledWith(1, 'pty-1', 'do something')
    expect(window.pty.write).toHaveBeenNthCalledWith(2, 'pty-1', '\r')
  })
})
