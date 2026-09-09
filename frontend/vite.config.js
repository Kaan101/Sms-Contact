import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true, // Ağ üzerinden erişime izin ver
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // Üretim ortamında kaynak haritalarını kapat
    chunkSizeWarningLimit: 1600, // Uyarı limitini artır
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Büyük kütüphaneleri ayrı dosyalara böl
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('leaflet') || id.includes('react-leaflet')) {
              return 'vendor-leaflet';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-lucide';
            }
            return 'vendor-other';
          }
        },
      },
    },
  },
});