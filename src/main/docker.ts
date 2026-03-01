/**
 * Docker container lifecycle management for agent isolation.
 *
 * Uses `docker` CLI directly — no SDK dependency.
 */
import { execFile } from 'child_process'
import { promisify } from 'util'
import { mkdirSync, existsSync } from 'fs'
import { join } from 'path'
import { homedir, platform, arch } from 'os'
import type { HandlerContext } from './handlers/types'
import type { DockerStatus, ContainerInfo } from '../preload/apis/types'

const execFileAsync = promisify(execFile)

/** Map Node.js arch values to Docker platform strings. */
function dockerPlatform(): string {
  const a = arch()
  if (a === 'arm64') return 'linux/arm64'
  return 'linux/amd64'
}

export const DEFAULT_DOCKER_IMAGE = 'broomy/isolation:latest'
export const SHARED_CONFIG_DIR = join(homedir(), '.broomy', 'isolation')
const CONTAINER_MOUNT_PATH = '/home/broomy/.config/broomy-shared'

function containerName(sessionId: string): string {
  return `broomy-${sessionId}`
}

export async function isDockerAvailable(): Promise<DockerStatus> {
  try {
    await execFileAsync('docker', ['version', '--format', '{{.Server.Version}}'])
    return { available: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)

    // Docker CLI not found
    if (message.includes('ENOENT') || message.includes('not found')) {
      const installUrl = platform() === 'darwin'
        ? 'https://docker.com/products/docker-desktop'
        : 'https://docs.docker.com/engine/install/'
      return { available: false, error: 'Docker is not installed', installUrl }
    }

    // Daemon not running
    const installUrl = platform() === 'darwin'
      ? 'https://docker.com/products/docker-desktop'
      : 'https://docs.docker.com/engine/install/'
    return { available: false, error: 'Docker daemon is not running', installUrl }
  }
}

export async function ensureContainer(
  ctx: HandlerContext,
  sessionId: string,
  repoDir: string,
  image?: string,
): Promise<{ success: boolean; error?: string; containerId?: string }> {
  const name = containerName(sessionId)
  const img = image || DEFAULT_DOCKER_IMAGE

  // Check if container already exists and is running
  const existing = ctx.dockerContainers.get(sessionId)
  if (existing) {
    try {
      const { stdout } = await execFileAsync('docker', [
        'inspect', '--format', '{{.State.Running}}', name,
      ])
      if (stdout.trim() === 'true') {
        return { success: true, containerId: existing.containerId }
      }
    } catch {
      // Container doesn't exist anymore, clean up tracking
      ctx.dockerContainers.delete(sessionId)
    }
  }

  // Ensure shared config directory exists
  if (!existsSync(SHARED_CONFIG_DIR)) {
    mkdirSync(SHARED_CONFIG_DIR, { recursive: true })
  }

  // Remove any stale container with same name
  try {
    await execFileAsync('docker', ['rm', '-f', name])
  } catch {
    // Ignore — container may not exist
  }

  try {
    const { stdout } = await execFileAsync('docker', [
      'run', '-d',
      '--platform', dockerPlatform(),
      '--name', name,
      '-v', `${repoDir}:${repoDir}`,
      '-v', `${SHARED_CONFIG_DIR}:${CONTAINER_MOUNT_PATH}`,
      '-w', repoDir,
      img,
      'sleep', 'infinity',
    ])

    const containerId = stdout.trim()
    ctx.dockerContainers.set(sessionId, { containerId, repoDir, image: img })
    return { success: true, containerId }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { success: false, error: message }
  }
}

export async function stopContainer(
  ctx: HandlerContext,
  sessionId: string,
): Promise<void> {
  const name = containerName(sessionId)
  ctx.dockerContainers.delete(sessionId)
  try {
    await execFileAsync('docker', ['rm', '-f', name])
  } catch {
    // Ignore — container may already be gone
  }
}

export async function stopAllContainers(ctx: HandlerContext): Promise<void> {
  const sessions = Array.from(ctx.dockerContainers.keys())
  await Promise.allSettled(sessions.map((sid) => stopContainer(ctx, sid)))
}

export async function getContainerInfo(
  ctx: HandlerContext,
  sessionId: string,
): Promise<ContainerInfo | null> {
  const state = ctx.dockerContainers.get(sessionId)
  if (!state) return null

  let status: ContainerInfo['status'] = 'stopped'
  try {
    const { stdout } = await execFileAsync('docker', [
      'inspect', '--format', '{{.State.Status}}', containerName(sessionId),
    ])
    const dockerStatus = stdout.trim()
    if (dockerStatus === 'running') status = 'running'
    else if (dockerStatus === 'created') status = 'starting'
  } catch {
    // Container gone
    return null
  }

  return {
    containerId: state.containerId.substring(0, 12),
    status,
    image: state.image,
    repoDir: state.repoDir,
    sharedConfigDir: SHARED_CONFIG_DIR,
  }
}

export function buildDockerExecArgs(
  containerId: string,
  cwd: string,
  env: Record<string, string>,
  command?: string,
): string[] {
  const args: string[] = ['exec', '-it', '-w', cwd]

  for (const [key, value] of Object.entries(env)) {
    args.push('-e', `${key}=${value}`)
  }

  args.push(containerId)

  if (command) {
    args.push('bash', '-l', '-c', command)
  } else {
    args.push('bash', '-l')
  }

  return args
}

/**
 * Returns a friendly terminal error box when Docker is unavailable.
 */
export function dockerSetupMessage(status: DockerStatus): string {
  const installLine = status.installUrl
    ? `  Install: ${status.installUrl}`
    : ''

  const macInstall = '  • macOS: Download Docker Desktop from\n    https://docker.com/products/docker-desktop'
  const linuxInstall = '  • Linux: curl -fsSL https://get.docker.com | sh'

  return [
    '╭────────────────────────────────────────────────────╮',
    '│  Docker is required for container isolation         │',
    '│                                                     │',
    `│  ${status.error || 'Docker is not available'}`,
    '│                                                     │',
    '│  To install:                                        │',
    `│  ${macInstall}`,
    `│  ${linuxInstall}`,
    '│                                                     │',
    installLine ? `│  ${installLine}` : null,
    '│  After installing, start Docker and restart         │',
    '│  this session.                                      │',
    '│                                                     │',
    '│  Or disable container isolation in agent settings.  │',
    '╰────────────────────────────────────────────────────╯',
    '',
  ].filter((l) => l !== null).join('\r\n')
}
