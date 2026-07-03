import { app, shell } from 'electron'

// OS / app-level integrations. Input from the renderer is UNTRUSTED, so this
// layer re-validates (defense in depth) even though the preload also sanitizes.

async function openExternal(url: string): Promise<void> {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new Error(`Invalid URL: ${url}`)
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error(`Refusing to open non-web URL: ${parsed.protocol}`)
  }
  await shell.openExternal(parsed.toString())
}

function getVersion(): string {
  return app.getVersion()
}

function getPlatform(): NodeJS.Platform {
  return process.platform
}

export const systemService = { openExternal, getVersion, getPlatform }
