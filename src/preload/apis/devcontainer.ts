/**
 * Preload API for devcontainer CLI status and config management.
 */
import { ipcRenderer } from 'electron'
import type { DevcontainerStatus } from './types'

export type DevcontainerApi = {
  status: () => Promise<DevcontainerStatus>
  hasConfig: (workspaceFolder: string) => Promise<boolean>
  generateDefaultConfig: (workspaceFolder: string) => Promise<void>
}

export const devcontainerApi: DevcontainerApi = {
  status: () => ipcRenderer.invoke('devcontainer:status'),
  hasConfig: (workspaceFolder) => ipcRenderer.invoke('devcontainer:hasConfig', workspaceFolder),
  generateDefaultConfig: (workspaceFolder) => ipcRenderer.invoke('devcontainer:generateDefaultConfig', workspaceFolder),
}
