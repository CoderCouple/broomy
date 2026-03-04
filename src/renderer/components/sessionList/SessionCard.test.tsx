// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import '../../../test/react-setup'
import SessionCard from './SessionCard'
import type { Session } from '../../store/sessions'

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 'session-1',
    name: 'my-repo',
    directory: '/repos/my-repo',
    branch: 'feature/foo',
    status: 'idle',
    agentId: 'agent-1',
    panelVisibility: {},
    showExplorer: true,
    showFileViewer: false,
    showDiff: false,
    selectedFilePath: null,
    planFilePath: null,
    fileViewerPosition: 'top',
    layoutSizes: {
      explorerWidth: 256,
      fileViewerSize: 300,
      userTerminalHeight: 192,
      diffPanelWidth: 320,
      tutorialPanelWidth: 320,
    },
    explorerFilter: 'files',
    lastMessage: null,
    lastMessageTime: null,
    isUnread: false,
    workingStartTime: null,
    recentFiles: [],
    terminalTabs: { tabs: [{ id: 'tab-1', name: 'Terminal' }], activeTabId: 'tab-1' },
    branchStatus: 'in-progress',
    isArchived: false,
    isRestored: false,
    ...overrides,
  }
}

function makeProps(overrides: Partial<{
  session: Session
  isActive: boolean
  onSelect: () => void
  onDelete: (e: React.MouseEvent) => void
  onArchive?: (e: React.MouseEvent) => void
}> = {}) {
  return {
    session: makeSession(),
    isActive: false,
    onSelect: vi.fn(),
    onDelete: vi.fn(),
    ...overrides,
  }
}

