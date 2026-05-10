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
    allowedHosts: ['7964-2405-9800-b661-61ac-68f7-1f2b-34eb-98b3.ngrok-free.app'],
    hmr: { protocol: 'https', host: '7964-2405-9800-b661-61ac-68f7-1f2b-34eb-98b3.ngrok-free.app', port: 443 },
    proxy: {
      '/api': 'http://localhost:3000',
      '/auth': 'http://localhost:3000',
    },
  },
});
