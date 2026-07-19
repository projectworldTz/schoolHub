/// <reference types="vitest/config" />
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // Static-asset precaching only (JS/CSS/HTML/fonts/icons) — the app
      // shell loads with zero connectivity. Deliberately NOT caching API
      // responses at the service-worker level: React Query's persisted
      // cache (see main.tsx) already handles "show last-known data
      // offline" at the app layer, where it can respect auth and get
      // cleared on logout. A service-worker-level API cache would be a
      // second, harder-to-invalidate copy of the same data with none of
      // that logout-safety.
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
      },
      manifest: {
        name: 'SchoolHub Africa',
        short_name: 'SchoolHub',
        description: 'Multi-tenant School ERP for African schools',
        theme_color: '#863bff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 5173,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
