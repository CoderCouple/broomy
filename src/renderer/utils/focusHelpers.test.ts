// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '../../test/react-setup'
import { sendAgentPrompt, focusAgentTerminal, focusSearchInput } from './focusHelpers'

// Make requestAnimationFrame execute its callback synchronously so inner
// rAF-callback lines are reachable in tests.
vi.stubGlobal('requestAnimationFrame', (cb: () => void) => { cb(); return 1 })

beforeEach(() => {
  vi.clearAllMocks()
  document.body.innerHTML = ''
})

describe('sendAgentPrompt', () => {
  it('writes prompt text and \\r as separate calls so agent treats Enter as a keypress', async () => {
    await sendAgentPrompt('pty-1', 'do something')

    expect(window.pty.write).toHaveBeenCalledTimes(2)
    expect(window.pty.write).toHaveBeenNthCalledWith(1, 'pty-1', 'do something')
    expect(window.pty.write).toHaveBeenNthCalledWith(2, 'pty-1', '\r')
  })
})

describe('focusAgentTerminal', () => {
  it('does nothing when no terminal panel container is found in the DOM', () => {
    // No [data-panel-id="terminal"] element present — the inner rAF early-returns
    expect(() => focusAgentTerminal()).not.toThrow()
  })

  it('focuses the xterm textarea when a terminal panel container is present', () => {
    const container = document.createElement('div')
    container.setAttribute('data-panel-id', 'terminal')
    const textarea = document.createElement('textarea')
    textarea.className = 'xterm-helper-textarea'
    const focusSpy = vi.spyOn(textarea, 'focus')
    container.appendChild(textarea)
    document.body.appendChild(container)

    focusAgentTerminal()

    expect(focusSpy).toHaveBeenCalledTimes(1)
  })
})

describe('focusSearchInput', () => {
  it('focuses the explorer search input when it is present in the DOM', () => {
    const input = document.createElement('input')
    input.setAttribute('data-explorer-search', '')
    const focusSpy = vi.spyOn(input, 'focus')
    document.body.appendChild(input)

    focusSearchInput()

    expect(focusSpy).toHaveBeenCalledTimes(1)
  })
})
