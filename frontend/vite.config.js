import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true, // Ağ üzerinden erişime izin ver
  },
  resolve: {
    alias: {
      // Vite derleyicisine exceljs'in tarayıcı dostu versiyonunu kullanmasını söylüyoruz
      'exceljs': 'exceljs/dist/exceljs.min.js'
    }
  },
  build: {
    // ExcelJS'in bağımlılıklarını tarayıcı ortamında sorunsuz paketleyebilmesi için:
    commonjsOptions: {
      transformMixedEsModules: true,
    }
  }
});