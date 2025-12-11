import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // Atualiza o app automaticamente quando houver nova versão
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'cigaRats',
        short_name: 'cigaRats',
        description: 'A rede social para quem queima um.',
        theme_color: '#0f172a', // Cor de fundo da barra de status (slate-900)
        background_color: '#020617', // Cor de fundo do app (slate-950)
        display: 'standalone', // Faz parecer app nativo (sem barra de URL)
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png', // <--- Verifique se o nome do seu arquivo é esse
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png', // <--- Verifique se o nome do seu arquivo é esse
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      }
    })
  ],
})