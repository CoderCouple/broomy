/**
 * Unit tests for devcontainer CLI wrapper functions.
 */
import { describe, it, expect } from 'vitest'
import { generateDefaultDevcontainerJson, buildDevcontainerExecArgs, devcontainerSetupMessage } from './devcontainer'

describe('devcontainer', () => {
  describe('generateDefaultDevcontainerJson', () => {
    it('returns a valid devcontainer config with base image and features', () => {
      const config = generateDefaultDevcontainerJson()
      expect(config.image).toBe('mcr.microsoft.com/devcontainers/base:ubuntu')
      expect(config.features).toBeDefined()
      expect(config.features['ghcr.io/devcontainers/features/node:1']).toEqual({})
      expect(config.features['ghcr.io/devcontainers/features/git:1']).toEqual({})
      expect(config.features['ghcr.io/devcontainers/features/github-cli:1']).toEqual({})
    })
  })

  describe('buildDevcontainerExecArgs', () => {
    it('builds args for interactive shell', () => {
      const args = buildDevcontainerExecArgs('abc123', 'vscode', '/workspace', {})
      expect(args).toEqual([
        'exec', '-it', '-u', 'vscode', '-w', '/workspace',
        'abc123', 'bash', '-l',
      ])
    })

    it('builds args with command', () => {
      const args = buildDevcontainerExecArgs('abc123', 'vscode', '/workspace', {}, 'claude')
      expect(args).toEqual([
        'exec', '-it', '-u', 'vscode', '-w', '/workspace',
        'abc123', 'bash', '-l', '-c', 'claude',
      ])
    })

    it('uses specified remote user', () => {
      const args = buildDevcontainerExecArgs('abc123', 'root', '/workspace', {})
      expect(args).toContain('-u')
      const userIndex = args.indexOf('-u')
      expect(args[userIndex + 1]).toBe('root')
    })

    it('passes environment variables', () => {
      const args = buildDevcontainerExecArgs('abc123', 'vscode', '/workspace', {
        ANTHROPIC_API_KEY: 'sk-123',
        NODE_ENV: 'development',
      })
      expect(args).toContain('-e')
      expect(args).toContain('ANTHROPIC_API_KEY=sk-123')
      expect(args).toContain('NODE_ENV=development')
    })
  })

  describe('devcontainerSetupMessage', () => {
    it('returns a message with install instructions', () => {
      const msg = devcontainerSetupMessage({ available: false, error: 'devcontainer CLI is not installed' })
      expect(msg).toContain('Dev Container CLI required')
      expect(msg).toContain('npm install -g @devcontainers/cli')
      expect(msg).toContain('devcontainer CLI is not installed')
    })

    it('handles missing error message', () => {
      const msg = devcontainerSetupMessage({ available: false })
      expect(msg).toContain('devcontainer CLI is not available')
    })
  })
})
