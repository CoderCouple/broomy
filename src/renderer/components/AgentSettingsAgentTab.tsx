/**
 * Agent configuration tab for creating, editing, and deleting agent definitions.
 */
import { type RefObject, useState, useEffect } from 'react'
import type { AgentConfig } from '../store/agents'
import { EnvVarEditor, type EnvVarEditorRef } from './EnvVarEditor'
import { SKIP_PERMISSIONS_FLAGS } from '../hooks/useAppCallbacks'
import type { DockerStatus } from '../../preload/apis/types'

interface AgentSettingsAgentTabProps {
  agents: AgentConfig[]
  editingId: string | null
  showAddForm: boolean
  name: string
  command: string
  color: string
  env: Record<string, string>
  isolated: boolean
  dockerImage: string
  skipPermissions: boolean
  envEditorRef: RefObject<EnvVarEditorRef>
  onNameChange: (v: string) => void
  onCommandChange: (v: string) => void
  onColorChange: (v: string) => void
  onEnvChange: (v: Record<string, string>) => void
  onIsolatedChange: (v: boolean) => void
  onDockerImageChange: (v: string) => void
  onSkipPermissionsChange: (v: boolean) => void
  onEdit: (agent: AgentConfig) => void
  onUpdate: () => void
  onDelete: (id: string) => void
  onAdd: () => void
  onShowAddForm: () => void
  onCancel: () => void
}

export function AgentSettingsAgentTab({
  agents,
  editingId,
  showAddForm,
  name,
  command,
  color,
  env,
  isolated,
  dockerImage,
  skipPermissions,
  envEditorRef,
  onNameChange,
  onCommandChange,
  onColorChange,
  onEnvChange,
  onIsolatedChange,
  onDockerImageChange,
  onSkipPermissionsChange,
  onEdit,
  onUpdate,
  onDelete,
  onAdd,
  onShowAddForm,
  onCancel,
}: AgentSettingsAgentTabProps) {
  return (
    <>
      {/* Agents section */}
      <div className="mt-8 mb-4 border-t border-border pt-4">
        <h3 className="text-sm font-medium text-text-primary mb-3">Agents</h3>
      </div>
      <div className="space-y-2 mb-4">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className={`p-3 rounded border transition-colors ${
              editingId === agent.id
                ? 'border-accent bg-bg-tertiary'
                : 'border-border bg-bg-primary hover:bg-bg-tertiary'
            }`}
          >
            {editingId === agent.id ? (
              <AgentEditForm
                name={name}
                command={command}
                color={color}
                env={env}
                isolated={isolated}
                dockerImage={dockerImage}
                skipPermissions={skipPermissions}
                envEditorRef={envEditorRef}
                onNameChange={onNameChange}
                onCommandChange={onCommandChange}
                onColorChange={onColorChange}
                onEnvChange={onEnvChange}
                onIsolatedChange={onIsolatedChange}
                onDockerImageChange={onDockerImageChange}
                onSkipPermissionsChange={onSkipPermissionsChange}
                onSave={onUpdate}
                onCancel={onCancel}
              />
            ) : (
              <AgentRow agent={agent} onEdit={onEdit} onDelete={onDelete} />
            )}
          </div>
        ))}

        {agents.length === 0 && !showAddForm && (
          <div className="text-center text-text-secondary text-sm py-8">
            No agents configured.
            <br />
            Add one to get started.
          </div>
        )}
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="p-3 rounded border border-accent bg-bg-tertiary space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Agent name"
            className="w-full px-3 py-2 bg-bg-secondary border border-border rounded text-sm text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent"
            autoFocus
          />
          <input
            type="text"
            value={command}
            onChange={(e) => onCommandChange(e.target.value)}
            placeholder="Command (e.g., claude)"
            className="w-full px-3 py-2 bg-bg-secondary border border-border rounded text-sm text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent"
          />
          <input
            type="text"
            value={color}
            onChange={(e) => onColorChange(e.target.value)}
            placeholder="Color (optional, e.g., #4a9eff)"
            className="w-full px-3 py-2 bg-bg-secondary border border-border rounded text-sm text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent"
          />
          <EnvVarEditor ref={envEditorRef} env={env} onChange={onEnvChange} command={command} />
          <IsolationSettings
            isolated={isolated}
            dockerImage={dockerImage}
            skipPermissions={skipPermissions}
            command={command}
            onIsolatedChange={onIsolatedChange}
            onDockerImageChange={onDockerImageChange}
            onSkipPermissionsChange={onSkipPermissionsChange}
          />
          <div className="flex gap-2">
            <button
              onClick={onAdd}
              disabled={!name.trim() || !command.trim()}
              className="px-3 py-1.5 bg-accent text-white text-sm rounded hover:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Add Agent
            </button>
            <button
              onClick={onCancel}
              className="px-3 py-1.5 bg-bg-tertiary text-text-secondary text-sm rounded hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Add button */}
      {!showAddForm && !editingId && (
        <button
          onClick={onShowAddForm}
          className="w-full py-2 px-3 border border-dashed border-border text-text-secondary text-sm rounded hover:border-accent hover:text-text-primary transition-colors"
        >
          + Add Agent
        </button>
      )}
    </>
  )
}

