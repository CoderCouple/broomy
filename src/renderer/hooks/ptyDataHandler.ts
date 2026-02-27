/**
 * Handles incoming PTY data by writing to the xterm instance, managing auto-scroll behavior, and detecting agent activity transitions.
 */
import { Terminal as XTerm } from '@xterm/xterm'
import { evaluateActivity } from '../utils/terminalActivityDetector'

interface ViewportHelpers {
  isAtBottom: () => boolean
  forceViewportSync: () => void
  isViewportDesynced: () => boolean
  isScrollStuck: (direction: 1 | -1) => boolean
}

interface TerminalStateForPtyData {
  isFollowingRef: React.MutableRefObject<boolean>
  processPlanDetection: (data: string) => void
  lastUserInputRef: React.MutableRefObject<number>
  lastInteractionRef: React.MutableRefObject<number>
  lastStatusRef: React.MutableRefObject<'working' | 'idle'>
  idleTimeoutRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>
  scheduleUpdate: (update: { status?: 'working' | 'idle' | 'error'; lastMessage?: string }) => void
}

interface CreatePtyDataHandlerArgs {
  terminal: XTerm
  viewportEl: HTMLElement | null
  helpers: ViewportHelpers
  isAgent: boolean
  state: TerminalStateForPtyData
  effectStartTime: number
}

interface PtyDataHandlerController {
  handleData: (data: string) => void
  clearTimers: () => void
}

export function createPtyDataHandler(args: CreatePtyDataHandlerArgs): PtyDataHandlerController {
  const { terminal, viewportEl, helpers, isAgent, state, effectStartTime } = args
  let syncCheckTimeout: ReturnType<typeof setTimeout> | null = null
  // Debounce scrollToBottom across rapid write chunks using rAF.
  // PTY data arrives in fixed-size chunks (~1024 bytes), so a single
  // logical output (e.g. a screen redraw) is split across multiple
  // onData callbacks. Calling scrollToBottom() on each partial chunk
  // causes visible oscillation because xterm's cursor is at an
  // intermediate position mid-redraw. By deferring to rAF, we scroll
  // once after all pending chunks have been processed.
  let scrollToBottomRAF = 0

  const scheduleScrollToBottom = () => {
    if (scrollToBottomRAF) return // already scheduled
    scrollToBottomRAF = requestAnimationFrame(() => {
      scrollToBottomRAF = 0
      if (!state.isFollowingRef.current) return
      terminal.scrollToBottom()
      // If still not at bottom after scrollToBottom(), the DOM scroll area
      // is desynced from the buffer (cursor-movement-heavy output like
      // Claude's TUI can cause this). Force a viewport sync so that when
      // the user eventually scrolls up, scrollTop maps correctly to
      // viewportY and doesn't cause a massive jump.
      if (!helpers.isAtBottom()) {
        helpers.forceViewportSync()
        terminal.scrollToBottom()
      }
    })
  }

  const handleData = (data: string) => {
    // Detect screen clear sequences: \x1b[2J (erase display) + \x1b[3J (erase scrollback)
    const hasScreenClear = data.includes('\x1b[2J') || data.includes('\x1b[3J')

    terminal.write(data, () => {
      // After a screen/scrollback clear, the DOM scrollTop may be stale
      // (still at the old position while the buffer was wiped). Reset it.
      if (hasScreenClear && viewportEl) {
        const expectedMaxScroll = viewportEl.scrollHeight - viewportEl.clientHeight
        if (viewportEl.scrollTop > expectedMaxScroll) {
          viewportEl.scrollTop = expectedMaxScroll
        }
        helpers.forceViewportSync()
      }

      // Debounce scrollToBottom — don't scroll on every partial chunk
      if (state.isFollowingRef.current) {
        scheduleScrollToBottom()
      }
    })

    if (!syncCheckTimeout) {
      syncCheckTimeout = setTimeout(() => {
        syncCheckTimeout = null
        // Skip sync checks when the terminal is not visible (zero dimensions).
        // Running forceViewportSync on invisible terminals causes bogus resize
        // toggles that can corrupt state when the terminal becomes visible.
        if (viewportEl?.clientHeight === 0) return
        if (helpers.isViewportDesynced() || helpers.isScrollStuck(1) || helpers.isScrollStuck(-1)) {
          helpers.forceViewportSync()
        }
      }, 500)
    }

    if (!isAgent) return

    state.processPlanDetection(data)
    const now = Date.now()
    const result = evaluateActivity(data.length, now, {
      lastUserInput: state.lastUserInputRef.current,
      lastInteraction: state.lastInteractionRef.current,
      lastStatus: state.lastStatusRef.current,
      startTime: effectStartTime,
    })
    if (result.status === 'working') {
      if (state.idleTimeoutRef.current) clearTimeout(state.idleTimeoutRef.current)
      state.lastStatusRef.current = 'working'
      state.scheduleUpdate({ status: 'working' })
    }
    if (result.scheduleIdle) {
      if (result.status !== 'working' && state.idleTimeoutRef.current) clearTimeout(state.idleTimeoutRef.current)
      state.idleTimeoutRef.current = setTimeout(() => {
        state.lastStatusRef.current = 'idle'
        state.scheduleUpdate({ status: 'idle' })
      }, 1000)
    }
  }

  const clearTimers = () => {
    if (syncCheckTimeout) {
      clearTimeout(syncCheckTimeout)
      syncCheckTimeout = null
    }
    if (scrollToBottomRAF) {
      cancelAnimationFrame(scrollToBottomRAF)
      scrollToBottomRAF = 0
    }
  }

  return { handleData, clearTimers }
}
