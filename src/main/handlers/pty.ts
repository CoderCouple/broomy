/**
 * IPC handlers for pseudo-terminal (PTY) lifecycle management.
 *
 * Creates, resizes, writes to, and destroys PTY processes using node-pty.
 * In E2E mode, spawns a fake shell script for deterministic test output.
 */
import { BrowserWindow, IpcMain } from 'electron'
import { join } from 'path'
import { homedir } from 'os'
import * as pty from 'node-pty'
import type { IPty } from 'node-pty'
import { isWindows, getDefaultShell, resolveWindowsCommand } from '../platform'
import { HandlerContext } from './types'
import { getScenarioData } from './scenarios'
import { isDockerAvailable, ensureContainer, buildDockerExecArgs, dockerSetupMessage } from '../docker'

/**
 * On Windows, resolve the base command to its full path so agents installed
 * outside PATH (e.g. %USERPROFILE%\.local\bin) can still be launched.
 */
function resolveInitialCommand(command: string, isE2ETest: boolean): string {
  if (!isWindows || isE2ETest) return command
  const parts = command.trim().split(/\s+/)
  const baseCmd = parts[0]
  const resolved = resolveWindowsCommand(baseCmd)
  if (resolved && resolved !== baseCmd) {
    parts[0] = `"${resolved}"`
    return parts.join(' ')
  }
  return command
}

/** Wire onData/onExit events for a PTY, registering it in the context maps. */
function wirePtyEvents(ctx: HandlerContext, ptyProcess: IPty, id: string, senderWindow: BrowserWindow | null) {
  ctx.ptyProcesses.set(id, ptyProcess)
  if (senderWindow) ctx.ptyOwnerWindows.set(id, senderWindow)

  ptyProcess.onData((data) => {
    const ownerWindow = ctx.ptyOwnerWindows.get(id) || ctx.mainWindow
    if (ownerWindow && !ownerWindow.isDestroyed()) {
      ownerWindow.webContents.send(`pty:data:${id}`, data)
    }
  })

  ptyProcess.onExit(({ exitCode }) => {
    const ownerWindow = ctx.ptyOwnerWindows.get(id) || ctx.mainWindow
    if (ownerWindow && !ownerWindow.isDestroyed()) {
      ownerWindow.webContents.send(`pty:exit:${id}`, exitCode)
    }
    ctx.ptyProcesses.delete(id)
    ctx.ptyOwnerWindows.delete(id)
  })
}

/** Spawn an error-display PTY that prints a message and exits. */
function spawnErrorPty(ctx: HandlerContext, id: string, cwd: string, message: string, senderWindow: BrowserWindow | null) {
  const errorShell = isWindows ? (process.env.ComSpec || 'cmd.exe') : '/bin/bash'
  const ptyProcess = pty.spawn(errorShell, [], {
    name: 'xterm-256color',
    cols: 80,
    rows: 30,
    cwd,
    env: process.env as Record<string, string>,
  })
  wirePtyEvents(ctx, ptyProcess, id, senderWindow)
  setTimeout(() => {
    ptyProcess.write(`echo "${message.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"\r`)
  }, 100)
}

/** Handle Docker isolation PTY creation. Returns the PTY result or null to fall through. */
async function createIsolatedPty(
  ctx: HandlerContext,
  options: { id: string; cwd: string; command?: string; sessionId: string; env?: Record<string, string>; dockerImage?: string },
  senderWindow: BrowserWindow | null,
): Promise<{ id: string } | null> {
  const status = await isDockerAvailable()
  if (!status.available) {
    spawnErrorPty(ctx, options.id, options.cwd, dockerSetupMessage(status), senderWindow)
    return { id: options.id }
  }

  const result = await ensureContainer(ctx, options.sessionId, options.cwd, options.dockerImage)
  if (!result.success || !result.containerId) {
    spawnErrorPty(ctx, options.id, options.cwd,
      `Docker container failed to start: ${result.error || 'Unknown error'}`, senderWindow)
    return { id: options.id }
  }

  const dockerEnv: Record<string, string> = {}
  if (options.env) {
    for (const [key, value] of Object.entries(options.env)) {
      dockerEnv[key] = value
    }
  }
  const dockerArgs = buildDockerExecArgs(result.containerId, options.cwd, dockerEnv, options.command)

  const ptyProcess = pty.spawn('docker', dockerArgs, {
    name: 'xterm-256color',
    cols: 80,
    rows: 30,
    cwd: process.cwd(),
    env: process.env as Record<string, string>,
  })
  wirePtyEvents(ctx, ptyProcess, options.id, senderWindow)
  return { id: options.id }
}

