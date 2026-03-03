/**
 * IPC handlers for devcontainer CLI status and config management.
 */
import { IpcMain } from 'electron'
import { HandlerContext } from './types'
import { isDevcontainerCliAvailable, hasDevcontainerConfig, writeDefaultDevcontainerConfig } from '../devcontainer'

export function register(ipcMain: IpcMain, ctx: HandlerContext): void {
  ipcMain.handle('devcontainer:status', async () => {
    if (ctx.isE2ETest) {
      return { available: true, version: '0.71.0' }
    }
    return isDevcontainerCliAvailable()
  })

  ipcMain.handle('devcontainer:hasConfig', (_event, workspaceFolder: string) => {
    if (ctx.isE2ETest) {
      return false
    }
    return hasDevcontainerConfig(workspaceFolder)
  })

  ipcMain.handle('devcontainer:generateDefaultConfig', (_event, workspaceFolder: string) => {
    if (ctx.isE2ETest) {
      return
    }
    writeDefaultDevcontainerConfig(workspaceFolder)
  })
}
