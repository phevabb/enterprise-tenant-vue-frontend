import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'
import autoprefixer from 'autoprefixer'

export default defineConfig({
  plugins: [vue()],
  base: './',

  // ✅ CSS CONFIG GOES INSIDE defineConfig
  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: ['all'],   // <-- THIS IS THE FIX
      },
    },
    postcss: {
      plugins: [
        autoprefixer(),
      ],
    },
  },

  resolve: {
    alias: [
      {
        find: /^~(.*)$/,
        replacement: '$1',
      },
      {
        find: '@/',
        replacement: `${path.resolve(__dirname, 'src')}/`,
      },
      {
        find: '@',
        replacement: path.resolve(__dirname, '/src'),
      },
    ],
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue', '.scss'],
  },

  server: {
    port: 3000,
  },
})
