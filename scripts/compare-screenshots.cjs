#!/usr/bin/env node
/**
 * Pixel-by-pixel screenshot comparison and HTML report generation.
 *
 * Called by release-screenshot-compare.sh with the output directory as argument.
 * Compares baseline/ and current/ screenshots, generates diff images and an HTML report.
 *
 * Dependencies: pixelmatch, pngjs (devDependencies in package.json)
 */

const fs = require('fs')
const path = require('path')
const { PNG } = require('pngjs')
const pixelmatch = require('pixelmatch')

const outputDir = process.argv[2]
if (!outputDir) {
  console.error('Usage: node compare-screenshots.cjs <output-dir>')
  process.exit(1)
}

const baselineDir = path.join(outputDir, 'baseline')
const currentDir = path.join(outputDir, 'current')
const diffsDir = path.join(outputDir, 'diffs')
const baselineResultsPath = path.join(outputDir, 'baseline-results.json')
const currentResultsPath = path.join(outputDir, 'current-results.json')

// ── Collect all screenshot paths ────────────────────────────

function collectScreenshots(rootDir) {
  const screenshots = {}
  if (!fs.existsSync(rootDir)) return screenshots

  for (const feature of fs.readdirSync(rootDir)) {
    const featureDir = path.join(rootDir, feature)
    if (!fs.statSync(featureDir).isDirectory()) continue

    for (const file of fs.readdirSync(featureDir)) {
      if (!file.endsWith('.png')) continue
      const key = `${feature}/${file}`
      screenshots[key] = path.join(featureDir, file)
    }
  }
  return screenshots
}

// ── Compare two PNGs ────────────────────────────────────────

function compareImages(baselinePath, currentPath, diffPath) {
  const baselineData = fs.readFileSync(baselinePath)
  const currentData = fs.readFileSync(currentPath)

  const baseline = PNG.sync.read(baselineData)
  const current = PNG.sync.read(currentData)

  // If dimensions differ, we need to handle that
  const width = Math.max(baseline.width, current.width)
  const height = Math.max(baseline.height, current.height)

  // Create padded versions if dimensions differ
  const padded1 = createPaddedImage(baseline, width, height)
  const padded2 = createPaddedImage(current, width, height)

  const diff = new PNG({ width, height })
  const numDiffPixels = pixelmatch(padded1.data, padded2.data, diff.data, width, height, {
    threshold: 0.1,
  })

  fs.mkdirSync(path.dirname(diffPath), { recursive: true })
  fs.writeFileSync(diffPath, PNG.sync.write(diff))

  const totalPixels = width * height
  const diffPercent = totalPixels > 0 ? (numDiffPixels / totalPixels) * 100 : 0

  return {
    diffPixels: numDiffPixels,
    totalPixels,
    diffPercent: Math.round(diffPercent * 100) / 100,
    baselineSize: { width: baseline.width, height: baseline.height },
    currentSize: { width: current.width, height: current.height },
    dimensionsChanged: baseline.width !== current.width || baseline.height !== current.height,
  }
}

function createPaddedImage(img, targetWidth, targetHeight) {
  if (img.width === targetWidth && img.height === targetHeight) return img

  const padded = new PNG({ width: targetWidth, height: targetHeight, fill: true })
  // Fill with transparent pink to make size differences visible
  for (let y = 0; y < targetHeight; y++) {
    for (let x = 0; x < targetWidth; x++) {
      const idx = (y * targetWidth + x) * 4
      if (x < img.width && y < img.height) {
        const srcIdx = (y * img.width + x) * 4
        padded.data[idx] = img.data[srcIdx]
        padded.data[idx + 1] = img.data[srcIdx + 1]
        padded.data[idx + 2] = img.data[srcIdx + 2]
        padded.data[idx + 3] = img.data[srcIdx + 3]
      } else {
        padded.data[idx] = 255
        padded.data[idx + 1] = 0
        padded.data[idx + 2] = 255
        padded.data[idx + 3] = 128
      }
    }
  }
  return padded
}

// ── Main comparison logic ───────────────────────────────────

const baselineScreenshots = collectScreenshots(baselineDir)
const currentScreenshots = collectScreenshots(currentDir)

const allKeys = new Set([...Object.keys(baselineScreenshots), ...Object.keys(currentScreenshots)])

const results = {
  unchanged: [],
  changed: [],
  added: [],
  removed: [],
}

let processed = 0
const total = allKeys.size

