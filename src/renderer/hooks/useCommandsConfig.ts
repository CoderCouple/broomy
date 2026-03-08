/**
 * Hook that loads and watches commands.json for the active session's directory.
 * Returns null when no commands.json exists (prompting the setup banner).
 */
import { useState, useEffect } from 'react'
import type { CommandsConfig } from '../utils/commandsConfig'
import { loadCommandsConfig } from '../utils/commandsConfig'

export function useCommandsConfig(directory: string | undefined): {
  config: CommandsConfig | null
  loading: boolean
  exists: boolean
} {
  const [config, setConfig] = useState<CommandsConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [exists, setExists] = useState(false)

  useEffect(() => {
    if (!directory) {
      setConfig(null)
      setLoading(false)
      setExists(false)
      return
    }

    let cancelled = false

    const watcherId = `commands-config-${directory}`
    const commandsFile = `${directory}/.broomy/commands.json`
    let watching = false

    function startWatching() {
      if (watching) return
      void window.fs.watch(watcherId, commandsFile).then((result: { success: boolean }) => {
        watching = result.success
      })
    }

    async function load() {
      setLoading(true)
      const loaded = await loadCommandsConfig(directory!)
      if (!cancelled) {
        setConfig(loaded)
        setExists(loaded !== null)
        setLoading(false)
        // If config exists, the file exists — start watching if not already
        if (loaded) startWatching()
      }
    }

    void load()

    // Watch the commands.json file directly for external edits
    startWatching()
    const removeListener = window.fs.onChange(watcherId, () => {
      void load()
    })

    return () => {
      cancelled = true
      removeListener()
      void window.fs.unwatch(watcherId)
    }
  }, [directory])

  return { config, loading, exists }
}
