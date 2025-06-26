import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // 忽略TypeScript类型检查
      babel: {
        parserOpts: {
          plugins: ['decorators-legacy']
        }
      }
    })
  ],

  // TypeScript配置 - 忽略类型检查
  esbuild: {
    // 在构建时忽略TypeScript错误
    logOverride: {
      'this-is-undefined-in-esm': 'silent',
      'empty-import-meta': 'silent'
    },
    // 忽略所有TypeScript错误
    ignoreAnnotations: true,
  },
  
  // Define entry points for single-page application
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
    // Ensure assets are properly handled
    assetsDir: 'assets',
    // Keep existing file names for compatibility
    chunkSizeWarningLimit: 1000,
  },

  // Development server configuration
  server: {
    port: 3003,
    host: true,
    // Proxy configuration for backend API calls
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/ws': {
        target: 'ws://127.0.0.1:3000',
        ws: true,
        changeOrigin: true,
      },
      // Game server proxy
      '/socket.io': {
        target: 'ws://127.0.0.1:3000',
        ws: true,
        changeOrigin: true,
        secure: false,
      },
    },
  },

  // Path resolution
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@hooks': resolve(__dirname, 'src/hooks'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@types': resolve(__dirname, 'src/types'),
      '@assets': resolve(__dirname, 'assets'),
    },
  },

  // Ensure proper handling of legacy JS files
  optimizeDeps: {
    include: ['react', 'react-dom', '@rainbow-me/rainbowkit', 'wagmi', 'viem'],
    exclude: ['js/app.js', 'js/canvas.js', 'js/render.js'], // Keep game files as-is
  },

  // Public directory for static assets
  publicDir: 'public',

  // Define global constants
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
    __PROD__: JSON.stringify(process.env.NODE_ENV === 'production'),
  },

  // CSS configuration
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`,
      },
    },
  },

  // Ensure proper handling of different file types
  assetsInclude: ['**/*.mp3', '**/*.wav', '**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg'],
})
