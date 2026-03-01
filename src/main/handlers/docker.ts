/**
 * IPC handlers for Docker isolation status and container management.
 */
import { IpcMain } from 'electron'
import { HandlerContext } from './types'
import { isDockerAvailable, getContainerInfo, stopContainer } from '../docker'

export function register(ipcMain: IpcMain, ctx: HandlerContext): void {
  ipcMain.handle('docker:status', async () => {
    if (ctx.isE2ETest) {
      return { available: true }
    }
    return isDockerAvailable()
  })

  ipcMain.handle('docker:containerInfo', async (_event, sessionId: string) => {
    if (ctx.isE2ETest) {
      return null
    }
    return getContainerInfo(ctx, sessionId)
  })

  ipcMain.handle('docker:stopContainer', async (_event, sessionId: string) => {
    if (ctx.isE2ETest) {
      return
    }
    await stopContainer(ctx, sessionId)
  })

  ipcMain.handle('docker:restartContainer', async (_event, sessionId: string) => {
    if (ctx.isE2ETest) {
      return
    }
    // Stop then let the next PTY create re-start it
    await stopContainer(ctx, sessionId)
  })
}
