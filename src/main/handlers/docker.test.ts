import { describe, it, expect, vi, beforeEach } from 'vitest'
import { E2EScenario, type HandlerContext } from './types'

// Mock the docker module
const mockIsDockerAvailable = vi.fn()
const mockGetContainerInfo = vi.fn()
const mockStopContainer = vi.fn()
const mockResetContainer = vi.fn()

vi.mock('../docker', () => ({
  isDockerAvailable: (...args: unknown[]) => mockIsDockerAvailable(...args),
  getContainerInfo: (...args: unknown[]) => mockGetContainerInfo(...args),
  stopContainer: (...args: unknown[]) => mockStopContainer(...args),
  resetContainer: (...args: unknown[]) => mockResetContainer(...args),
}))

// Mock electron
vi.mock('electron', () => ({
  app: { isPackaged: false },
}))

function createCtx(overrides: Partial<HandlerContext> = {}): HandlerContext {
  return {
    isE2ETest: false,
    e2eScenario: E2EScenario.Default,
    isDev: false,
    isWindows: false,
    ptyProcesses: new Map(),
    ptyOwnerWindows: new Map(),
    fileWatchers: new Map(),
    watcherOwnerWindows: new Map(),
    profileWindows: new Map(),
    mainWindow: null,
    E2E_MOCK_SHELL: undefined,
    FAKE_CLAUDE_SCRIPT: undefined,
    dockerContainers: new Map(),
    ...overrides,
  } as HandlerContext
}

describe('docker handlers', () => {
  let handlers: Record<string, Function>
  const mockIpcMain = {
    handle: vi.fn((channel: string, handler: Function) => {
      handlers[channel] = handler
    }),
  }
  const mockEvent = { sender: { id: 1 } }

  beforeEach(() => {
    vi.clearAllMocks()
    handlers = {}
  })

  describe('docker:status', () => {
    it('returns mock data in E2E mode', async () => {
      const { register } = await import('./docker')
      const ctx = createCtx({ isE2ETest: true })
      register(mockIpcMain as never, ctx)

      const result = await handlers['docker:status'](mockEvent)
      expect(result).toEqual({ available: true })
      expect(mockIsDockerAvailable).not.toHaveBeenCalled()
    })

    it('calls isDockerAvailable in normal mode', async () => {
      const { register } = await import('./docker')
      const ctx = createCtx()
      register(mockIpcMain as never, ctx)

      mockIsDockerAvailable.mockResolvedValue({ available: true })
      const result = await handlers['docker:status'](mockEvent)
      expect(result).toEqual({ available: true })
      expect(mockIsDockerAvailable).toHaveBeenCalled()
    })

    it('returns unavailable status from docker check', async () => {
      const { register } = await import('./docker')
      const ctx = createCtx()
      register(mockIpcMain as never, ctx)

      mockIsDockerAvailable.mockResolvedValue({ available: false, error: 'Docker daemon is not running' })
      const result = await handlers['docker:status'](mockEvent)
      expect(result.available).toBe(false)
      expect(result.error).toBe('Docker daemon is not running')
    })
  })

  describe('docker:containerInfo', () => {
    it('returns null in E2E mode', async () => {
      const { register } = await import('./docker')
      const ctx = createCtx({ isE2ETest: true })
      register(mockIpcMain as never, ctx)

      const result = await handlers['docker:containerInfo'](mockEvent, '/my/repo')
      expect(result).toBeNull()
      expect(mockGetContainerInfo).not.toHaveBeenCalled()
    })

    it('calls getContainerInfo in normal mode', async () => {
      const { register } = await import('./docker')
      const ctx = createCtx()
      register(mockIpcMain as never, ctx)

      const mockInfo = { containerId: 'abc123', status: 'running', image: 'node:22', repoDir: '/my/repo' }
      mockGetContainerInfo.mockResolvedValue(mockInfo)

      const result = await handlers['docker:containerInfo'](mockEvent, '/my/repo')
      expect(result).toEqual(mockInfo)
      expect(mockGetContainerInfo).toHaveBeenCalledWith(ctx, '/my/repo')
    })
  })

  describe('docker:stopContainer', () => {
    it('does nothing in E2E mode', async () => {
      const { register } = await import('./docker')
      const ctx = createCtx({ isE2ETest: true })
      register(mockIpcMain as never, ctx)

      await handlers['docker:stopContainer'](mockEvent, '/my/repo')
      expect(mockStopContainer).not.toHaveBeenCalled()
    })

    it('calls stopContainer in normal mode', async () => {
      const { register } = await import('./docker')
      const ctx = createCtx()
      register(mockIpcMain as never, ctx)

      mockStopContainer.mockResolvedValue(undefined)
      await handlers['docker:stopContainer'](mockEvent, '/my/repo')
      expect(mockStopContainer).toHaveBeenCalledWith(ctx, '/my/repo')
    })
  })

  describe('docker:restartContainer', () => {
    it('does nothing in E2E mode', async () => {
      const { register } = await import('./docker')
      const ctx = createCtx({ isE2ETest: true })
      register(mockIpcMain as never, ctx)

      await handlers['docker:restartContainer'](mockEvent, '/my/repo')
      expect(mockStopContainer).not.toHaveBeenCalled()
    })

    it('calls stopContainer in normal mode (restart = stop + next PTY create)', async () => {
      const { register } = await import('./docker')
      const ctx = createCtx()
      register(mockIpcMain as never, ctx)

      mockStopContainer.mockResolvedValue(undefined)
      await handlers['docker:restartContainer'](mockEvent, '/my/repo')
      expect(mockStopContainer).toHaveBeenCalledWith(ctx, '/my/repo')
    })
  })

  describe('docker:resetContainer', () => {
    it('does nothing in E2E mode', async () => {
      const { register } = await import('./docker')
      const ctx = createCtx({ isE2ETest: true })
      register(mockIpcMain as never, ctx)

      await handlers['docker:resetContainer'](mockEvent, '/my/repo')
      expect(mockResetContainer).not.toHaveBeenCalled()
    })

    it('calls resetContainer in normal mode', async () => {
      const { register } = await import('./docker')
      const ctx = createCtx()
      register(mockIpcMain as never, ctx)

      mockResetContainer.mockResolvedValue(undefined)
      await handlers['docker:resetContainer'](mockEvent, '/my/repo')
      expect(mockResetContainer).toHaveBeenCalledWith(ctx, '/my/repo')
    })
  })

  it('registers all five docker handlers', async () => {
    const { register } = await import('./docker')
    const ctx = createCtx()
    register(mockIpcMain as never, ctx)

    expect(handlers['docker:status']).toBeDefined()
    expect(handlers['docker:containerInfo']).toBeDefined()
    expect(handlers['docker:stopContainer']).toBeDefined()
    expect(handlers['docker:restartContainer']).toBeDefined()
    expect(handlers['docker:resetContainer']).toBeDefined()
  })
})