// --- Sub-components ---

function AgentEditForm({
  name,
  command,
  color,
  env,
  isolated,
  dockerImage,
  skipPermissions,
  envEditorRef,
  onNameChange,
  onCommandChange,
  onColorChange,
  onEnvChange,
  onIsolatedChange,
  onDockerImageChange,
  onSkipPermissionsChange,
  onSave,
  onCancel,
}: {
  name: string
  command: string
  color: string
  env: Record<string, string>
  isolated: boolean
  dockerImage: string
  skipPermissions: boolean
  envEditorRef: RefObject<EnvVarEditorRef>
  onNameChange: (v: string) => void
  onCommandChange: (v: string) => void
  onColorChange: (v: string) => void
  onEnvChange: (v: Record<string, string>) => void
  onIsolatedChange: (v: boolean) => void
  onDockerImageChange: (v: string) => void
  onSkipPermissionsChange: (v: boolean) => void
  onSave: () => void
  onCancel: () => void
}) {
  return (
    <div className="space-y-3">
      <input
        type="text"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="Agent name"
        className="w-full px-3 py-2 bg-bg-secondary border border-border rounded text-sm text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent"
      />
      <input
        type="text"
        value={command}
        onChange={(e) => onCommandChange(e.target.value)}
        placeholder="Command (e.g., claude)"
        className="w-full px-3 py-2 bg-bg-secondary border border-border rounded text-sm text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent"
      />
      <input
        type="text"
        value={color}
        onChange={(e) => onColorChange(e.target.value)}
        placeholder="Color (optional, e.g., #4a9eff)"
        className="w-full px-3 py-2 bg-bg-secondary border border-border rounded text-sm text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent"
      />
      <EnvVarEditor ref={envEditorRef} env={env} onChange={onEnvChange} command={command} />
      <IsolationSettings
        isolated={isolated}
        dockerImage={dockerImage}
        skipPermissions={skipPermissions}
        command={command}
        onIsolatedChange={onIsolatedChange}
        onDockerImageChange={onDockerImageChange}
        onSkipPermissionsChange={onSkipPermissionsChange}
      />
      <div className="flex gap-2">
        <button
          onClick={onSave}
          disabled={!name.trim() || !command.trim()}
          className="px-3 py-1.5 bg-accent text-white text-sm rounded hover:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 bg-bg-tertiary text-text-secondary text-sm rounded hover:text-text-primary transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

/** Docker status indicator and isolation/skip-permissions checkboxes for agent settings. */
function IsolationSettings({
  isolated,
  dockerImage,
  skipPermissions,
  command,
  onIsolatedChange,
  onDockerImageChange,
  onSkipPermissionsChange,
}: {
  isolated: boolean
  dockerImage: string
  skipPermissions: boolean
  command: string
  onIsolatedChange: (v: boolean) => void
  onDockerImageChange: (v: string) => void
  onSkipPermissionsChange: (v: boolean) => void
}) {
  const [dockerStatus, setDockerStatus] = useState<DockerStatus | null>(null)

  useEffect(() => {
    if (isolated || dockerStatus === null) {
      void window.docker.status().then(setDockerStatus)
    }
  }, [isolated])

  const baseCmd = command.trim().split(/\s+/)[0]
  const skipFlag = SKIP_PERMISSIONS_FLAGS[baseCmd]

  return (
    <div className="space-y-3 border-t border-border pt-3">
      {/* Isolation checkbox */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isolated}
          onChange={(e) => onIsolatedChange(e.target.checked)}
          className="rounded border-border"
        />
        <span className="text-sm text-text-primary">Run in Docker container</span>
      </label>

      {isolated && (
        <>
          <input
            type="text"
            value={dockerImage}
            onChange={(e) => onDockerImageChange(e.target.value)}
            placeholder="broomy/isolation:latest"
            className="w-full px-3 py-2 bg-bg-secondary border border-border rounded text-sm text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent"
          />
          {dockerStatus && (
            <div className={`text-xs flex items-center gap-1.5 ${dockerStatus.available ? 'text-green-400' : 'text-yellow-400'}`}>
              <span className={`w-2 h-2 rounded-full ${dockerStatus.available ? 'bg-green-400' : 'bg-yellow-400'}`} />
              {dockerStatus.available ? 'Docker available' : (dockerStatus.error || 'Docker not available')}
              {!dockerStatus.available && dockerStatus.installUrl && (
                <button
                  onClick={() => void window.shell.openExternal(dockerStatus.installUrl!)}
                  className="underline hover:text-text-primary transition-colors ml-1"
                >
                  Install
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* Skip permissions checkbox */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={skipPermissions}
          onChange={(e) => onSkipPermissionsChange(e.target.checked)}
          className="rounded border-border"
        />
        <span className="text-sm text-text-primary">Skip permission prompts</span>
      </label>

      {skipPermissions && skipFlag && (
        <p className="text-xs text-text-secondary ml-6">
          Will append <code className="text-text-tertiary font-mono">{skipFlag}</code> to the command.
        </p>
      )}

      {skipPermissions && !skipFlag && (
        <p className="text-xs text-text-secondary ml-6">
          No known auto-approve flag for this agent. You may need to add it to the command manually.
        </p>
      )}

      {skipPermissions && !isolated && (
        <p className="text-xs text-yellow-400 ml-6">
          Warning: Skipping permissions without container isolation gives this agent unrestricted access to your machine.
          Enable &quot;Run in Docker container&quot; above for safe auto-approval.
        </p>
      )}
    </div>
  )
}

function AgentRow({
  agent,
  onEdit,
  onDelete,
}: {
  agent: AgentConfig
  onEdit: (agent: AgentConfig) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {agent.color && (
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: agent.color }}
          />
        )}
        <div>
          <div className="font-medium text-sm text-text-primary flex items-center gap-2">
            {agent.name}
            {agent.isolated && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-normal">docker</span>
            )}
            {agent.skipPermissions && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 font-normal">auto</span>
            )}
          </div>
          <div className="text-xs text-text-secondary font-mono">
            {agent.command}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onEdit(agent)}
          className="p-1.5 text-text-secondary hover:text-text-primary transition-colors"
          title="Edit agent"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            <path d="m15 5 4 4" />
          </svg>
        </button>
        <button
          onClick={() => onDelete(agent.id)}
          className="p-1.5 text-text-secondary hover:text-status-error transition-colors"
          title="Delete agent"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          </svg>
        </button>
      </div>
    </div>
  )
}
