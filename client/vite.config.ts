import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      devOptions: { enabled: true, type: 'module' },
      manifest: {
        name: 'TH Dividend Calendar',
        short_name: 'DivCal',
        description: 'Thai stock XD and dividend pay date calendar',
        theme_color: '#1a56db',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
  server: {
    ...(process.env.NGROK_HOST && {
      allowedHosts: [process.env.NGROK_HOST],
      hmr: { protocol: 'wss', host: process.env.NGROK_HOST, port: 443 },
    }),
    proxy: {
      '/api': 'http://localhost:3000',
      '/auth': 'http://localhost:3000',
    },
  },
});