for (const key of [...allKeys].sort()) {
  processed++
  const inBaseline = key in baselineScreenshots
  const inCurrent = key in currentScreenshots

  if (inBaseline && inCurrent) {
    const diffPath = path.join(diffsDir, key)
    const comparison = compareImages(baselineScreenshots[key], currentScreenshots[key], diffPath)

    if (comparison.diffPercent === 0 && !comparison.dimensionsChanged) {
      results.unchanged.push({ key, ...comparison })
      process.stdout.write(`  [${processed}/${total}] ${key} — ${dim('unchanged')}\n`)
    } else {
      results.changed.push({ key, ...comparison, diffPath: `diffs/${key}` })
      process.stdout.write(
        `  [${processed}/${total}] ${key} — ${yellow(`${comparison.diffPercent}% changed`)}\n`,
      )
    }
  } else if (inCurrent && !inBaseline) {
    results.added.push({ key })
    process.stdout.write(`  [${processed}/${total}] ${key} — ${green('added')}\n`)
  } else {
    results.removed.push({ key })
    process.stdout.write(`  [${processed}/${total}] ${key} — ${red('removed')}\n`)
  }
}

// Load test results
const baselineResults = fs.existsSync(baselineResultsPath)
  ? JSON.parse(fs.readFileSync(baselineResultsPath, 'utf-8'))
  : null
const currentResults = fs.existsSync(currentResultsPath)
  ? JSON.parse(fs.readFileSync(currentResultsPath, 'utf-8'))
  : null

// Write comparison JSON
const comparison = {
  generatedAt: new Date().toISOString(),
  baselineTag: baselineResults?.tag || 'unknown',
  currentRef: currentResults?.ref || 'unknown',
  summary: {
    unchanged: results.unchanged.length,
    changed: results.changed.length,
    added: results.added.length,
    removed: results.removed.length,
    total: allKeys.size,
    baselineFailures: baselineResults?.failed || 0,
    currentFailures: currentResults?.failed || 0,
  },
  changed: results.changed,
  added: results.added,
  removed: results.removed,
  unchanged: results.unchanged,
}

fs.writeFileSync(path.join(outputDir, 'comparison.json'), JSON.stringify(comparison, null, 2))

// ── Generate HTML report ────────────────────────────────────

generateHTML(comparison, baselineResults, currentResults, outputDir)

console.log(`\n  ✓ Comparison complete: ${results.changed.length} changed, ${results.added.length} added, ${results.removed.length} removed, ${results.unchanged.length} unchanged`)

// ── HTML generation ─────────────────────────────────────────

