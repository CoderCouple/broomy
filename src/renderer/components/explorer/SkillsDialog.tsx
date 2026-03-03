/**
 * Dialog for viewing and installing Broomy skill files for Claude Code.
 */
import { useState, useEffect } from 'react'
import { SKILL_ACTIONS, skillCommandPath } from '../../utils/skillActions'
import type { SkillActionName } from '../../utils/skillActions'

interface SkillsDialogProps {
  directory: string
  onClose: () => void
  onInstalled: () => void
}

export function SkillsDialog({ directory, onClose, onInstalled }: SkillsDialogProps) {
  const [statuses, setStatuses] = useState<Record<SkillActionName, boolean>>({} as Record<SkillActionName, boolean>)
  const [installing, setInstalling] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function check() {
      const result = {} as Record<SkillActionName, boolean>
      for (const action of SKILL_ACTIONS) {
        const exists = await window.fs.exists(skillCommandPath(directory, action.name))
        result[action.name] = exists
      }
      if (!cancelled) {
        setStatuses(result)
        setLoaded(true)
      }
    }
    void check()
    return () => { cancelled = true }
  }, [directory])

  const missingCount = loaded
    ? SKILL_ACTIONS.filter((a) => !statuses[a.name]).length
    : 0

  const handleInstall = async () => {
    setInstalling(true)
    try {
      const commandsDir = `${directory}/.claude/commands`
      await window.fs.mkdir(`${directory}/.claude`)
      await window.fs.mkdir(commandsDir)

      for (const action of SKILL_ACTIONS) {
        if (!statuses[action.name]) {
          await window.fs.writeFile(skillCommandPath(directory, action.name), action.defaultContent)
        }
      }

      onInstalled()
      onClose()
    } catch {
      // Best effort — user can retry
      setInstalling(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-bg-secondary rounded-lg shadow-xl border border-border w-full max-w-md mx-4 p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-medium text-text-primary mb-2">Broomy Skills for Claude Code</h3>
        <p className="text-sm text-text-secondary mb-3">
          Skill files let you customize how Claude Code handles Broomy actions.
          They are stored in <code className="font-mono bg-bg-tertiary px-1 rounded">.claude/commands/</code>.
        </p>

        {loaded && (
          <div className="mb-4 space-y-1">
            {SKILL_ACTIONS.map((action) => (
              <div key={action.name} className="flex items-center gap-2 text-sm">
                <span className={statuses[action.name] ? 'text-green-400' : 'text-text-secondary'}>
                  {statuses[action.name] ? '✓' : '○'}
                </span>
                <span className="text-text-primary">{action.label}</span>
                <span className="text-text-secondary font-mono text-xs">
                  broomy-action-{action.name}.md
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Close
          </button>
          {missingCount > 0 && (
            <button
              onClick={() => void handleInstall()}
              disabled={installing}
              className="px-3 py-1.5 text-sm rounded bg-accent text-white hover:bg-accent/80 transition-colors disabled:opacity-50"
            >
              {installing ? 'Installing...' : `Add ${missingCount} missing skill${missingCount !== 1 ? 's' : ''}`}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
