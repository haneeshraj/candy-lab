import { resolve } from 'path'
import { execSync } from 'child_process'
import { readFileSync } from 'fs'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'

// App metadata baked in at build/dev time and exposed to the main process as the
// `__APP_INFO__` global (see `src/main/env.d.ts`), which serves it over IPC.
const pkg = JSON.parse(readFileSync(resolve('package.json'), 'utf-8'))

function gitCommit(): string {
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
  } catch {
    return 'unknown' // not a git checkout (e.g. packaged source)
  }
}

const appInfo = {
  name: pkg.productName ?? pkg.name ?? '',
  version: pkg.version ?? '',
  description: pkg.description ?? '',
  author: typeof pkg.author === 'string' ? pkg.author : (pkg.author?.name ?? ''),
  license: pkg.license ?? 'UNLICENSED',
  homepage: pkg.homepage ?? '',
  commit: gitCommit(),
  buildDate: new Date().toISOString()
}

const define = {
  __APP_INFO__: JSON.stringify(appInfo),
  __UPDATE_TOKEN__: JSON.stringify('')
}

export default defineConfig({
  main: { define },
  preload: {},
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    css: {
      preprocessorOptions: {
        scss: {
          // Let any file (including `*.module.scss`) resolve the shared layers
          // with short paths, e.g. `@use 'abstracts' as *;`.
          loadPaths: [resolve('src/renderer/src/styles')]
        }
      }
    },
    plugins: [react()]
  }
})
