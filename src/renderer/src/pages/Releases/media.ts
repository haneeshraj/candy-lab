// Client-side media preparation, run before uploading to Supabase Storage.
// Compressing here also shrinks what we send across IPC. Cover art is validated
// to be exactly 3000×3000 and downscaled to a 500×500 WebP; the Spotify canvas
// is validated to 1080×1920 and re-encoded to a 480p WebM (best-effort — if the
// browser can't re-encode, the original is uploaded unchanged).

const COVER_INPUT = 3000
const COVER_OUTPUT = 500
const COVER_QUALITY = 0.9

const CANVAS_INPUT_W = 1080
const CANVAS_INPUT_H = 1920
const CANVAS_OUTPUT_W = 480
const CANVAS_OUTPUT_H = 854 // 480 × 16/9, keeping the 9:16 aspect
const CANVAS_BITRATE = 1_000_000 // ~1 Mbps

/** Success carries the processed file; failure carries a user-facing message. */
export type PrepareResult = { file: File } | { error: string }

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not read the image file.'))
    img.src = url
  })
}

/** Validate a 3000×3000 cover and return a 500×500 WebP. */
export async function prepareCoverArt(file: File): Promise<PrepareResult> {
  const url = URL.createObjectURL(file)
  try {
    const img = await loadImage(url)
    if (img.naturalWidth !== COVER_INPUT || img.naturalHeight !== COVER_INPUT) {
      return {
        error: `Cover art must be exactly ${COVER_INPUT}×${COVER_INPUT}px (got ${img.naturalWidth}×${img.naturalHeight}).`
      }
    }

    const canvas = document.createElement('canvas')
    canvas.width = COVER_OUTPUT
    canvas.height = COVER_OUTPUT
    const ctx = canvas.getContext('2d')
    if (!ctx) return { error: 'Image processing is unavailable.' }
    ctx.drawImage(img, 0, 0, COVER_OUTPUT, COVER_OUTPUT)

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', COVER_QUALITY)
    )
    if (!blob) return { error: 'Failed to compress the image.' }

    const name = file.name.replace(/\.[^.]+$/, '') + '.webp'
    return { file: new File([blob], name, { type: 'image/webp' }) }
  } catch {
    return { error: 'Could not read the image file.' }
  } finally {
    URL.revokeObjectURL(url)
  }
}

function loadVideo(url: string): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    video.onloadedmetadata = () => resolve(video)
    video.onerror = () => reject(new Error('Could not read the video file.'))
    video.src = url
  })
}

/** Re-encode a video down to 480p WebM by drawing it into an offscreen canvas
 * and recording that. Silent (canvas has no audio track) — fine for a canvas
 * loop. Returns null if the browser can't do it, so callers can fall back. */
async function reencodeCanvas(video: HTMLVideoElement): Promise<Blob | null> {
  if (typeof MediaRecorder === 'undefined') return null

  const canvas = document.createElement('canvas')
  canvas.width = CANVAS_OUTPUT_W
  canvas.height = CANVAS_OUTPUT_H
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : 'video/webm'

  const stream = canvas.captureStream(30)
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: CANVAS_BITRATE })
  const chunks: Blob[] = []
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data)
  }

  const recorded = new Promise<Blob>((resolve) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: 'video/webm' }))
  })

  recorder.start()

  video.currentTime = 0
  await video.play()

  const drawFrame = (): void => {
    if (video.ended || video.paused) return
    ctx.drawImage(video, 0, 0, CANVAS_OUTPUT_W, CANVAS_OUTPUT_H)
    requestAnimationFrame(drawFrame)
  }
  requestAnimationFrame(drawFrame)

  await new Promise<void>((resolve) => {
    video.onended = () => resolve()
  })

  recorder.stop()
  return recorded
}

/** Validate a 1080×1920 canvas and return a 480p WebM (or the original if the
 * browser can't re-encode). */
export async function prepareCanvas(file: File): Promise<PrepareResult> {
  const url = URL.createObjectURL(file)
  try {
    const video = await loadVideo(url)
    if (video.videoWidth !== CANVAS_INPUT_W || video.videoHeight !== CANVAS_INPUT_H) {
      return {
        error: `Canvas must be ${CANVAS_INPUT_W}×${CANVAS_INPUT_H}px (got ${video.videoWidth}×${video.videoHeight}).`
      }
    }

    try {
      const blob = await reencodeCanvas(video)
      if (blob && blob.size > 0) {
        const name = file.name.replace(/\.[^.]+$/, '') + '.webm'
        return { file: new File([blob], name, { type: 'video/webm' }) }
      }
    } catch {
      // Fall through to uploading the original below.
    }

    // Best-effort failed — keep the (valid) original so the upload still works.
    return { file }
  } catch {
    return { error: 'Could not read the video file.' }
  } finally {
    URL.revokeObjectURL(url)
  }
}
