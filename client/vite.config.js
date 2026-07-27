/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'

const apiTarget = process.env.VITE_API_URL || 'http://localhost:3000'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['vite.svg', 'icons/icon.svg'],
      manifest: {
        name: 'VitaSuite - Health Monitoring',
        short_name: 'VitaSuite',
        description: 'Health monitoring web application with BMI tracking, blood sugar, vital signs, and more',
        theme_color: '#0d1b2a',
        background_color: '#0d1b2a',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          { src: '/icons/icon.svg', sizes: 'any', type: 'image/svg+xml' },
          { src: '/icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/.*\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 3600 },
            },
          },
          {
            urlPattern: /^https?:\/\/.*\/socket\.io\/.*/i,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      '/api': apiTarget,
      '/socket.io': {
        target: apiTarget,
        ws: true,
      },
    }
  },
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
