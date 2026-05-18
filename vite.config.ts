import { defineConfig } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id: string) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

function inlineAssets() {
  return {
    name: 'inline-assets',
    generateBundle(_opts: any, bundle: any) {
      const html = bundle['index.html']
      if (!html) return

      let source = html.source as string

      // Inline CSS: replace <link rel="stylesheet" href="..."> with inline <style>
      source = source.replace(
        /<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g,
        (_: string, href: string) => {
          const cssFile = href.split('/').pop()!
          const cssChunk = bundle[cssFile]
          if (cssChunk) {
            return `<style>${cssChunk.source}</style>`
          }
          return _
        },
      )

      // Inline JS: replace <script type="module" crossorigin src="..."> with inline <script>
      source = source.replace(
        /<script[^>]*src="([^"]+)"[^>]*><\/script>/g,
        (_: string, src: string) => {
          const jsFile = src.split('/').pop()!
          const jsChunk = bundle[jsFile]
          if (jsChunk) {
            return `<script>${jsChunk.source}</script>`
          }
          return _
        },
      )

      // Remove the now-unused JS and CSS chunks since they're inlined
      for (const name of Object.keys(bundle)) {
        if (name !== 'index.html') {
          delete bundle[name]
        }
      }

      html.source = source
    },
  }
}

export default defineConfig({
  base: './',
  build: {
    cssCodeSplit: false,
  },
  plugins: [
    figmaAssetResolver(),
    react(),
    tailwindcss(),
    inlineAssets(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
