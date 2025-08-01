import ElementPlus from 'unplugin-element-plus/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    vue(),
    ElementPlus({
      format: 'esm',
    }),
  ],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        target: 'http://localhost:8089/api',
        ws: true,
      },
    },
  },
  resolve: {
    alias: {
      '#': '/src',
    },
  },
  define: {
    __VUE_I18N_FULL_INSTALL__: true,
    __VUE_I18N_LEGACY_API__: false,
    __INTLIFY_PROD_DEVTOOLS__: false,
  },
});
function vue(): import('vite').PluginOption {
  throw new Error('Function not implemented.');
}