export function register(ipcMain: IpcMain, ctx: HandlerContext): void {
  ipcMain.handle('pty:create', async (_event, options: { id: string; cwd: string; command?: string; sessionId?: string; env?: Record<string, string>; shell?: string; isolated?: boolean; dockerImage?: string }) => {
    const senderWindow = BrowserWindow.fromWebContents(_event.sender)

    // Docker isolation path
    if (options.isolated && !ctx.isE2ETest && options.sessionId) {
      return createIsolatedPty(ctx, { ...options, sessionId: options.sessionId }, senderWindow)
    }

    // Standard (non-isolated) path
    let shell: string
    let shellArgs: string[] = []
    let initialCommand: string | undefined = options.command

    if (ctx.isE2ETest) {
      if (isWindows) {
        shell = process.env.ComSpec || 'cmd.exe'
        shellArgs = []
        if (options.command) {
          const fakeClaude = join(__dirname, '../../scripts/fake-claude.ps1')
          initialCommand = `powershell -ExecutionPolicy Bypass -File "${fakeClaude}"`
        } else {
          initialCommand = 'echo E2E_TEST_SHELL_READY'
        }
      } else {
        shell = '/bin/bash'
        shellArgs = []
        if (options.command) {
          const scenarioScript = getScenarioData(ctx.e2eScenario).agentScript(options.sessionId || '')
          const fakeClaude = scenarioScript
            ? join(__dirname, `../../scripts/${scenarioScript}`)
            : ctx.FAKE_CLAUDE_SCRIPT || join(__dirname, '../../scripts/fake-claude.sh')
          initialCommand = `bash "${fakeClaude}"`
        } else {
          initialCommand = 'echo "E2E_TEST_SHELL_READY"; PS1="test-shell$ "'
        }
      }
    } else if (ctx.E2E_MOCK_SHELL) {
      shell = isWindows ? (process.env.ComSpec || 'cmd.exe') : '/bin/bash'
      shellArgs = isWindows ? ['/c', ctx.E2E_MOCK_SHELL] : [ctx.E2E_MOCK_SHELL]
    } else {
      shell = options.shell || getDefaultShell()
      shellArgs = []
      if (initialCommand && !isWindows) {
        shellArgs = ['-l', '-i', '-c', initialCommand]
        initialCommand = undefined
      }
    }

    // Build environment
    const baseEnv = { ...process.env } as Record<string, string>
    delete baseEnv.CLAUDE_CONFIG_DIR

    const expandHome = (value: string) => {
      if (value.startsWith('~/')) return join(homedir(), value.slice(2))
      if (value === '~') return homedir()
      return value
    }

    const agentEnv: Record<string, string> = {}
    if (options.env) {
      for (const [key, value] of Object.entries(options.env)) {
        const expanded = expandHome(value)
        if (key === 'CLAUDE_CONFIG_DIR' && expanded === join(homedir(), '.claude')) continue
        agentEnv[key] = expanded
      }
    }

    const env = { ...baseEnv, ...agentEnv } as Record<string, string>

    const ptyProcess = pty.spawn(shell, shellArgs, {
      name: 'xterm-256color',
      cols: 80,
      rows: 30,
      cwd: options.cwd,
      env,
    })

    wirePtyEvents(ctx, ptyProcess, options.id, senderWindow)

    if (initialCommand) {
      initialCommand = resolveInitialCommand(initialCommand, ctx.isE2ETest)
      setTimeout(() => {
        ptyProcess.write(`${initialCommand}\r`)
      }, 100)
    }

    return { id: options.id }
  })

  ipcMain.handle('pty:write', (_event, id: string, data: string) => {
    const ptyProcess = ctx.ptyProcesses.get(id)
    if (ptyProcess) {
      ptyProcess.write(data)
    }
  })

  ipcMain.handle('pty:resize', (_event, id: string, cols: number, rows: number) => {
    const ptyProcess = ctx.ptyProcesses.get(id)
    if (ptyProcess) {
      ptyProcess.resize(cols, rows)
    }
  })

  ipcMain.handle('pty:kill', (_event, id: string) => {
    const ptyProcess = ctx.ptyProcesses.get(id)
    if (ptyProcess) {
      ptyProcess.kill()
      ctx.ptyProcesses.delete(id)
    }
  })
}
