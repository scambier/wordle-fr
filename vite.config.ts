import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import Icons from 'unplugin-icons/vite'
import { fileURLToPath, URL } from 'url'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

process.env.VITE_BUILD_DATE = new Date().toISOString()

// https://vitejs.dev/config/
export default defineConfig({
  base: '/motus2/',
  plugins: [
    vue(),
    Icons({ autoInstall: true }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'icons/favicon.png',
        'robots.txt',
        'icons/apple-touch-icon.png',
      ],
      manifest: {
        name: 'Mo-Mo-Motus',
        short_name: 'Motus',
        description: 'Découvrez le mot secret en six essais',
        theme_color: '#198A42',
        icons: [
          {
            src: 'icons/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icons/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      $fonts: resolve('./public/fonts'),
    },
  },
})