afterEach(() => {
  cleanup()
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('SessionCard', () => {
  it('renders branch name', () => {
    render(<SessionCard {...makeProps({ session: makeSession({ branch: 'feature/bar' }) })} />)
    expect(screen.getByText('feature/bar')).toBeTruthy()
  })

  it('renders session name', () => {
    render(<SessionCard {...makeProps({ session: makeSession({ name: 'my-project' }) })} />)
    expect(screen.getByText('my-project')).toBeTruthy()
  })

  it('applies active styling when isActive is true', () => {
    const { container } = render(<SessionCard {...makeProps({ isActive: true })} />)
    const card = container.querySelector('[tabindex="0"]')!
    expect(card.className).toContain('bg-accent')
  })

  it('does not apply active styling when isActive is false', () => {
    const { container } = render(<SessionCard {...makeProps({ isActive: false })} />)
    const card = container.querySelector('[tabindex="0"]')!
    expect(card.className).not.toContain('bg-accent/15')
  })

  it('calls onSelect when card is clicked', () => {
    const onSelect = vi.fn()
    render(<SessionCard {...makeProps({ onSelect, session: makeSession({ branch: 'click-branch' }) })} />)
    fireEvent.click(screen.getByText('click-branch'))
    expect(onSelect).toHaveBeenCalled()
  })

  it('calls onSelect when Enter is pressed', () => {
    const onSelect = vi.fn()
    const { container } = render(<SessionCard {...makeProps({ onSelect })} />)
    const card = container.querySelector('[tabindex="0"]')!
    fireEvent.keyDown(card, { key: 'Enter' })
    expect(onSelect).toHaveBeenCalled()
  })

  it('calls onDelete when Delete key is pressed', () => {
    const onDelete = vi.fn()
    const { container } = render(<SessionCard {...makeProps({ onDelete })} />)
    const card = container.querySelector('[tabindex="0"]')!
    fireEvent.keyDown(card, { key: 'Delete' })
    expect(onDelete).toHaveBeenCalled()
  })

  it('calls onDelete when Backspace key is pressed', () => {
    const onDelete = vi.fn()
    const { container } = render(<SessionCard {...makeProps({ onDelete })} />)
    const card = container.querySelector('[tabindex="0"]')!
    fireEvent.keyDown(card, { key: 'Backspace' })
    expect(onDelete).toHaveBeenCalled()
  })

  it('focuses next sibling on ArrowDown key', () => {
    const { container } = render(
      <div>
        <SessionCard {...makeProps({ session: makeSession({ id: 's1', branch: 'branch-1' }) })} />
        <SessionCard {...makeProps({ session: makeSession({ id: 's2', branch: 'branch-2' }) })} />
      </div>
    )
    const cards = container.querySelectorAll('[tabindex="0"]')
    const firstCard = cards[0] as HTMLElement
    const secondCard = cards[1] as HTMLElement
    secondCard.focus = vi.fn()
    fireEvent.keyDown(firstCard, { key: 'ArrowDown' })
    expect(secondCard.focus).toHaveBeenCalled()
  })

  it('focuses previous sibling on ArrowUp key', () => {
    const { container } = render(
      <div>
        <SessionCard {...makeProps({ session: makeSession({ id: 's1', branch: 'branch-1' }) })} />
        <SessionCard {...makeProps({ session: makeSession({ id: 's2', branch: 'branch-2' }) })} />
      </div>
    )
    const cards = container.querySelectorAll('[tabindex="0"]')
    const firstCard = cards[0] as HTMLElement
    const secondCard = cards[1] as HTMLElement
    firstCard.focus = vi.fn()
    fireEvent.keyDown(secondCard, { key: 'ArrowUp' })
    expect(firstCard.focus).toHaveBeenCalled()
  })

  it('does not throw when ArrowDown has no next sibling', () => {
    const { container } = render(<SessionCard {...makeProps()} />)
    const card = container.querySelector('[tabindex="0"]')!
    expect(() => fireEvent.keyDown(card, { key: 'ArrowDown' })).not.toThrow()
  })

  it('does not throw when ArrowUp has no previous sibling', () => {
    const { container } = render(<SessionCard {...makeProps()} />)
    const card = container.querySelector('[tabindex="0"]')!
    expect(() => fireEvent.keyDown(card, { key: 'ArrowUp' })).not.toThrow()
  })

  describe('StatusIndicator', () => {
    it('shows spinner when status is working', () => {
      const { container } = render(
        <SessionCard {...makeProps({ session: makeSession({ status: 'working' }) })} />
      )
      expect(container.querySelector('.animate-spin')).toBeTruthy()
    })

    it('shows error dot when status is error', () => {
      const { container } = render(
        <SessionCard {...makeProps({ session: makeSession({ status: 'error' }) })} />
      )
      expect(container.querySelector('.bg-status-error')).toBeTruthy()
    })

    it('shows idle dot when status is idle and not unread', () => {
      const { container } = render(
        <SessionCard {...makeProps({ session: makeSession({ status: 'idle', isUnread: false }) })} />
      )
      expect(container.querySelector('.bg-status-idle')).toBeTruthy()
    })

    it('shows glowing green dot when idle and isUnread', () => {
      const { container } = render(
        <SessionCard {...makeProps({ session: makeSession({ status: 'idle', isUnread: true }) })} />
      )
      expect(container.querySelector('.bg-green-400')).toBeTruthy()
    })

    it('shows bold branch text when isUnread', () => {
      render(
        <SessionCard {...makeProps({ session: makeSession({ branch: 'unread-branch', isUnread: true }) })} />
      )
      const branchText = screen.getByText('unread-branch')
      expect(branchText.className).toContain('font-bold')
    })

    it('shows normal weight branch text when not unread', () => {
      render(
        <SessionCard {...makeProps({ session: makeSession({ branch: 'normal-branch', isUnread: false }) })} />
      )
      const branchText = screen.getByText('normal-branch')
      expect(branchText.className).toContain('font-medium')
    })
  })

  describe('BranchStatusChip', () => {
    it('shows PUSHED chip for pushed status', () => {
      render(<SessionCard {...makeProps({ session: makeSession({ branchStatus: 'pushed' }) })} />)
      expect(screen.getByText('PUSHED')).toBeTruthy()
    })

    it('shows EMPTY chip for empty status', () => {
      render(<SessionCard {...makeProps({ session: makeSession({ branchStatus: 'empty' }) })} />)
      expect(screen.getByText('EMPTY')).toBeTruthy()
    })

    it('shows PR OPEN chip for open status', () => {
      render(<SessionCard {...makeProps({ session: makeSession({ branchStatus: 'open' }) })} />)
      expect(screen.getByText('PR OPEN')).toBeTruthy()
    })

    it('shows MERGED chip for merged status', () => {
      render(<SessionCard {...makeProps({ session: makeSession({ branchStatus: 'merged' }) })} />)
      expect(screen.getByText('MERGED')).toBeTruthy()
    })

    it('shows CLOSED chip for closed status', () => {
      render(<SessionCard {...makeProps({ session: makeSession({ branchStatus: 'closed' }) })} />)
      expect(screen.getByText('CLOSED')).toBeTruthy()
    })

    it('shows nothing for in-progress status', () => {
      const { container } = render(
        <SessionCard {...makeProps({ session: makeSession({ branchStatus: 'in-progress' }) })} />
      )
      expect(container.querySelector('.text-blue-400')).toBeNull()
    })

    it('shows Review chip for review session type', () => {
      render(
        <SessionCard {...makeProps({ session: makeSession({ sessionType: 'review', branchStatus: 'in-progress' }) })} />
      )
      expect(screen.getByText('Review')).toBeTruthy()
    })
  })

  describe('last message / status label', () => {
    it('shows status label when no lastMessage', () => {
      render(
        <SessionCard {...makeProps({ session: makeSession({ status: 'idle', lastMessage: null }) })} />
      )
      expect(screen.getByText('Idle')).toBeTruthy()
    })

    it('shows Working label when status is working and no lastMessage', () => {
      render(
        <SessionCard {...makeProps({ session: makeSession({ status: 'working', lastMessage: null }) })} />
      )
      expect(screen.getByText('Working')).toBeTruthy()
    })

    it('shows Error label when status is error and no lastMessage', () => {
      render(
        <SessionCard {...makeProps({ session: makeSession({ status: 'error', lastMessage: null }) })} />
      )
      expect(screen.getByText('Error')).toBeTruthy()
    })

    it('shows quoted lastMessage when present', () => {
      render(
        <SessionCard {...makeProps({ session: makeSession({ lastMessage: 'Reading file.ts' }) })} />
      )
      expect(screen.getByText(/"Reading file.ts"/)).toBeTruthy()
    })
  })

  describe('PR number', () => {
    it('shows PR number when prNumber is set', () => {
      render(<SessionCard {...makeProps({ session: makeSession({ prNumber: 42 }) })} />)
      expect(screen.getByText('PR #42')).toBeTruthy()
    })

    it('does not show PR number when prNumber is not set', () => {
      render(<SessionCard {...makeProps({ session: makeSession({ prNumber: undefined }) })} />)
      expect(screen.queryByText(/PR #/)).toBeNull()
    })
  })

  describe('archive button', () => {
    it('renders archive button when onArchive is provided', () => {
      const onArchive = vi.fn()
      const { container } = render(
        <SessionCard {...makeProps({ onArchive, session: makeSession({ isArchived: false }) })} />
      )
      expect(container.querySelector('[title="Archive session"]')).toBeTruthy()
    })

    it('does not render archive button when onArchive is not provided', () => {
      const { container } = render(
        <SessionCard {...makeProps({ session: makeSession() })} />
      )
      expect(container.querySelector('[title="Archive session"]')).toBeNull()
    })

    it('shows Unarchive title when session is archived', () => {
      const onArchive = vi.fn()
      const { container } = render(
        <SessionCard {...makeProps({ onArchive, session: makeSession({ isArchived: true }) })} />
      )
      expect(container.querySelector('[title="Unarchive session"]')).toBeTruthy()
    })

    it('calls onArchive when archive button is clicked', () => {
      const onArchive = vi.fn()
      const { container } = render(
        <SessionCard {...makeProps({ onArchive, session: makeSession({ isArchived: false }) })} />
      )
      const archiveBtn = container.querySelector('[title="Archive session"]')!
      fireEvent.click(archiveBtn)
      expect(onArchive).toHaveBeenCalled()
    })
  })

  describe('delete button', () => {
    it('renders delete button', () => {
      const { container } = render(<SessionCard {...makeProps()} />)
      expect(container.querySelector('[title="Delete session"]')).toBeTruthy()
    })

    it('calls onDelete when delete button is clicked', () => {
      const onDelete = vi.fn()
      const { container } = render(<SessionCard {...makeProps({ onDelete })} />)
      const deleteBtn = container.querySelector('[title="Delete session"]')!
      fireEvent.click(deleteBtn)
      expect(onDelete).toHaveBeenCalled()
    })
  })
})
