/**
 * Preload API for Docker isolation status and container info.
 */
import { ipcRenderer } from 'electron'
import type { DockerStatus, ContainerInfo } from './types'

export type DockerApi = {
  status: () => Promise<DockerStatus>
  containerInfo: (sessionId: string) => Promise<ContainerInfo | null>
}

export const dockerApi: DockerApi = {
  status: () => ipcRenderer.invoke('docker:status'),
  containerInfo: (sessionId) => ipcRenderer.invoke('docker:containerInfo', sessionId),
}
