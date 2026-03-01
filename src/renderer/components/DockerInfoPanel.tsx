/**
 * Read-only info panel showing Docker container status for an isolated session.
 */
import { useState, useEffect, useCallback } from 'react'
import type { ContainerInfo } from '../../preload/apis/types'

interface DockerInfoPanelProps {
  sessionId: string
}

export default function DockerInfoPanel({ sessionId }: DockerInfoPanelProps) {
  const [info, setInfo] = useState<ContainerInfo | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const result = await window.docker.containerInfo(sessionId)
      setInfo(result)
    } catch {
      setInfo(null)
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  useEffect(() => { void refresh() }, [refresh])

  const statusColor = info?.status === 'running' ? 'text-green-400' :
    info?.status === 'starting' ? 'text-yellow-400' : 'text-zinc-500'

  return (
    <div className="h-full overflow-auto p-4 text-sm text-zinc-300 bg-zinc-900">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-4">Container Isolation</h3>

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

          <div>
            <span className="text-zinc-500">Image: </span>
            <code className="text-zinc-400 font-mono text-xs">{info.image}</code>
          </div>

          <div className="border-t border-zinc-800 pt-3">
            <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-2">Mounted Paths</p>
            <div className="space-y-1">
              <div>
                <span className="text-zinc-500">Repo: </span>
                <code className="text-zinc-400 font-mono text-xs">{info.repoDir}</code>
              </div>
              <div>
                <span className="text-zinc-500">Shared config: </span>
                <code className="text-zinc-400 font-mono text-xs">{info.sharedConfigDir}</code>
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-800 pt-3 flex gap-2">
            <button
              onClick={refresh}
              className="px-3 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300 transition-colors"
            >
              Refresh
            </button>
          </div>

          <div className="border-t border-zinc-800 pt-3">
            <p className="text-zinc-500 text-xs leading-relaxed">
              This session runs inside a Docker container. The agent can only access the
              repo directory and the shared config folder. Place API keys, SSH keys, or
              .gitconfig in <code className="text-zinc-400">{info.sharedConfigDir}</code> to
              make them available inside the container.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
