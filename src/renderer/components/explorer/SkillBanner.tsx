/**
 * Info banner nudging Claude Code users to install Broomy skill files.
 */

interface SkillBannerProps {
  onOpenDialog: () => void
  onDismiss: () => void
}

export function SkillBanner({ onOpenDialog, onDismiss }: SkillBannerProps) {
  return (
    <div className="px-3 py-2 border-b border-border bg-blue-500/10 flex items-center gap-2 text-xs">
      <span className="text-blue-400 flex-1">
        <button
          onClick={onOpenDialog}
          className="hover:underline text-left"
        >
          Customize Broomy actions with Claude Code skills
        </button>
      </span>
      <button
        onClick={onDismiss}
        className="text-text-secondary hover:text-text-primary shrink-0"
        aria-label="Dismiss skill banner"
      >
        ✕
      </button>
    </div>
  )
}
