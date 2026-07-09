// Pre-create the GitHub release before electron-builder publishes.
//
// Why: electron-builder emits the installer and its .blockmap almost
// simultaneously, and its GitHub publisher races to CREATE the release for a
// tag that doesn't exist yet — producing two releases/tags with the same name.
// If the (draft) release already exists, both concurrent publishers simply find
// it and upload their assets, so the race becomes harmless.
//
// Run under dotenv so GH_TOKEN (Contents: read+write) is available.

import { readFile } from 'node:fs/promises'

const PREFIX = '[ensure-release]'

const log = (...args) => console.log(PREFIX, ...args)

// Log an error and abort — a failed pre-create must stop the publish.
function fail(...args) {
  console.error(PREFIX, ...args)
  process.exit(1)
}

const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))

const token = process.env.GH_TOKEN
if (!token) {
  fail('GH_TOKEN is not set. Run via `dotenv -- ...` with GH_TOKEN in .env.')
}

// Derive owner/repo from the package homepage, e.g. https://github.com/owner/repo
const match = /github\.com\/([^/]+)\/([^/]+?)(?:\.git)?\/?$/.exec(pkg.homepage ?? '')
if (!match) {
  fail(`Could not parse owner/repo from homepage: ${pkg.homepage}`)
}
const [, owner, repo] = match
const tag = `v${pkg.version}` // matches electron-builder's default GitHub tag

const api = `https://api.github.com/repos/${owner}/${repo}`
const headers = {
  Authorization: `Bearer ${token}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': `${repo}-release-script`
}

// Note: GET /releases/tags/{tag} does NOT return drafts, so list releases
// (which includes drafts) and match by tag_name.
const listRes = await fetch(`${api}/releases?per_page=100`, { headers })
if (!listRes.ok) {
  fail(`Failed to list releases: ${listRes.status} ${await listRes.text()}`)
}

const releases = await listRes.json()
const existing = releases.find((r) => r.tag_name === tag)
if (existing) {
  log(
    `Release ${tag} already exists (${existing.draft ? 'draft' : 'published'}) — skipping create.`
  )
  process.exit(0)
}

const createRes = await fetch(`${api}/releases`, {
  method: 'POST',
  headers,
  body: JSON.stringify({ tag_name: tag, name: tag, draft: true })
})
if (!createRes.ok) {
  fail(`Failed to create release ${tag}: ${createRes.status} ${await createRes.text()}`)
}

log(`Created draft release ${tag} for ${owner}/${repo}.`)
