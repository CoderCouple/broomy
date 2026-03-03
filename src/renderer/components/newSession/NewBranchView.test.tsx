// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import '../../../test/react-setup'
import { useAgentStore } from '../../store/agents'
import { useRepoStore } from '../../store/repos'
import { NewBranchView } from './NewBranchView'
import type { ManagedRepo } from '../../../preload/index'

// Mock AuthTerminal to avoid xterm.js in jsdom
vi.mock('../AuthTerminal', () => ({
  AuthTerminal: ({ ptyId, onDone }: { ptyId: string; onDone: () => void }) => (
    <div data-testid="auth-terminal" data-pty-id={ptyId}>
      <button onClick={onDone}>Done</button>
    </div>
  ),
}))

const mockRepo: ManagedRepo = {
  id: 'repo-1',
  name: 'my-project',
  remoteUrl: 'https://github.com/user/my-project.git',
  rootDir: '/repos/my-project',
  defaultBranch: 'main',
}

afterEach(() => {
  cleanup()
})

beforeEach(() => {
  vi.clearAllMocks()
  useAgentStore.setState({
    agents: [
      { id: 'agent-1', name: 'Claude', command: 'claude', color: '#4a9eff' },
    ],
  })
})

describe('NewBranchView', () => {
  it('renders header with repo name', () => {
    render(
      <NewBranchView repo={mockRepo} onBack={vi.fn()} onComplete={vi.fn()} />
    )
    expect(screen.getByText('New Branch')).toBeTruthy()
    expect(screen.getByText('my-project')).toBeTruthy()
  })

  it('renders branch name input', () => {
    render(
      <NewBranchView repo={mockRepo} onBack={vi.fn()} onComplete={vi.fn()} />
    )
    expect(screen.getByPlaceholderText('feature/my-feature')).toBeTruthy()
  })

  it('Create Branch button is disabled when branch name is empty', () => {
    render(
      <NewBranchView repo={mockRepo} onBack={vi.fn()} onComplete={vi.fn()} />
    )
    const createBtn = screen.getByText('Create Branch')
    expect(createBtn.hasAttribute('disabled')).toBe(true)
  })

  it('Create Branch button is enabled when branch name is provided', () => {
    render(
      <NewBranchView repo={mockRepo} onBack={vi.fn()} onComplete={vi.fn()} />
    )
    const input = screen.getByPlaceholderText('feature/my-feature')
    fireEvent.change(input, { target: { value: 'feature/auth' } })
    const createBtn = screen.getByText('Create Branch')
    expect(createBtn.hasAttribute('disabled')).toBe(false)
  })

  it('shows worktree path preview', () => {
    render(
      <NewBranchView repo={mockRepo} onBack={vi.fn()} onComplete={vi.fn()} />
    )
    const input = screen.getByPlaceholderText('feature/my-feature')
    fireEvent.change(input, { target: { value: 'feature/auth' } })
    expect(screen.getByText('/repos/my-project/feature/auth/')).toBeTruthy()
  })

  it('calls onBack when Cancel is clicked', () => {
    const onBack = vi.fn()
    render(
      <NewBranchView repo={mockRepo} onBack={onBack} onComplete={vi.fn()} />
    )
    fireEvent.click(screen.getByText('Cancel'))
    expect(onBack).toHaveBeenCalled()
  })

  it('shows issue info when issue is provided', () => {
    const issue = { number: 42, title: 'Fix login bug', labels: ['bug'], url: 'https://github.com/user/my-project/issues/42' }
    render(
      <NewBranchView repo={mockRepo} issue={issue} onBack={vi.fn()} onComplete={vi.fn()} />
    )
    expect(screen.getByText('Issue #42')).toBeTruthy()
    expect(screen.getByText('Fix login bug')).toBeTruthy()
    expect(screen.getByText('bug')).toBeTruthy()
  })

  it('pre-fills branch name from issue', () => {
    const issue = { number: 42, title: 'Fix login bug', labels: [], url: 'https://github.com/user/my-project/issues/42' }
    render(
      <NewBranchView repo={mockRepo} issue={issue} onBack={vi.fn()} onComplete={vi.fn()} />
    )
    const input = screen.getByPlaceholderText('feature/my-feature')
    expect((input as HTMLInputElement).value).toContain('login-bug')
  })

  it('creates branch and calls onComplete on success', async () => {
    vi.mocked(window.git.pull).mockResolvedValue({ success: true })
    vi.mocked(window.git.worktreeAdd).mockResolvedValue({ success: true })
    vi.mocked(window.git.pushNewBranch).mockResolvedValue({ success: true })
    vi.mocked(window.repos.getInitScript).mockResolvedValue('')

    const onComplete = vi.fn()
    render(
      <NewBranchView repo={mockRepo} onBack={vi.fn()} onComplete={onComplete} />
    )

    const input = screen.getByPlaceholderText('feature/my-feature')
    fireEvent.change(input, { target: { value: 'feature/auth' } })
    fireEvent.click(screen.getByText('Create Branch'))

    await waitFor(() => {
      expect(window.git.worktreeAdd).toHaveBeenCalledWith(
        '/repos/my-project/main',
        '/repos/my-project/feature/auth',
        'feature/auth',
        'main'
      )
      expect(onComplete).toHaveBeenCalledWith(
        '/repos/my-project/feature/auth',
        'agent-1',
        expect.objectContaining({ repoId: 'repo-1' })
      )
    })
  })

  it('shows error when worktree creation fails', async () => {
    vi.mocked(window.git.pull).mockResolvedValue({ success: true })
    vi.mocked(window.git.worktreeAdd).mockResolvedValue({ success: false, error: 'fatal: invalid reference: main' })

    render(
      <NewBranchView repo={mockRepo} onBack={vi.fn()} onComplete={vi.fn()} />
    )

    const input = screen.getByPlaceholderText('feature/my-feature')
    fireEvent.change(input, { target: { value: 'feature/auth' } })
    fireEvent.click(screen.getByText('Create Branch'))

    await waitFor(() => {
      expect(screen.getByText(/invalid reference/)).toBeTruthy()
    })
  })

  it('shows error when pushNewBranch fails', async () => {
    vi.mocked(window.git.pull).mockResolvedValue({ success: true })
    vi.mocked(window.git.worktreeAdd).mockResolvedValue({ success: true })
    vi.mocked(window.git.pushNewBranch).mockResolvedValue({ success: false, error: 'Permission denied' })

    render(
      <NewBranchView repo={mockRepo} onBack={vi.fn()} onComplete={vi.fn()} />
    )

    const input = screen.getByPlaceholderText('feature/my-feature')
    fireEvent.change(input, { target: { value: 'feature/auth' } })
    fireEvent.click(screen.getByText('Create Branch'))

    await waitFor(() => {
      expect(screen.getByText(/Permission denied|Failed to push/)).toBeTruthy()
    })
  })

  it('executes init script when non-empty', async () => {
    vi.mocked(window.git.pull).mockResolvedValue({ success: true })
    vi.mocked(window.git.worktreeAdd).mockResolvedValue({ success: true })
    vi.mocked(window.git.pushNewBranch).mockResolvedValue({ success: true })
    vi.mocked(window.repos.getInitScript).mockResolvedValue('npm install')

    const onComplete = vi.fn()
    render(
      <NewBranchView repo={mockRepo} onBack={vi.fn()} onComplete={onComplete} />
    )

    const input = screen.getByPlaceholderText('feature/my-feature')
    fireEvent.change(input, { target: { value: 'feature/auth' } })
    fireEvent.click(screen.getByText('Create Branch'))

    await waitFor(() => {
      expect(window.shell.exec).toHaveBeenCalledWith('npm install', '/repos/my-project/feature/auth')
      expect(onComplete).toHaveBeenCalled()
    })
  })

  it('lists agents in select dropdown', () => {
    render(
      <NewBranchView repo={mockRepo} onBack={vi.fn()} onComplete={vi.fn()} />
    )
    expect(screen.getByText('Claude')).toBeTruthy()
  })

  describe('auth error flow', () => {
    it('shows "Set up Git Authentication" button on push auth error', async () => {
      vi.mocked(window.git.pull).mockResolvedValue({ success: true })
      vi.mocked(window.git.worktreeAdd).mockResolvedValue({ success: true })
      vi.mocked(window.git.pushNewBranch).mockResolvedValue({
        success: false,
        error: 'fatal: could not read Username for \'https://github.com\': terminal prompts disabled',
      })
      useRepoStore.setState({ ghAvailable: true })

      render(
        <NewBranchView repo={mockRepo} onBack={vi.fn()} onComplete={vi.fn()} />
      )

      const input = screen.getByPlaceholderText('feature/my-feature')
      fireEvent.change(input, { target: { value: 'feature/auth' } })
      fireEvent.click(screen.getByText('Create Branch'))

      await waitFor(() => {
        expect(screen.getByText('Set up Git Authentication')).toBeTruthy()
      })
    })

    it('shows "Install GitHub CLI" button on auth error when gh not available', async () => {
      vi.mocked(window.git.pull).mockResolvedValue({ success: true })
      vi.mocked(window.git.worktreeAdd).mockResolvedValue({ success: true })
      vi.mocked(window.git.pushNewBranch).mockResolvedValue({
        success: false,
        error: 'Authentication failed for \'https://github.com/user/repo\'',
      })
      useRepoStore.setState({ ghAvailable: false })

      render(
        <NewBranchView repo={mockRepo} onBack={vi.fn()} onComplete={vi.fn()} />
      )

      const input = screen.getByPlaceholderText('feature/my-feature')
      fireEvent.change(input, { target: { value: 'feature/auth' } })
      fireEvent.click(screen.getByText('Create Branch'))

      await waitFor(() => {
        expect(screen.getByText('Install GitHub CLI')).toBeTruthy()
      })
    })

    it('tolerates "already exists" worktree error on retry', async () => {
      vi.mocked(window.git.pull).mockResolvedValue({ success: true })
      vi.mocked(window.git.worktreeAdd).mockResolvedValue({ success: false, error: "'feature/auth' already exists" })
      vi.mocked(window.git.pushNewBranch).mockResolvedValue({ success: true })
      vi.mocked(window.repos.getInitScript).mockResolvedValue('')

      const onComplete = vi.fn()
      render(
        <NewBranchView repo={mockRepo} onBack={vi.fn()} onComplete={onComplete} />
      )

      const input = screen.getByPlaceholderText('feature/my-feature')
      fireEvent.change(input, { target: { value: 'feature/auth' } })
      fireEvent.click(screen.getByText('Create Branch'))

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalled()
      })
    })
  })
})