function generateHTML(comparison, baselineResults, currentResults, outputDir) {
  const { changed, added, removed, summary } = comparison
  const tag = comparison.baselineTag
  const ref = comparison.currentRef

  const hasFailures = summary.baselineFailures > 0 || summary.currentFailures > 0

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Release Screenshot Compare: ${tag} → ${ref}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0d1117; color: #c9d1d9; padding: 24px; }
  h1 { color: #f0f6fc; margin-bottom: 8px; font-size: 24px; }
  .subtitle { color: #8b949e; margin-bottom: 24px; font-size: 14px; }
  .summary { display: flex; gap: 16px; margin-bottom: 32px; flex-wrap: wrap; }
  .stat { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 16px 24px; min-width: 120px; }
  .stat-value { font-size: 32px; font-weight: bold; }
  .stat-label { color: #8b949e; font-size: 13px; margin-top: 4px; }
  .stat-changed .stat-value { color: #d29922; }
  .stat-added .stat-value { color: #3fb950; }
  .stat-removed .stat-value { color: #f85149; }
  .stat-unchanged .stat-value { color: #8b949e; }
  .stat-failures .stat-value { color: #f85149; }
  .section { margin-bottom: 40px; }
  .section-title { font-size: 18px; color: #f0f6fc; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid #30363d; }
  .comparison-card { background: #161b22; border: 1px solid #30363d; border-radius: 8px; margin-bottom: 24px; overflow: hidden; }
  .comparison-header { padding: 12px 16px; border-bottom: 1px solid #30363d; display: flex; justify-content: space-between; align-items: center; }
  .comparison-header h3 { font-size: 14px; color: #f0f6fc; font-family: monospace; }
  .comparison-meta { font-size: 12px; color: #8b949e; }
  .comparison-images { display: flex; gap: 0; }
  .comparison-images > div { flex: 1; padding: 16px; text-align: center; }
  .comparison-images > div:not(:last-child) { border-right: 1px solid #30363d; }
  .comparison-images label { display: block; font-size: 11px; text-transform: uppercase; color: #8b949e; margin-bottom: 8px; letter-spacing: 0.5px; }
  .comparison-images img { max-width: 100%; height: auto; border: 1px solid #30363d; border-radius: 4px; }
  .single-image { padding: 16px; text-align: center; }
  .single-image img { max-width: 80%; height: auto; border: 1px solid #30363d; border-radius: 4px; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
  .badge-changed { background: #d299221a; color: #d29922; }
  .badge-added { background: #3fb9501a; color: #3fb950; }
  .badge-removed { background: #f851491a; color: #f85149; }
  .badge-resized { background: #a371f71a; color: #a371f7; margin-left: 8px; }
  .failures { background: #f851491a; border: 1px solid #f8514933; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
  .failures h4 { color: #f85149; margin-bottom: 8px; }
  .failures pre { font-size: 12px; color: #c9d1d9; white-space: pre-wrap; word-break: break-word; max-height: 300px; overflow-y: auto; background: #0d1117; padding: 12px; border-radius: 4px; margin-top: 8px; }
  .no-changes { text-align: center; padding: 48px; color: #8b949e; }
  .no-changes p { font-size: 18px; margin-bottom: 8px; }
</style>
</head>
<body>
<h1>Release Screenshot Compare</h1>
<p class="subtitle">${tag} → ${ref} · Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>

<div class="summary">
  <div class="stat stat-changed"><div class="stat-value">${summary.changed}</div><div class="stat-label">Changed</div></div>
  <div class="stat stat-added"><div class="stat-value">${summary.added}</div><div class="stat-label">Added</div></div>
  <div class="stat stat-removed"><div class="stat-value">${summary.removed}</div><div class="stat-label">Removed</div></div>
  <div class="stat stat-unchanged"><div class="stat-value">${summary.unchanged}</div><div class="stat-label">Unchanged</div></div>
  ${hasFailures ? `<div class="stat stat-failures"><div class="stat-value">${summary.baselineFailures + summary.currentFailures}</div><div class="stat-label">Test Failures</div></div>` : ''}
</div>
`

  // Assertion failures section
  if (hasFailures) {
    html += `<div class="section">\n<h2 class="section-title">Test Failures</h2>\n`

    if (baselineResults?.failed > 0) {
      html += `<div class="failures">
<h4>Baseline failures (${tag}): ${baselineResults.failed} feature(s)</h4>
<pre>${escapeHtml(baselineResults.errors || 'No error output captured')}</pre>
</div>\n`
    }

    if (currentResults?.failed > 0) {
      html += `<div class="failures">
<h4>Current failures (${ref}): ${currentResults.failed} feature(s)</h4>
<pre>${escapeHtml(currentResults.errors || 'No error output captured')}</pre>
</div>\n`
    }

    html += `</div>\n`
  }

  // Changed screenshots
  if (changed.length > 0) {
    html += `<div class="section">\n<h2 class="section-title">Changed Screenshots (${changed.length})</h2>\n`

    for (const item of changed) {
      const resizedBadge = item.dimensionsChanged
        ? `<span class="badge badge-resized">${item.baselineSize.width}×${item.baselineSize.height} → ${item.currentSize.width}×${item.currentSize.height}</span>`
        : ''

      html += `<div class="comparison-card">
<div class="comparison-header">
  <h3>${item.key}</h3>
  <div class="comparison-meta"><span class="badge badge-changed">${item.diffPercent}% diff</span>${resizedBadge}</div>
</div>
<div class="comparison-images">
  <div><label>Baseline (${tag})</label><img src="baseline/${item.key}" alt="baseline"></div>
  <div><label>Current (${ref})</label><img src="current/${item.key}" alt="current"></div>
  <div><label>Diff</label><img src="${item.diffPath}" alt="diff"></div>
</div>
</div>\n`
    }

    html += `</div>\n`
  }

  // Added screenshots
  if (added.length > 0) {
    html += `<div class="section">\n<h2 class="section-title">Added Screenshots (${added.length})</h2>\n`

    for (const item of added) {
      html += `<div class="comparison-card">
<div class="comparison-header">
  <h3>${item.key}</h3>
  <div class="comparison-meta"><span class="badge badge-added">new</span></div>
</div>
<div class="single-image"><img src="current/${item.key}" alt="added"></div>
</div>\n`
    }

    html += `</div>\n`
  }

  // Removed screenshots
  if (removed.length > 0) {
    html += `<div class="section">\n<h2 class="section-title">Removed Screenshots (${removed.length})</h2>\n`

    for (const item of removed) {
      html += `<div class="comparison-card">
<div class="comparison-header">
  <h3>${item.key}</h3>
  <div class="comparison-meta"><span class="badge badge-removed">removed</span></div>
</div>
<div class="single-image"><img src="baseline/${item.key}" alt="removed"></div>
</div>\n`
    }

    html += `</div>\n`
  }

  // No visual changes
  if (changed.length === 0 && added.length === 0 && removed.length === 0 && !hasFailures) {
    html += `<div class="no-changes">
<p>No visual changes detected</p>
<p class="subtitle">All ${summary.unchanged} screenshots are identical between ${tag} and ${ref}</p>
</div>\n`
  }

  html += `</body>\n</html>\n`

  fs.writeFileSync(path.join(outputDir, 'index.html'), html)
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Terminal color helpers
function dim(s) { return `\x1b[2m${s}\x1b[0m` }
function yellow(s) { return `\x1b[33m${s}\x1b[0m` }
function green(s) { return `\x1b[32m${s}\x1b[0m` }
function red(s) { return `\x1b[31m${s}\x1b[0m` }
