#!/usr/bin/env bash
set -euo pipefail

# Build node-pty native modules for Linux x64 and arm64 using Docker.
# Run this once, then again whenever Electron or node-pty is upgraded.
#
# Requirements: Docker with multi-arch support (Docker Desktop on macOS has this).

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Read versions from package.json
NODE_PTY_VERSION=$(node -e "const p=require('$PROJECT_DIR/package.json'); const v=p.dependencies['node-pty']; console.log(v.replace(/[\^~]/,''))")
ELECTRON_VERSION=$(node -e "const p=require('$PROJECT_DIR/package.json'); const v=p.devDependencies['electron']; console.log(v.replace(/[\^~]/,''))")

echo "node-pty version: $NODE_PTY_VERSION"
echo "Electron version: $ELECTRON_VERSION"

OUTPUT_DIR="$PROJECT_DIR/build/node-pty-prebuilds"
mkdir -p "$OUTPUT_DIR"

build_for_arch() {
  local arch="$1"
  local docker_platform="linux/$arch"
  # Docker uses amd64/arm64, node uses x64/arm64
  local node_arch="$arch"
  if [ "$arch" = "amd64" ]; then
    node_arch="x64"
  fi

  local out="$OUTPUT_DIR/linux-$node_arch"
  mkdir -p "$out"

  echo ""
  echo "=== Building node-pty for linux-$node_arch (Docker platform: $docker_platform) ==="
  echo ""

  docker run --rm \
    --platform "$docker_platform" \
    -v "$out:/output" \
    node:18 \
    bash -c "
      set -euo pipefail

      # Install native build tools needed for node-pty
      apt-get update -qq && apt-get install -y -qq python3 make gcc g++ > /dev/null 2>&1

      # Install node-pty in a temp directory
      mkdir /tmp/pty-build && cd /tmp/pty-build
      npm init -y > /dev/null 2>&1
      npm install node-pty@$NODE_PTY_VERSION --ignore-scripts

      # Install @electron/rebuild and compile node-pty against Electron
      npm install @electron/rebuild
      npx electron-rebuild -v $ELECTRON_VERSION -m . -o node-pty

      # Copy the compiled artifacts
      cp node_modules/node-pty/build/Release/pty.node /output/
      if [ -f node_modules/node-pty/build/Release/spawn-helper ]; then
        cp node_modules/node-pty/build/Release/spawn-helper /output/
      fi

      echo 'Done!'
    "

  echo "Output in $out:"
  ls -la "$out"
}

build_for_arch "amd64"
build_for_arch "arm64"

echo ""
echo "=== All Linux prebuilds ready in $OUTPUT_DIR ==="
ls -laR "$OUTPUT_DIR"
