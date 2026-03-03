/**
 * Read-only info panel showing container status for an isolated session.
 * Supports both lightweight Docker and devcontainer isolation modes.
 */
import { useState, useEffect, useCallback } from 'react'
import type { ContainerInfo } from '../../preload/apis/types'

interface DockerInfoPanelProps {
  repoDir: string
  isolationMode?: 'docker' | 'devcontainer'
}

export default function DockerInfoPanel({ repoDir, isolationMode = 'docker' }: DockerInfoPanelProps) {
  const [info, setInfo] = useState<ContainerInfo | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const result = await window.docker.containerInfo(repoDir)
      setInfo(result)
    } catch {
      setInfo(null)
    } finally {
      setLoading(false)
    }
  }, [repoDir])

  useEffect(() => { void refresh() }, [refresh])

  const handleReset = useCallback(async () => {
    if (!window.confirm('This will destroy the container and all installed packages. Continue?')) return
    await window.docker.resetContainer(repoDir)
    setInfo(null)
  }, [repoDir])

  const statusColor = info?.status === 'running' ? 'text-green-400' :
    info?.status === 'starting' ? 'text-yellow-400' : 'text-zinc-500'

  const isDevcontainer = isolationMode === 'devcontainer'
  const title = isDevcontainer ? 'Dev Container Isolation' : 'Agent Container Isolation'

  return (
    <div className="h-full overflow-auto p-4 text-sm text-zinc-300 bg-zinc-900">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-4">{title}</h3>

      {loading && <p className="text-zinc-500">Loading...</p>}

      {!loading && !info && (
        <p className="text-zinc-500">No container running for this session. The container will start when the agent terminal is opened.</p>
      )}

      {!loading && info && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-zinc-500">Status:</span>
            <span className={`font-medium ${statusColor}`}>{info.status}</span>
          </div>

          <div>
            <span className="text-zinc-500">Container ID: </span>
            <code className="text-zinc-400 font-mono text-xs">{info.containerId}</code>
          </div>

          {!isDevcontainer && (
            <div>
              <span className="text-zinc-500">Image: </span>
              <code className="text-zinc-400 font-mono text-xs">{info.image}</code>
            </div>
          )}

          <div>
            <span className="text-zinc-500">Repo: </span>
            <code className="text-zinc-400 font-mono text-xs">{info.repoDir}</code>
          </div>

          {isDevcontainer && (
            <div>
              <span className="text-zinc-500">Mode: </span>
              <span className="text-zinc-400 text-xs">Dev Container (.devcontainer/devcontainer.json)</span>
            </div>
          )}

          <div className="border-t border-zinc-800 pt-3 flex gap-2">
            <button
              onClick={refresh}
              className="px-3 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300 transition-colors"
            >
              Refresh
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-1 text-xs bg-red-900/50 hover:bg-red-900/80 rounded text-red-300 transition-colors"
            >
              {isDevcontainer ? 'Rebuild Container' : 'Reset Container'}
            </button>
          </div>

          <div className="border-t border-zinc-800 pt-3">
            <p className="text-zinc-500 text-xs leading-relaxed">
              {isDevcontainer
                ? 'This session runs inside a dev container defined by .devcontainer/devcontainer.json. Edit that file to customize the container environment.'
                : 'This session runs inside a Docker container. The agent can only access the repo directory. Environment variables (API keys, etc.) are passed through from the agent configuration.'
              }
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
