// Input hardening at the bridge boundary. The main process re-validates too
// (defense in depth), but rejecting bad input early keeps garbage off the wire.

/**
 * Validate a URL intended for external opening. Only http(s) is allowed.
 * Throws on anything else so a bad value never reaches the main process.
 */
export function sanitizeExternalUrl(url: string): string {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new Error(`Invalid URL: ${url}`)
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error(`Blocked non-web URL: ${parsed.protocol}`)
  }
  return parsed.toString()
}

/** Ensure a value is a non-empty string (e.g. a settings key). */
export function sanitizeKey(key: string): string {
  if (typeof key !== 'string' || key.length === 0) {
    throw new Error('Expected a non-empty string key')
  }
  return key
}
