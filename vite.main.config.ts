import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@utils': resolve(__dirname, 'src/common/utils'),
      static: resolve(__dirname, 'static'),
    },
  },
  build: {
    rollupOptions: {
      // ws's optional C++ addons cannot be bundled
      external: ['bufferutil', 'utf-8-validate'],
    },
  },
});
