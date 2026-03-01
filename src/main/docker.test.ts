import { describe, it, expect } from 'vitest'
import { buildDockerExecArgs, dockerSetupMessage, DEFAULT_DOCKER_IMAGE, SHARED_CONFIG_DIR, CONTAINER_SHELLS } from './docker'

describe('buildDockerExecArgs', () => {
  it('builds args for command execution', () => {
    const args = buildDockerExecArgs('abc123', '/repo', { ANTHROPIC_API_KEY: 'sk-test' }, 'claude')
    expect(args).toEqual([
      'exec', '-it', '-w', '/repo',
      '-e', 'ANTHROPIC_API_KEY=sk-test',
      'abc123',
      'bash', '-l', '-c', 'claude',
    ])
  })

  it('builds args for interactive shell (no command)', () => {
    const args = buildDockerExecArgs('abc123', '/repo', {})
    expect(args).toEqual([
      'exec', '-it', '-w', '/repo',
      'abc123',
      'bash', '-l',
    ])
  })

  it('passes multiple env vars', () => {
    const args = buildDockerExecArgs('abc123', '/repo', { A: '1', B: '2' }, 'test')
    expect(args).toContain('-e')
    expect(args).toContain('A=1')
    expect(args).toContain('B=2')
  })

  it('handles empty env', () => {
    const args = buildDockerExecArgs('abc123', '/repo', {}, 'ls')
    expect(args.filter(a => a === '-e')).toHaveLength(0)
  })
})

describe('dockerSetupMessage', () => {
  it('includes the error message', () => {
    const msg = dockerSetupMessage({ available: false, error: 'Docker is not installed' })
    expect(msg).toContain('Docker is not installed')
  })

  it('includes install URLs when provided', () => {
    const msg = dockerSetupMessage({
      available: false,
      error: 'Not found',
      installUrl: 'https://docker.com/products/docker-desktop',
    })
    expect(msg).toContain('https://docker.com/products/docker-desktop')
  })

  it('includes setup instructions', () => {
    const msg = dockerSetupMessage({ available: false, error: 'test' })
    expect(msg).toContain('container isolation')
    expect(msg).toContain('agent settings')
  })

  it('handles missing error message', () => {
    const msg = dockerSetupMessage({ available: false })
    expect(msg).toContain('Docker is not available')
  })

  it('excludes install line when no URL provided', () => {
    const msg = dockerSetupMessage({ available: false, error: 'error' })
    expect(msg).not.toContain('Install:')
  })
})

describe('constants', () => {
  it('has expected default image', () => {
    expect(DEFAULT_DOCKER_IMAGE).toBe('broomy/isolation:latest')
  })

  it('has shared config dir under .broomy', () => {
    expect(SHARED_CONFIG_DIR).toContain('.broomy')
    expect(SHARED_CONFIG_DIR).toContain('isolation')
  })

  it('has container shells with bash as default', () => {
    expect(CONTAINER_SHELLS).toHaveLength(2)
    expect(CONTAINER_SHELLS[0]).toEqual({ path: '/bin/bash', name: 'Bash', isDefault: true })
    expect(CONTAINER_SHELLS[1]).toEqual({ path: '/bin/sh', name: 'sh', isDefault: false })
  })
})
