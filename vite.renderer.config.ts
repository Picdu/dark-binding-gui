import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@utils': resolve(__dirname, 'src/common/utils'),
      '@components': resolve(__dirname, 'src/renderer/components'),
      '@containers': resolve(__dirname, 'src/renderer/containers'),
      '@lcu': resolve(__dirname, 'src/renderer/store/lcu'),
      '@groups': resolve(__dirname, 'src/renderer/store/groups'),
      '@bindings': resolve(__dirname, 'src/renderer/store/bindings'),
      '@types': resolve(__dirname, 'src/renderer/store/types.ts'),
      static: resolve(__dirname, 'static'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Let SCSS resolve `~pkg` imports (react-hextech theme) without node-sass webpack syntax
        importer: [
          url => {
            if (url.startsWith('~')) {
              return {
                file: resolve(__dirname, 'node_modules', url.slice(1)),
              };
            }
            return null;
          },
        ],
      },
    },
  },
});
