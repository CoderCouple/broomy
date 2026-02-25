/**
 * Composite registration for all GitHub CLI IPC handlers (core and comments).
 */
import { IpcMain } from 'electron'
import { HandlerContext } from './types'
import * as ghCore from './ghCore'
import * as ghComments from './ghComments'

export function register(ipcMain: IpcMain, ctx: HandlerContext): void {
  ghCore.register(ipcMain, ctx)
  ghComments.register(ipcMain, ctx)
}
