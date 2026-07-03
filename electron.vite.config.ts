import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {},
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
